import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { generateTempPassword } from '../../common/utils/temp-password';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { QueryStaffDto } from './dto/query-staff.dto';

// SA-19: người dùng nội bộ FitFlow — user_type = PLATFORM, tenant_id = null.
const PLATFORM_USER_WHERE = { tenant_id: null, user_type: 'PLATFORM' } as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryStaffDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      ...PLATFORM_USER_WHERE,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                full_name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { user_roles: { include: { roles: true } } },
        orderBy: { created_at: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      rows.map((u) => this.toDto(u)),
      total,
      page,
      pageSize,
    );
  }

  async get(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...PLATFORM_USER_WHERE },
      include: { user_roles: { include: { roles: true } } },
    });
    if (!user)
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự nền tảng');
    return this.toDto(user);
  }

  async create(dto: CreateStaffDto, actor: RequestUser) {
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('Email này đã được sử dụng');

    const superAdminRole = await this.prisma.roles.findUnique({
      where: { code: ROLE.SUPER_ADMIN },
    });
    if (!superAdminRole) {
      throw new BadRequestException(
        'Thiếu cấu hình role SUPER_ADMIN trong hệ thống',
      );
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenant_id: null,
          user_type: 'PLATFORM',
          email: dto.email,
          phone: dto.phone,
          full_name: dto.fullName,
          password_hash: passwordHash,
          status: 'ACTIVE',
          created_by: actor.id,
        },
      });
      await tx.user_roles.create({
        data: {
          user_id: created.id,
          role_id: superAdminRole.id,
          tenant_id: null,
          assigned_by: actor.id,
        },
      });
      return created;
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PLATFORM_USER',
      entityId: user.id,
      action: 'STAFF_CREATED',
      afterData: { email: dto.email, fullName: dto.fullName },
    });

    return {
      user: this.toDto({ ...user, user_roles: [] }),
      temporaryPassword,
    };
  }

  async changeStatus(
    id: string,
    dto: UpdateStaffStatusDto,
    actor: RequestUser,
  ) {
    if (id === actor.id) {
      // Doc SA-19: "không ai tự vô hiệu hóa hoặc tự hạ quyền chính mình" —
      // guards against locking the whole team out of the platform.
      throw new BadRequestException(
        'Không thể tự thay đổi trạng thái tài khoản của chính mình',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id, ...PLATFORM_USER_WHERE },
    });
    if (!user)
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự nền tảng');
    if (user.status === dto.status) {
      throw new BadRequestException(`Tài khoản đã ở trạng thái ${dto.status}`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
        deactivated_at: dto.status === 'INACTIVE' ? new Date() : null,
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PLATFORM_USER',
      entityId: id,
      action: 'STAFF_STATUS_CHANGED',
      beforeData: { status: user.status },
      afterData: { status: dto.status },
      reason: dto.reason,
    });

    return this.toDto({ ...updated, user_roles: [] });
  }

  async resetPassword(
    id: string,
    dto: ResetStaffPasswordDto,
    actor: RequestUser,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...PLATFORM_USER_WHERE },
    });
    if (!user)
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự nền tảng');

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PLATFORM_USER',
      entityId: id,
      action: 'STAFF_PASSWORD_RESET',
      reason: dto.reason,
    });

    return { email: user.email, fullName: user.full_name, temporaryPassword };
  }

  private toDto(user: {
    id: string;
    email: string | null;
    phone: string | null;
    full_name: string;
    status: string;
    last_login_at: Date | null;
    created_at: Date;
    user_roles: { roles: { code: string } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      roles: user.user_roles.map((ur) => ur.roles.code),
    };
  }
}
