import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export const INVOICE_STATUSES = ['ISSUED', 'PAID', 'OVERDUE', 'VOID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export class QueryInvoicesDto {
  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @IsOptional()
  @IsDateString()
  dueTo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
