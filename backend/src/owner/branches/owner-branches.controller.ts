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
import { OwnerBranchesService } from './owner-branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/branches')
export class OwnerBranchesController {
  constructor(private readonly ownerBranchesService: OwnerBranchesService) {}

  @Get()
  list(@CurrentUser() actor: RequestUser) {
    return this.ownerBranchesService.list(actor.tenantId!);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.ownerBranchesService.get(actor.tenantId!, id);
  }

  @Post()
  create(@Body() dto: CreateBranchDto, @CurrentUser() actor: RequestUser) {
    return this.ownerBranchesService.create(actor.tenantId!, dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerBranchesService.update(actor.tenantId!, id, dto, actor);
  }
}
