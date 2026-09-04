import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestTenant } from '../types/request-tenant';

/**
 * Reads the resolved tenant context attached to req.tenant by TenantMiddleware.
 * Usage: @CurrentTenant() tenant: RequestTenant | null
 *        @CurrentTenant('id') tenantId: string
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof RequestTenant | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant: RequestTenant | null = request.tenant;
    return data ? tenant?.[data] : tenant;
  },
);
