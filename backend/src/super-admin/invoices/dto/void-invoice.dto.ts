import { IsString, MinLength } from 'class-validator';

// NT-5: huỷ một hoá đơn là hành động chạm vào Tenant — bắt buộc lý do.
export class VoidInvoiceDto {
  @IsString()
  @MinLength(5, { message: 'Cần nêu lý do huỷ hoá đơn (tối thiểu 5 ký tự)' })
  reason!: string;
}
