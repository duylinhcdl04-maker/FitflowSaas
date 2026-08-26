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
import { OwnerCatalogService } from './owner-catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/catalog')
export class OwnerCatalogController {
  constructor(private readonly ownerCatalogService: OwnerCatalogService) {}

  @Get('services')
  listServices(@CurrentUser() actor: RequestUser) {
    return this.ownerCatalogService.listServices(actor.tenantId!);
  }

  @Post('services')
  createService(
    @Body() dto: CreateServiceDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerCatalogService.createService(actor.tenantId!, dto, actor);
  }

  @Get('packages')
  listPackages(@CurrentUser() actor: RequestUser) {
    return this.ownerCatalogService.listPackages(actor.tenantId!);
  }

  @Post('packages')
  createPackage(
    @Body() dto: CreatePackageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerCatalogService.createPackage(actor.tenantId!, dto, actor);
  }

  @Patch('packages/:id')
  updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.ownerCatalogService.updatePackage(
      actor.tenantId!,
      id,
      dto,
      actor,
    );
  }
}
