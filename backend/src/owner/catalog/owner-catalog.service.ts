import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

// Membership đang "sống" theo BR-OWN-002 — Package có ít nhất một Membership
// ở các trạng thái này là bất biến (chỉ đổi status, không sửa quyền lợi/giá).
const LIVE_MEMBERSHIP_STATUSES = ['SCHEDULED', 'ACTIVE', 'FROZEN'] as const;

@Injectable()
export class OwnerCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Services ----------

  listServices(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'asc' },
    });
  }

  async createService(
    tenantId: string,
    dto: CreateServiceDto,
    actor: RequestUser,
  ) {
    const code = await this.generateUniqueServiceCode(tenantId, dto.name);
    const service = await this.prisma.service.create({
      data: {
        tenant_id: tenantId,
        code,
        name: dto.name,
        description: dto.description,
        icon_url: dto.iconUrl,
        status: 'ACTIVE',
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SERVICE',
      entityId: service.id,
      action: 'SERVICE_CREATED',
      afterData: { code, name: dto.name },
    });

    return service;
  }

  // ---------- Membership Packages ----------

  async listPackages(tenantId: string) {
    const packages = await this.prisma.membershipPackage.findMany({
      where: { tenant_id: tenantId },
      orderBy: { display_order: 'asc' },
      include: {
        _count: { select: { memberships: true } },
        package_branches: {
          include: { branches: { select: { id: true, name: true } } },
        },
      },
    });
    return packages.map((p) => this.toPackageDto(p));
  }

  async createPackage(
    tenantId: string,
    dto: CreatePackageDto,
    actor: RequestUser,
  ) {
    if (!dto.name || dto.name.trim().length < 2) {
      throw new BadRequestException('Tên gói tập phải có ít nhất 2 ký tự');
    }
    if (dto.basePrice === undefined || dto.basePrice === null || Number(dto.basePrice) < 0) {
      throw new BadRequestException('Giá bán gói tập không được nhỏ hơn 0');
    }
    if (dto.durationValue === undefined || dto.durationValue === null || Number(dto.durationValue) < 1) {
      throw new BadRequestException('Thời hạn gói tập phải ít nhất là 1');
    }

    const branchAccessScope = dto.branchAccessScope ?? 'HOME_BRANCH';
    if (branchAccessScope === 'ALL_BRANCHES') {
      await this.assertMultiBranchEntitlement(tenantId);
    }

    const branchIds = await this.assertBranchesBelongToTenant(
      tenantId,
      dto.branchIds,
    );

    const code = await this.generateUniquePackageCode(tenantId, dto.name);
    const pkg = await this.prisma.membershipPackage.create({
      data: {
        tenant_id: tenantId,
        code,
        name: dto.name,
        description: dto.description,
        package_type: 'MEMBERSHIP',
        duration_value: dto.durationValue,
        duration_unit: dto.durationUnit,
        branch_access_scope: branchAccessScope,
        max_checkins_per_day: dto.maxCheckinsPerDay,
        base_price: dto.basePrice,
        freeze_allowed_days: dto.freezeAllowedDays ?? 0,
        status: 'ACTIVE',
        created_by: actor.id,
        ...(branchIds.length > 0
          ? {
              package_branches: {
                create: branchIds.map((branchId) => ({ branch_id: branchId })),
              },
            }
          : {}),
      },
      include: {
        package_branches: {
          include: { branches: { select: { id: true, name: true } } },
        },
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'MEMBERSHIP_PACKAGE',
      entityId: pkg.id,
      action: 'PACKAGE_CREATED',
      afterData: { code, name: dto.name, basePrice: dto.basePrice, branchIds },
    });

    return this.toPackageDto({ ...pkg, _count: { memberships: 0 } });
  }

  async updatePackage(
    tenantId: string,
    id: string,
    dto: UpdatePackageDto,
    actor: RequestUser,
  ) {
    const pkg = await this.prisma.membershipPackage.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập');

    const liveCount = await this.prisma.membership.count({
      where: {
        tenant_id: tenantId,
        package_id: id,
        status: { in: [...LIVE_MEMBERSHIP_STATUSES] },
      },
    });

    // BR-OWN-002: gói đã có khách đang dùng là bất biến — chỉ cho đổi status
    // hoặc phạm vi BÁN (branchIds). branchIds không ảnh hưởng hội viên đã mua
    // (chỉ quyết định chi nhánh nào được tiếp tục bán gói này cho khách mới),
    // nên được phép đổi ngay cả khi gói đang có người dùng.
    if (liveCount > 0) {
      const onlyAllowedFieldsChanged = Object.keys(dto).every(
        (k) => k === 'status' || k === 'branchIds',
      );
      if (!onlyAllowedFieldsChanged) {
        throw new BadRequestException(
          `Gói này đang có ${liveCount} hội viên sử dụng — chỉ được ngừng bán (status) hoặc đổi chi nhánh áp dụng, không được sửa quyền lợi/giá/thời hạn.`,
        );
      }
    }

    if (dto.branchAccessScope === 'ALL_BRANCHES') {
      await this.assertMultiBranchEntitlement(tenantId);
    }

    const branchIds =
      dto.branchIds !== undefined
        ? await this.assertBranchesBelongToTenant(tenantId, dto.branchIds)
        : undefined;

    const updated = await this.prisma.membershipPackage.update({
      where: { id },
      data: {
        ...(liveCount > 0
          ? { status: dto.status }
          : {
              name: dto.name,
              description: dto.description,
              duration_value: dto.durationValue,
              duration_unit: dto.durationUnit,
              branch_access_scope: dto.branchAccessScope,
              max_checkins_per_day: dto.maxCheckinsPerDay,
              base_price: dto.basePrice,
              freeze_allowed_days: dto.freezeAllowedDays,
              status: dto.status,
            }),
        ...(branchIds !== undefined
          ? {
              package_branches: {
                deleteMany: {},
                create: branchIds.map((branchId) => ({ branch_id: branchId })),
              },
            }
          : {}),
      },
      include: {
        _count: { select: { memberships: true } },
        package_branches: {
          include: { branches: { select: { id: true, name: true } } },
        },
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'MEMBERSHIP_PACKAGE',
      entityId: id,
      action: 'PACKAGE_UPDATED',
      beforeData: pkg,
      afterData: dto,
    });

    return this.toPackageDto(updated);
  }

  /** Xác thực các branchId thuộc đúng Tenant — package_branches không có cột tenant_id riêng. */
  private async assertBranchesBelongToTenant(
    tenantId: string,
    branchIds: string[] | undefined,
  ) {
    const ids = [...new Set(branchIds ?? [])];
    if (ids.length === 0) return ids;
    const count = await this.prisma.branch.count({
      where: { id: { in: ids }, tenant_id: tenantId },
    });
    if (count !== ids.length) {
      throw new BadRequestException(
        'Có chi nhánh không hợp lệ trong danh sách đã chọn',
      );
    }
    return ids;
  }

  private toPackageDto(pkg: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    duration_value: number;
    duration_unit: string;
    branch_access_scope: string;
    base_price: unknown;
    status: string;
    _count: { memberships: number };
    package_branches: { branches: { id: string; name: string } }[];
  }) {
    return {
      id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      duration_value: pkg.duration_value,
      duration_unit: pkg.duration_unit,
      branch_access_scope: pkg.branch_access_scope,
      base_price: pkg.base_price,
      status: pkg.status,
      _count: pkg._count,
      appliesToAllBranches: pkg.package_branches.length === 0,
      branches: pkg.package_branches.map((pb) => pb.branches),
    };
  }

  private async assertMultiBranchEntitlement(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
      include: {
        saas_plans: {
          include: {
            saas_plan_features: { include: { platform_features: true } },
          },
        },
      },
    });
    const enabled = subscription?.saas_plans.saas_plan_features.some(
      (f) => f.platform_features.code === 'MULTI_BRANCH' && f.is_enabled,
    );
    if (!enabled) {
      throw new BadRequestException(
        'Gói hiện tại chưa mở khoá tính năng đa chi nhánh (MULTI_BRANCH)',
      );
    }
  }

  private async generateUniqueServiceCode(tenantId: string, name: string) {
    const base = this.slugifyCode(name) || 'dich-vu';
    let candidate = base;
    let suffix = 1;
    while (
      await this.prisma.service.findUnique({
        where: { tenant_id_code: { tenant_id: tenantId, code: candidate } },
      })
    ) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  private async generateUniquePackageCode(tenantId: string, name: string) {
    const base = this.slugifyCode(name) || 'goi-tap';
    let candidate = base;
    let suffix = 1;
    while (
      await this.prisma.membershipPackage.findUnique({
        where: { tenant_id_code: { tenant_id: tenantId, code: candidate } },
      })
    ) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  private slugifyCode(name: string) {
    return name
      .normalize('NFD')
      .split('')
      .filter((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return code < 0x0300 || code > 0x036f;
      })
      .join('')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }
}
