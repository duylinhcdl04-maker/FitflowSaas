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
import { InvoicesService } from './invoices.service';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordInvoicePaymentDto } from './dto/record-invoice-payment.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';

// SA-09/10: Danh sách hoá đơn & Chi tiết hoá đơn. Phục vụ PLATFORM_BILLING
// trong tài liệu thiết kế — với kiến trúc một role SUPER_ADMIN duy nhất hiện
// tại, cổng vào vẫn là ROLE.SUPER_ADMIN như mọi controller super-admin khác.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
@Controller('super-admin/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  list(@Query() query: QueryInvoicesDto) {
    return this.invoicesService.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.invoicesService.get(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() actor: RequestUser) {
    return this.invoicesService.create(dto, actor);
  }

  @Post(':id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordInvoicePaymentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.invoicesService.recordPayment(id, dto, actor);
  }

  @Patch(':id/void')
  void(
    @Param('id') id: string,
    @Body() dto: VoidInvoiceDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.invoicesService.void(id, dto, actor);
  }
}
