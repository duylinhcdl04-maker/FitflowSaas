import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { SubscriptionsService } from './subscriptions.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  list() {
    return this.subscriptionsService.list();
  }

  @Get(':tenantId')
  get(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getByTenant(tenantId);
  }

  @Get(':tenantId/invoices')
  invoices(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.invoices(tenantId);
  }

  // SA-08 wizard step 2 — preview only.
  @Get(':tenantId/plan-change-check')
  checkPlanChange(
    @Param('tenantId') tenantId: string,
    @Query('planCode') planCode: string,
  ) {
    return this.subscriptionsService.checkPlanChangeConflicts(
      tenantId,
      planCode,
    );
  }

  @Patch(':tenantId')
  update(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.subscriptionsService.update(tenantId, dto, actor);
  }
}
