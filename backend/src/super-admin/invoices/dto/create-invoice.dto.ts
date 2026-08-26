import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// SA-09: this codebase has no automated billing-cycle job yet (no cron/bullmq
// consumer wired up) to issue invoices on renewal, so SuperAdmin issues them
// by hand for now. Business separation (BR-SA-004) still holds: this only
// ever touches saas_invoices, never the tenant's own `payments` table.
export class CreateInvoiceDto {
  @IsString()
  tenantId!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsDateString()
  dueDate!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;
}
