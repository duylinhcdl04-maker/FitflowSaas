import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { AddonsService } from './addons.service';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';
import { AttachAddonDto } from './dto/attach-addon.dto';
import { CancelAddonDto } from './dto/cancel-addon.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin')
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Get('addons')
  list() {
    return this.addonsService.list();
  }

  @Get('addons/:id')
  get(@Param('id') id: string) {
    return this.addonsService.get(id);
  }

  @Post('addons')
  create(@Body() dto: CreateAddonDto, @CurrentUser() actor: RequestUser) {
    return this.addonsService.create(dto, actor);
  }

  @Patch('addons/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAddonDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.addonsService.update(id, dto, actor);
  }

  // SA-03-style tenant surface, mirrors tenants/:id/users and tenants/:id/branches.
  @Get('tenants/:tenantId/addons')
  listForTenant(@Param('tenantId') tenantId: string) {
    return this.addonsService.listForTenant(tenantId);
  }

  @Post('tenants/:tenantId/addons')
  attach(
    @Param('tenantId') tenantId: string,
    @Body() dto: AttachAddonDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.addonsService.attach(tenantId, dto, actor);
  }

  @Patch('tenants/:tenantId/addons/:addonId/cancel')
  cancel(
    @Param('tenantId') tenantId: string,
    @Param('addonId') addonId: string,
    @Body() dto: CancelAddonDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.addonsService.cancel(tenantId, addonId, dto, actor);
  }
}
