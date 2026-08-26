import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { SupportSessionsService } from './support-sessions.service';
import { QuerySupportSessionsDto } from './dto/query-support-sessions.dto';
import { EndSupportSessionDto } from './dto/end-support-session.dto';

// SA-17: history/lifecycle reads. Starting a session stays at
// POST /super-admin/tenants/:tenantId/impersonation (ImpersonationController)
// for backward compatibility with the existing frontend call.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin/support-sessions')
export class SupportSessionsController {
  constructor(
    private readonly supportSessionsService: SupportSessionsService,
  ) {}

  @Get()
  list(@Query() query: QuerySupportSessionsDto) {
    return this.supportSessionsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.supportSessionsService.get(id);
  }

  @Post(':id/end')
  end(
    @Param('id') id: string,
    @Body() dto: EndSupportSessionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.supportSessionsService.end(id, dto, actor);
  }
}
