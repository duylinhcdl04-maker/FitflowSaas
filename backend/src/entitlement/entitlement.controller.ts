import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ROLE } from '../common/types/role';
import type { RequestUser } from '../common/types/jwt-payload';
import { EntitlementService } from './entitlement.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER, ROLE.BRANCH_MANAGER, ROLE.SUPER_ADMIN)
@Controller('owner/subscription')
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  @Get('entitlements')
  async getEffectiveEntitlements(@CurrentUser() user: RequestUser) {
    const tenantId = user.tenantId;
    if (!tenantId) {
      return { message: 'Super admin has full platform privileges' };
    }
    return this.entitlementService.getEffectiveEntitlement(tenantId);
  }

  @Get('usage')
  async getUsageOverview(@CurrentUser() user: RequestUser) {
    const tenantId = user.tenantId;
    if (!tenantId) {
      return { usages: [] };
    }
    return this.entitlementService.getTenantUsageOverview(tenantId);
  }

  @Get('check-feature/:code')
  async checkFeature(
    @Param('code') code: string,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user.tenantId) return { enabled: true };
    await this.entitlementService.assertFeatureEnabled(user.tenantId, code);
    return { enabled: true, code };
  }

  @Get('check-integration/:code')
  async checkIntegration(
    @Param('code') code: string,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user.tenantId) return { enabled: true };
    await this.entitlementService.assertIntegrationEnabled(user.tenantId, code);
    return { enabled: true, code };
  }
}
