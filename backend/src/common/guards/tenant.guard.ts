import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { RequestUser } from '../types/jwt-payload';
import type { RequestTenant } from '../types/request-tenant';
import { REQUIRE_TENANT_KEY } from '../decorators/require-tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tenant: RequestTenant | null = request.tenant ?? null;
    const user: RequestUser | undefined = request.user as RequestUser | undefined;

    const isTenantRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 1. Nếu route yêu cầu tenant context bắt buộc
    if (isTenantRequired) {
      if (!tenant) {
        throw new NotFoundException(
          'Không xác định được cửa hàng từ địa chỉ truy cập',
        );
      }
      if (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
        throw new ForbiddenException(
          'Cửa hàng này đang bị tạm ngưng hoặc ngừng hoạt động',
        );
      }
    }

    // 2. Chống Tenant Switching (Security):
    // Nếu request có cả tenant context lẫn user JWT (không phải PLATFORM Super Admin)
    if (tenant && user && user.userType !== 'PLATFORM') {
      if (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
        throw new ForbiddenException(
          'Cửa hàng này đang bị tạm ngưng hoặc ngừng hoạt động',
        );
      }

      if (user.tenantId && user.tenantId !== tenant.id) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập dữ liệu của cửa hàng này',
        );
      }
    }

    return true;
  }
}
