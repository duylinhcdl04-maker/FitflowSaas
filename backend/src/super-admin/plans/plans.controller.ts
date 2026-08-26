import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { PlansService } from './plans.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpsertPlanFeaturesDto } from './dto/upsert-plan-features.dto';
import { ApplyPlanToSubscriptionsDto } from './dto/apply-plan-to-subscriptions.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('platform-features')
  listFeatures() {
    return this.plansService.listFeatures();
  }

  @Post('platform-features')
  createFeature(@Body() dto: CreateFeatureDto) {
    return this.plansService.createFeature(dto);
  }

  @Get('plans')
  listPlans() {
    return this.plansService.listPlans();
  }

  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    return this.plansService.getPlan(id);
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto, @CurrentUser() actor: RequestUser) {
    return this.plansService.createPlan(dto, actor);
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.plansService.updatePlan(id, dto, actor);
  }

  @Put('plans/:id/features')
  upsertPlanFeatures(
    @Param('id') id: string,
    @Body() dto: UpsertPlanFeaturesDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.plansService.upsertPlanFeatures(id, dto, actor);
  }

  @Get('plans/:id/subscribers')
  listSubscribers(@Param('id') id: string) {
    return this.plansService.listSubscribers(id);
  }

  @Post('plans/:id/apply')
  applyToSubscriptions(
    @Param('id') id: string,
    @Body() dto: ApplyPlanToSubscriptionsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.plansService.applyPlanToSubscriptions(id, dto, actor);
  }
}
