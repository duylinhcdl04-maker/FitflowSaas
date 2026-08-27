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
import { OwnerPtService } from './owner-pt.service';
import { RejectPackageDto } from './dto/reject-package.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/pt')
export class OwnerPtController {
  constructor(private readonly ownerPtService: OwnerPtService) {}

  @Get()
  listPts(
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerPtService.listPts(actor.tenantId!, branchId);
  }

  @Get('packages')
  listPackagePlans(
    @Query('status') status: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerPtService.listPackagePlans(
      actor.tenantId!,
      status,
      branchId,
    );
  }

  @Patch('packages/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.ownerPtService.approvePackagePlan(actor.tenantId!, id, actor);
  }

  @Patch('packages/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectPackageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerPtService.rejectPackagePlan(
      actor.tenantId!,
      id,
      dto,
      actor,
    );
  }

  @Get('bookings')
  listBookings(
    @Query() query: QueryBookingsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerPtService.listBookings(actor.tenantId!, query);
  }
}
