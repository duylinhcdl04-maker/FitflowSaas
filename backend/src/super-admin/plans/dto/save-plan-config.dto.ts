import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlanPriceItemDto {
  @IsString()
  billingCycle!: string;

  @IsInt()
  billingCycleMonths!: number;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PlanFeatureItemDto {
  @IsString()
  featureId!: string;

  @IsBoolean()
  isEnabled!: boolean;
}

export class PlanQuotaItemDto {
  @IsString()
  quotaId!: string;

  @IsEnum(['LIMITED', 'UNLIMITED', 'DISABLED'])
  mode!: 'LIMITED' | 'UNLIMITED' | 'DISABLED';

  @IsOptional()
  @IsInt()
  quotaValue?: number | null;
}

export class PlanIntegrationItemDto {
  @IsString()
  integrationId!: string;

  @IsBoolean()
  isEnabled!: boolean;

  @IsOptional()
  configOptions?: any;
}

export class SavePlanConfigDto {
  // 1. Basic Information
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  slogan?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // 2. Pricing & Billing
  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  billingCycle?: string;

  @IsOptional()
  @IsInt()
  billingCycleMonths?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanPriceItemDto)
  prices?: PlanPriceItemDto[];

  // 3. Features
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureItemDto)
  features?: PlanFeatureItemDto[];

  // 4. Resource Quotas
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanQuotaItemDto)
  quotas?: PlanQuotaItemDto[];

  // 5. Integrations
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanIntegrationItemDto)
  integrations?: PlanIntegrationItemDto[];

  // 7. Trial
  @IsOptional()
  @IsInt()
  trialDays?: number;

  // 8. Support
  @IsOptional()
  @IsString()
  supportTier?: string;

  // 9. Display
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  // 10. Status
  @IsOptional()
  @IsString()
  status?: string;
}
