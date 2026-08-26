import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { writeAuditLog } from '../../common/utils/audit';
import { generateTempPassword } from '../../common/utils/temp-password';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateBranchManagerDto } from './dto/create-branch-manager.dto';
import { UpdateBranchManagerDto } from './dto/update-branch-manager.dto';
import { AssignBranchDto } from './dto/assign-branch.dto';

// OW-11b. Quản lý chi nhánh — tách riêng khỏi owner/staff (mời qua link):
// Owner nhập gmail + thông tin cơ bản, hệ thống tự sinh mật khẩu và kích hoạt
// (ACTIVE) ngay, gửi tài khoản + mật khẩu qua email — không chờ xác thực,
// không trả mật khẩu qua API (chỉ tồn tại trong email, giống nguyên tắc đã
// áp dụng cho OTP). Một Quản lý chỉ phụ trách đúng 1 chi nhánh tại một thời
// điểm — "chưa được giao" nghĩa là chưa có dòng nào trong user_branches.
@Injectable()
export class OwnerBranchManagersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async list(tenantId: string) {
    const managers = await this.findManagerUsers(tenantId);
    return managers.map((u) => this.toDto(u));
  }

  async listUnassigned(tenantId: string) {
    const managers = await this.findManagerUsers(tenantId);
    return managers
      .filter((u) => u.status === 'ACTIVE' && u.user_branches.length === 0)
      .map((u) => this.toDto(u));
  }

  async create(
    tenantId: string,
    dto: CreateBranchManagerDto,
    actor: RequestUser,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('Email này đã được sử dụng');

    // uq_user_phone_tenant: số điện thoại là duy nhất trong phạm vi Tenant —
    // kiểm tra trước để trả lỗi rõ ràng thay vì để crash ở tầng DB (P2002).
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { tenant_id: tenantId, phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Số điện thoại này đã được sử dụng trong doanh nghiệp của bạn',
        );
      }
    }

    const role = await this.prisma.roles.findUnique({
      where: { code: ROLE.BRANCH_MANAGER },
    });
    if (!role)
      throw new BadRequestException(
        'Thiếu cấu hình role BRANCH_MANAGER trong hệ thống',
      );

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenant_id: tenantId,
          user_type: 'TENANT',
          email: dto.email,
          phone: dto.phone,
          full_name: dto.fullName,
          password_hash: passwordHash,
          status: 'ACTIVE',
          must_change_password: true,
          created_by: actor.id,
        },
      });
      await tx.user_roles.create({
        data: {
          user_id: created.id,
          role_id: role.id,
          tenant_id: tenantId,
          assigned_by: actor.id,
        },
      });
      return created;
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    await this.mailService.sendAccountCredentialsEmail(
      dto.email,
      dto.fullName,
      tenant?.name ?? 'FitFlow',
      temporaryPassword,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: user.id,
      action: 'BRANCH_MANAGER_CREATED',
      afterData: { email: dto.email, fullName: dto.fullName },
    });

    return this.toDto({ ...user, user_branches: [] });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateBranchManagerDto,
    actor: RequestUser,
  ) {
    const before = await this.findOneManagerUser(tenantId, id);

    if (dto.phone && dto.phone !== before.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { tenant_id: tenantId, phone: dto.phone, id: { not: id } },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Số điện thoại này đã được sử dụng trong doanh nghiệp của bạn',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        full_name: dto.fullName,
        phone: dto.phone,
        status: dto.status,
        deactivated_at:
          dto.status === 'INACTIVE'
            ? new Date()
            : dto.status === 'ACTIVE'
              ? null
              : undefined,
      },
      include: { user_branches: { include: { branches: true } } },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: id,
      action: 'BRANCH_MANAGER_UPDATED',
      beforeData: {
        fullName: before.full_name,
        phone: before.phone,
        status: before.status,
      },
      afterData: dto,
    });

    return this.toDto(updated);
  }

  async resetPassword(tenantId: string, id: string, actor: RequestUser) {
    const manager = await this.findOneManagerUser(tenantId, id);

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash, must_change_password: true },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    await this.mailService.sendAccountCredentialsEmail(
      manager.email!,
      manager.full_name,
      tenant?.name ?? 'FitFlow',
      temporaryPassword,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: id,
      action: 'BRANCH_MANAGER_PASSWORD_RESET',
    });

    return { email: manager.email, fullName: manager.full_name };
  }

  async assignBranch(
    tenantId: string,
    id: string,
    dto: AssignBranchDto,
    actor: RequestUser,
  ) {
    await this.findOneManagerUser(tenantId, id);
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenant_id: tenantId },
    });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh');

    await this.prisma.$transaction([
      this.prisma.user_branches.deleteMany({
        where: { user_id: id, tenant_id: tenantId },
      }),
      this.prisma.user_branches.create({
        data: {
          user_id: id,
          branch_id: dto.branchId,
          tenant_id: tenantId,
          is_primary: true,
          assigned_by: actor.id,
        },
      }),
    ]);

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: id,
      action: 'BRANCH_MANAGER_ASSIGNED',
      afterData: { branchId: dto.branchId, branchName: branch.name },
    });

    return this.toDto(await this.findOneManagerUser(tenantId, id));
  }

  async unassignBranch(tenantId: string, id: string, actor: RequestUser) {
    await this.findOneManagerUser(tenantId, id);
    await this.prisma.user_branches.deleteMany({
      where: { user_id: id, tenant_id: tenantId },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: id,
      action: 'BRANCH_MANAGER_UNASSIGNED',
    });

    return this.toDto(await this.findOneManagerUser(tenantId, id));
  }

  private findManagerUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        user_type: 'TENANT',
        user_roles: { some: { roles: { code: ROLE.BRANCH_MANAGER } } },
      },
      include: { user_branches: { include: { branches: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  private async findOneManagerUser(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        user_type: 'TENANT',
        user_roles: { some: { roles: { code: ROLE.BRANCH_MANAGER } } },
      },
      include: { user_branches: { include: { branches: true } } },
    });
    if (!user)
      throw new NotFoundException('Không tìm thấy tài khoản Quản lý chi nhánh');
    return user;
  }

  private toDto(user: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    last_login_at: Date | null;
    created_at: Date;
    user_branches: { branches: { id: string; name: string } }[];
  }) {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      branch: user.user_branches[0]
        ? {
            id: user.user_branches[0].branches.id,
            name: user.user_branches[0].branches.name,
          }
        : null,
    };
  }
}
