import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { ImpersonationService } from './impersonation.service';
import { StartImpersonationDto } from './dto/start-impersonation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin/tenants/:tenantId/impersonation')
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Post()
  start(
    @Param('tenantId') tenantId: string,
    @Body() dto: StartImpersonationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.impersonationService.start(tenantId, dto, actor);
  }
}
