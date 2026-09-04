import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class OwnerBranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'asc' },
      include: { _count: { select: { customers: true, user_branches: true } } },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return Promise.all(
      branches.map(async (b) => {
        const checkinToday = await this.prisma.attendances.count({
          where: {
            tenant_id: tenantId,
            branch_id: b.id,
            check_in_at: { gte: todayStart },
            status: { not: 'CANCELLED' },
          },
        });
        return {
          id: b.id,
          code: b.code,
          name: b.name,
          address: b.address,
          phone: b.phone,
          email: b.email,
          status: b.status,
          memberCount: b._count.customers,
          staffCount: b._count.user_branches,
          checkinToday,
        };
      }),
    );
  }

  async get(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        _count: { select: { customers: true, user_branches: true } },
        user_branches: {
          include: {
            users: { include: { user_roles: { include: { roles: true } } } },
          },
        },
      },
    });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const checkinToday = await this.prisma.attendances.count({
      where: {
        tenant_id: tenantId,
        branch_id: id,
        check_in_at: { gte: todayStart },
        status: { not: 'CANCELLED' },
      },
    });

    return {
      id: branch.id,
      code: branch.code,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      openingDays: branch.opening_days,
      openingTime: this.formatTimeStr(branch.opening_time),
      closingTime: this.formatTimeStr(branch.closing_time),
      status: branch.status,
      memberCount: branch._count.customers,
      staffCount: branch._count.user_branches,
      checkinToday,
      staff: branch.user_branches.map((ub) => ({
        id: ub.users.id,
        fullName: ub.users.full_name,
        roles: ub.users.user_roles.map((ur) => ur.roles.code),
      })),
    };
  }

  /** OW-04a. BR-BRANCH-QUOTA-01: kiểm tra MAX_BRANCHES trước khi tạo chi nhánh mới. */
  async create(tenantId: string, dto: CreateBranchDto, actor: RequestUser) {
    await this.assertQuotaNotExceeded(tenantId);

    const code =
      dto.code ?? (await this.generateUniqueCode(tenantId, dto.name));
    const existing = await this.prisma.branch.findUnique({
      where: { tenant_id_code: { tenant_id: tenantId, code } },
    });
    if (existing) throw new ConflictException('Mã chi nhánh đã tồn tại');

    // OW-11b: chỉ chấp nhận các Quản lý chi nhánh còn "chưa được giao"
    // (không có dòng user_branches nào) — tránh cướp chi nhánh của người khác.
    const managerIds = [...new Set(dto.managerIds ?? [])];
    if (managerIds.length > 0) {
      await this.assertManagersAssignable(tenantId, managerIds);
    }

    const branch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: {
          tenant_id: tenantId,
          code,
          name: dto.name,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          opening_days: dto.openingDays,
          ...(dto.openingTime
            ? { opening_time: this.toTime(dto.openingTime) }
            : {}),
          ...(dto.closingTime
            ? { closing_time: this.toTime(dto.closingTime) }
            : {}),
          status: 'ACTIVE',
        },
      });

      if (managerIds.length > 0) {
        await tx.user_branches.createMany({
          data: managerIds.map((managerId) => ({
            user_id: managerId,
            branch_id: created.id,
            tenant_id: tenantId,
            is_primary: true,
            assigned_by: actor.id,
          })),
        });
      }

      return created;
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'BRANCH',
      entityId: branch.id,
      action: 'BRANCH_CREATED',
      afterData: { code: branch.code, name: branch.name, managerIds },
    });

    return branch;
  }

  private async assertManagersAssignable(
    tenantId: string,
    managerIds: string[],
  ) {
    const managers = await this.prisma.user.findMany({
      where: {
        id: { in: managerIds },
        tenant_id: tenantId,
        status: 'ACTIVE',
        user_roles: { some: { roles: { code: ROLE.BRANCH_MANAGER } } },
      },
      include: { _count: { select: { user_branches: true } } },
    });

    if (managers.length !== managerIds.length) {
      throw new BadRequestException(
        'Có Quản lý chi nhánh không hợp lệ trong danh sách đã chọn',
      );
    }
    const alreadyAssigned = managers.filter((m) => m._count.user_branches > 0);
    if (alreadyAssigned.length > 0) {
      throw new BadRequestException(
        `Quản lý ${alreadyAssigned.map((m) => m.full_name).join(', ')} đã được giao chi nhánh khác`,
      );
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateBranchDto,
    actor: RequestUser,
  ) {
    const before = await this.prisma.branch.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!before) throw new NotFoundException('Không tìm thấy chi nhánh');

    // BR-OWN-003: chi nhánh INACTIVE ngừng nhận check-in mới, nhưng dữ liệu
    // lịch sử (chấm công, giao dịch) vẫn giữ nguyên — chỉ đổi status ở đây,
    // không đụng tới bất kỳ bảng dữ liệu vận hành nào của chi nhánh.
    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        opening_days: dto.openingDays,
        ...(dto.openingTime
          ? { opening_time: this.toTime(dto.openingTime) }
          : {}),
        ...(dto.closingTime
          ? { closing_time: this.toTime(dto.closingTime) }
          : {}),
        status: dto.status,
        deactivated_at:
          dto.status === 'INACTIVE'
            ? new Date()
            : dto.status === 'ACTIVE'
              ? null
              : undefined,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'BRANCH',
      entityId: id,
      action: 'BRANCH_UPDATED',
      beforeData: before,
      afterData: dto,
    });

    return branch;
  }

  private async assertQuotaNotExceeded(tenantId: string) {
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
    const maxBranchesFeature = subscription?.saas_plans.saas_plan_features.find(
      (f) => f.platform_features.code === 'MAX_BRANCHES',
    );
    const limit = maxBranchesFeature?.quota_value ?? null; // null = không giới hạn
    if (limit === null) return;

    const currentCount = await this.prisma.branch.count({
      where: { tenant_id: tenantId },
    });
    if (currentCount >= limit) {
      throw new BadRequestException(
        `Đã đạt giới hạn ${limit} chi nhánh của gói hiện tại. Hãy nâng cấp gói để tạo thêm chi nhánh.`,
      );
    }
  }

  private async generateUniqueCode(tenantId: string, name: string) {
    const base =
      name
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
        .slice(0, 40) || 'chi-nhanh';

    let candidate = base;
    let suffix = 1;
    while (
      await this.prisma.branch.findUnique({
        where: { tenant_id_code: { tenant_id: tenantId, code: candidate } },
      })
    ) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  private toTime(hhmm: string) {
    const [h, m] = (hhmm || '00:00').split(':');
    const hh = String(h || '00').padStart(2, '0');
    const mm = String(m || '00').padStart(2, '0');
    return new Date(`1970-01-01T${hh}:${mm}:00.000Z`);
  }

  private formatTimeStr(t: Date | string | null | undefined): string | null {
    if (!t) return null;
    if (typeof t === 'string') {
      if (t.includes('T')) {
        const d = new Date(t);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return t.slice(0, 5);
    }
    if (t instanceof Date) {
      const hh = String(t.getUTCHours()).padStart(2, '0');
      const mm = String(t.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return null;
  }
}
