import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePaymentAccountDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  bankCode!: string;

  @IsString()
  bankName!: string;

  @IsString()
  accountNumber!: string;

  @IsString()
  accountName!: string;

  @IsOptional()
  @IsString()
  qrTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  /** SePay webhook (IPN) API Key — verifies incoming `Authorization: Apikey <key>` requests. */
  @IsOptional()
  @IsString()
  sepayApiKey?: string;
}
