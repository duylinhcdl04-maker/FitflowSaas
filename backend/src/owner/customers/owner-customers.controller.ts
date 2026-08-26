import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { OwnerCustomersService } from './owner-customers.service';
import { QueryCustomersDto } from './dto/query-customers.dto';

// OW-12. Read-only — Owner theo dõi Customer, không tạo mới (thuộc nghiệp vụ
// lễ tân/Staff, ngoài phạm vi Owner Portal hiện tại).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.OWNER)
@Controller('owner/customers')
export class OwnerCustomersController {
  constructor(private readonly ownerCustomersService: OwnerCustomersService) {}

  @Get()
  list(@Query() query: QueryCustomersDto, @CurrentUser() actor: RequestUser) {
    return this.ownerCustomersService.list(actor.tenantId!, query);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.ownerCustomersService.get(actor.tenantId!, id);
  }
}
