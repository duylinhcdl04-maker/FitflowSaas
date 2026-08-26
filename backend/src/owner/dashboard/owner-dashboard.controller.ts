import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerDashboardService } from './owner-dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryRevenueDto } from './dto/query-revenue.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/dashboard')
export class OwnerDashboardController {
  constructor(private readonly ownerDashboardService: OwnerDashboardService) {}

  @Get('overview')
  overview(
    @Query() query: QueryDashboardDto,
    @CurrentUser() actor: RequestUser,
  ) {
    // BR-OD-01: luôn scope theo tenant của actor, không nhận tenantId từ query.
    return this.ownerDashboardService.overview(actor.tenantId!, query);
  }

  @Get('revenue')
  revenue(
    @Query() query: QueryRevenueDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerDashboardService.getRevenueChart(actor.tenantId!, query);
  }
}
