import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerMembershipsService } from './owner-memberships.service';
import { QueryMembershipsDto } from './dto/query-memberships.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/memberships')
export class OwnerMembershipsController {
  constructor(
    private readonly ownerMembershipsService: OwnerMembershipsService,
  ) {}

  @Get()
  list(@Query() query: QueryMembershipsDto, @CurrentUser() actor: RequestUser) {
    return this.ownerMembershipsService.list(actor.tenantId!, query);
  }
}
