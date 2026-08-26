import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentAccountDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  qrTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE';

  /** SePay webhook (IPN) API Key — verifies incoming `Authorization: Apikey <key>` requests. */
  @IsOptional()
  @IsString()
  sepayApiKey?: string;
}
