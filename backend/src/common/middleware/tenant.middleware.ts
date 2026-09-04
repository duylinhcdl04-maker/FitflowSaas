import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { TenantResolverService } from '../../tenants/tenant-resolver.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantResolver: TenantResolverService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = this.tenantResolver.extractSlugFromRequest(req);
    if (slug) {
      const tenant = await this.tenantResolver.findTenantBySlug(slug);
      req.tenant = tenant;
    } else {
      req.tenant = null;
    }
    next();
  }
}
