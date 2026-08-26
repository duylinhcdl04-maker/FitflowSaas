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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ChangeTenantStatusDto } from './dto/change-tenant-status.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  list(@Query() query: QueryTenantsDto) {
    return this.tenantsService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tenantsService.get(id);
  }

  // SA-03 Tab "Người dùng" — read-only staff list.
  @Get(':id/users')
  listUsers(@Param('id') id: string) {
    return this.tenantsService.listUsers(id);
  }

  // SA-03 Tab "Chi nhánh" — read-only, no actions (doc: "Không có hành động").
  @Get(':id/branches')
  listBranches(@Param('id') id: string) {
    return this.tenantsService.listBranches(id);
  }

  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() actor: RequestUser) {
    return this.tenantsService.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.tenantsService.update(id, dto, actor);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeTenantStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.tenantsService.changeStatus(id, dto, actor);
  }

  // SA-03 Tab "Người dùng" exception: Owner lost access. Issues a fresh
  // temporary password (see ResetOwnerPasswordDto doc comment for why this is
  // a temp password, not an emailed reset link, for now).
  @Post(':id/reset-owner-password')
  resetOwnerPassword(
    @Param('id') id: string,
    @Body() dto: ResetOwnerPasswordDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.tenantsService.resetOwnerPassword(id, dto, actor);
  }
}
