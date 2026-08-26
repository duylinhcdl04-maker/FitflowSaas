import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerStaffService } from './owner-staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller('owner/staff')
export class OwnerStaffController {
  constructor(private readonly ownerStaffService: OwnerStaffService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.OWNER)
  @Get()
  list(@CurrentUser() actor: RequestUser) {
    return this.ownerStaffService.list(actor.tenantId!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.OWNER)
  @Post('invite')
  invite(@Body() dto: InviteStaffDto, @CurrentUser() actor: RequestUser) {
    return this.ownerStaffService.invite(actor.tenantId!, dto, actor);
  }

  // Public — người được mời chưa có phiên đăng nhập.
  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.ownerStaffService.acceptInvite(dto);
  }
}
