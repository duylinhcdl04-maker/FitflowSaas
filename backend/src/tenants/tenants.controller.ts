import { Controller, Get, Param } from '@nestjs/common';
import { TenantResolverService } from './tenant-resolver.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantResolver: TenantResolverService) {}

  /**
   * API TENANT RESOLUTION:
   * GET /api/v1/tenants/resolve/:slug
   * Trả về thông tin public cơ bản của tenant nếu hợp lệ, không chứa secret/JWT/password.
   */
  @Get('resolve/:slug')
  async resolveTenant(@Param('slug') slug: string) {
    const tenant = await this.tenantResolver.resolveBySlug(slug);
    return {
      success: true,
      data: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
      },
    };
  }
}
