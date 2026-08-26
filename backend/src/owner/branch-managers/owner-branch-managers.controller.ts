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
import { OwnerBranchManagersService } from './owner-branch-managers.service';
import { CreateBranchManagerDto } from './dto/create-branch-manager.dto';
import { UpdateBranchManagerDto } from './dto/update-branch-manager.dto';
import { AssignBranchDto } from './dto/assign-branch.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/branch-managers')
export class OwnerBranchManagersController {
  constructor(
    private readonly ownerBranchManagersService: OwnerBranchManagersService,
  ) {}

  @Get()
  list(@CurrentUser() actor: RequestUser) {
    return this.ownerBranchManagersService.list(actor.tenantId!);
  }

  @Get('unassigned')
  listUnassigned(@CurrentUser() actor: RequestUser) {
    return this.ownerBranchManagersService.listUnassigned(actor.tenantId!);
  }

  @Post()
  create(
    @Body() dto: CreateBranchManagerDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerBranchManagersService.create(actor.tenantId!, dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchManagerDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerBranchManagersService.update(
      actor.tenantId!,
      id,
      dto,
      actor,
    );
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.ownerBranchManagersService.resetPassword(
      actor.tenantId!,
      id,
      actor,
    );
  }

  @Post(':id/assign-branch')
  assignBranch(
    @Param('id') id: string,
    @Body() dto: AssignBranchDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerBranchManagersService.assignBranch(
      actor.tenantId!,
      id,
      dto,
      actor,
    );
  }

  @Post(':id/unassign-branch')
  unassignBranch(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.ownerBranchManagersService.unassignBranch(
      actor.tenantId!,
      id,
      actor,
    );
  }
}
