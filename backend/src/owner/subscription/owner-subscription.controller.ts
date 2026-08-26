import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerSubscriptionService } from './owner-subscription.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { MarkTransferredDto } from './dto/mark-transferred.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/subscription')
export class OwnerSubscriptionController {
  constructor(
    private readonly ownerSubscriptionService: OwnerSubscriptionService,
  ) {}

  @Get()
  getCurrent(@CurrentUser() actor: RequestUser) {
    return this.ownerSubscriptionService.getCurrent(actor.tenantId!);
  }

  @Get('plans')
  listPlans(@CurrentUser() actor: RequestUser) {
    return this.ownerSubscriptionService.listPlans(actor.tenantId!);
  }

  @Get('invoices')
  listInvoices(@CurrentUser() actor: RequestUser) {
    return this.ownerSubscriptionService.listInvoices(actor.tenantId!);
  }

  @Post('invoices')
  requestPlanInvoice(
    @Body() dto: SelectPlanDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSubscriptionService.requestPlanInvoice(
      actor.tenantId!,
      dto,
      actor,
    );
  }

  @Post('invoices/:id/mark-transferred')
  markTransferred(
    @Param('id') id: string,
    @Body() dto: MarkTransferredDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSubscriptionService.markTransferred(
      actor.tenantId!,
      id,
      dto,
      actor,
    );
  }
}
