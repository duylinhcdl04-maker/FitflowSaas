import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtPayload, RequestUser } from '../../common/types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RequestUser {
    // Tenant Isolation (Anti-Tenant Switching - Section 9):
    const tenant = req.tenant;
    if (tenant && payload.userType !== 'PLATFORM') {
      if (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
        throw new ForbiddenException(
          'Cửa hàng này đang bị tạm ngưng hoặc ngừng hoạt động',
        );
      }
      if (payload.tenantId && payload.tenantId !== tenant.id) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập dữ liệu của cửa hàng này',
        );
      }
    }

    const headerBranchId = req.headers['x-branch-id'];
    const queryBranchId = (req.query as Record<string, string> | undefined)?.branchId;
    const rawBranchId =
      typeof headerBranchId === 'string' && headerBranchId.trim()
        ? headerBranchId.trim()
        : typeof queryBranchId === 'string' && queryBranchId.trim()
          ? queryBranchId.trim()
          : undefined;

    return {
      ...payload,
      id: payload.sub,
      selectedBranchId: rawBranchId,
    };
  }
}
