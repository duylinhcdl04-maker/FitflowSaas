import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// SA-10 "Ghi nhận thanh toán thủ công" — bắt buộc có vì phần lớn doanh nghiệp
// chuyển khoản ngân hàng chứ không quẹt thẻ.
export const PAYMENT_METHODS = [
  'BANK_TRANSFER',
  'CASH',
  'CARD',
  'OTHER',
] as const;

export class RecordInvoicePaymentDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsIn(PAYMENT_METHODS)
  method!: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  providerRef?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
