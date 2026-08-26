import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerCheckinService } from './owner-checkin.service';
import { QueryCheckinDto } from './dto/query-checkin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/checkin')
export class OwnerCheckinController {
  constructor(private readonly ownerCheckinService: OwnerCheckinService) {}

  @Get('overview')
  overview(@Query() query: QueryCheckinDto, @CurrentUser() actor: RequestUser) {
    return this.ownerCheckinService.overview(actor.tenantId!, query);
  }
}
