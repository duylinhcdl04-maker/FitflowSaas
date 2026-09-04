import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { toSeconds } from '../common/utils/duration';
import type { JwtPayload } from '../common/types/jwt-payload';
import type { RoleCode } from '../common/types/role';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Shared login for Super Admin (`user_type = PLATFORM`), Owner/staff
   * (`user_type = TENANT`) and Customer (`user_type = CUSTOMER`) — same
   * email/password flow for everyone; the Customer Portal (dynamic QR) is a
   * separate in-app surface used *after* login, not a different login method.
   */
  async login(dto: LoginDto, expectedTenantId?: string | null) {
    const user = await this.prisma.user.findFirst({
      where: {
        user_type: { in: ['PLATFORM', 'TENANT', 'CUSTOMER'] },
        email: { equals: dto.email, mode: 'insensitive' },
      },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        this.statusMessage(user.status, 'Tài khoản'),
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Nếu request đăng nhập từ tenant context cụ thể (subdomain / tenant header)
    if (expectedTenantId && user.user_type !== 'PLATFORM') {
      if (user.tenant_id !== expectedTenantId) {
        throw new UnauthorizedException(
          'Tài khoản này không thuộc cửa hàng hiện tại',
        );
      }
    }

    // BR-SA-003: a suspended/inactive tenant blocks login for every user under it.
    // Not reachable for PLATFORM users today (tenant_id is always null) but kept
    // so this same login path stays correct once tenant-side auth reuses it.
    if (user.tenant_id) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenant_id },
        select: { status: true },
      });
      if (
        tenant &&
        (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE')
      ) {
        throw new ForbiddenException(
          this.statusMessage(tenant.status, 'Cửa hàng'),
        );
      }
    }

    const roles = await this.rolesFor(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = this.issueTokens({
      sub: user.id,
      tenantId: user.tenant_id,
      userType: user.user_type as JwtPayload['userType'],
      roles,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        tenantId: user.tenant_id,
        roles,
        mustChangePassword: user.must_change_password,
      },
    };
  }

  async refresh(refreshToken: string) {
    let sub: string;
    try {
      const decoded = await this.jwt.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: process.env.JWT_REFRESH_SECRET },
      );
      sub = decoded.sub;
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Phiên đăng nhập không còn hợp lệ');
    }

    const roles = await this.rolesFor(user.id);

    return this.issueTokens({
      sub: user.id,
      tenantId: user.tenant_id,
      userType: user.user_type as JwtPayload['userType'],
      roles,
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      tenantId: user.tenant_id,
      userType: user.user_type,
      roles: await this.rolesFor(user.id),
      mustChangePassword: user.must_change_password,
    };
  }

  /**
   * OW-01: issues a normal session for a user right after they verify their
   * OTP, so registration doesn't force a second manual login. Shares the same
   * token-issuing logic as login() — kept in sync by construction.
   */
  async issueSessionForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const roles = await this.rolesFor(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = this.issueTokens({
      sub: user.id,
      tenantId: user.tenant_id,
      userType: user.user_type as JwtPayload['userType'],
      roles,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles,
        mustChangePassword: user.must_change_password,
      },
    };
  }

  /** Signs a short-lived access token for a Super Admin impersonation session. */
  signImpersonationToken(payload: JwtPayload, expiresIn = '20m') {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: toSeconds(expiresIn),
    });
  }

  async rolesFor(userId: string): Promise<RoleCode[]> {
    const links = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: true },
    });
    return links.map((link) => link.roles.code as RoleCode);
  }

  private issueTokens(payload: JwtPayload) {
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: toSeconds(process.env.JWT_ACCESS_EXPIRES_IN ?? '15m'),
    });
    const refreshToken = this.jwt.sign(
      { sub: payload.sub },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: toSeconds(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'),
      },
    );
    return { accessToken, refreshToken };
  }

  private statusMessage(status: string, subject: string) {
    switch (status) {
      case 'SUSPENDED':
        return `${subject} đang bị tạm ngưng`;
      case 'INACTIVE':
        return `${subject} đã ngừng hoạt động`;
      case 'LOCKED':
        return `${subject} đang bị khoá`;
      case 'PENDING':
        return `${subject} chưa được kích hoạt`;
      default:
        return `${subject} không thể đăng nhập`;
    }
  }
}
