import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @Matches(/^[A-Z0-9_]{2,30}$/, {
    message: 'Mã gói chỉ gồm chữ hoa, số và gạch dưới',
  })
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Replaces the old fixed MONTHLY/QUARTERLY/YEARLY/CUSTOM choice: Super Admin
  // picks any billing period from 1 to 12 months. The legacy `billing_cycle`
  // enum column is derived automatically (see common/utils/billing-cycle.ts)
  // so the saas_plans_billing_cycle_check constraint stays satisfied.
  @IsInt()
  @Min(1)
  @Max(12)
  billingCycleMonths!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
