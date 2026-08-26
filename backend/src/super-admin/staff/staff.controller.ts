import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { QueryStaffDto } from './dto/query-staff.dto';

// SA-19: "Chỉ PLATFORM_ADMIN vào được" — with the single SUPER_ADMIN role this
// codebase uses, that's every account gated here, same as every other
// super-admin/* controller.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list(@Query() query: QueryStaffDto) {
    return this.staffService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.staffService.get(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto, @CurrentUser() actor: RequestUser) {
    return this.staffService.create(dto, actor);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.staffService.changeStatus(id, dto, actor);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.staffService.resetPassword(id, dto, actor);
  }
}
