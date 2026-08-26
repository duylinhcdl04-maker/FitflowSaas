import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerSettingsService } from './owner-settings.service';
import { UpdateCheckinConfigDto } from './dto/update-checkin-config.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { LookupAccountNameDto } from './dto/lookup-account-name.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/settings')
export class OwnerSettingsController {
  constructor(private readonly ownerSettingsService: OwnerSettingsService) {}

  @Get('checkin-config')
  getCheckinConfig(@CurrentUser() actor: RequestUser) {
    return this.ownerSettingsService.getCheckinConfig(actor.tenantId!);
  }

  @Put('checkin-config')
  updateCheckinConfig(
    @Body() dto: UpdateCheckinConfigDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSettingsService.updateCheckinConfig(
      actor.tenantId!,
      dto,
      actor,
    );
  }

  @Get('onboarding')
  getOnboardingProgress(@CurrentUser() actor: RequestUser) {
    return this.ownerSettingsService.getOnboardingProgress(actor.tenantId!);
  }

  // Tenant brand settings
  @Get('tenant')
  getTenant(@CurrentUser() actor: RequestUser) {
    return this.ownerSettingsService.getTenant(actor.tenantId!);
  }

  @Put('tenant')
  updateTenant(
    @Body() dto: UpdateTenantDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSettingsService.updateTenant(actor.tenantId!, dto, actor);
  }

  // Bank directory (VietQR) — used by the payment-account form's bank picker + account-name lookup.
  @Get('banks')
  listBanks() {
    return this.ownerSettingsService.listBanks();
  }

  @Post('payment-accounts/lookup-account-name')
  lookupAccountName(@Body() dto: LookupAccountNameDto) {
    return this.ownerSettingsService.lookupAccountName(dto.bin, dto.accountNumber);
  }

  // Payment accounts settings
  @Get('payment-accounts')
  listPaymentAccounts(@CurrentUser() actor: RequestUser) {
    return this.ownerSettingsService.listPaymentAccounts(actor.tenantId!);
  }

  @Post('payment-accounts')
  createPaymentAccount(
    @Body() dto: CreatePaymentAccountDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSettingsService.createPaymentAccount(actor.tenantId!, dto, actor);
  }

  @Put('payment-accounts/:id')
  updatePaymentAccount(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentAccountDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSettingsService.updatePaymentAccount(actor.tenantId!, id, dto, actor);
  }

  @Delete('payment-accounts/:id')
  deletePaymentAccount(
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerSettingsService.deletePaymentAccount(actor.tenantId!, id, actor);
  }
}
