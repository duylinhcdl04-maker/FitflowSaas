import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const PRICING_MODELS = [
  'FIXED',
  'PER_BRANCH',
  'PER_USER',
  'PER_USAGE',
] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

// Optional Entitlement effect (BE_Superadmin.md §9/BR-SA-12). Left unset =
// pure billing SKU with no automatic effect on the Tenant's Entitlement.
export const ADDON_EFFECT_TYPES = ['QUOTA_DELTA', 'ENABLE_FEATURE'] as const;
export type AddonEffectType = (typeof ADDON_EFFECT_TYPES)[number];

export class CreateAddonDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(PRICING_MODELS)
  pricingModel!: PricingModel;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  effectFeatureCode?: string;

  @IsOptional()
  @IsIn(ADDON_EFFECT_TYPES)
  effectType?: AddonEffectType;

  // Required when effectType is QUOTA_DELTA — quota granted per unit quantity.
  @ValidateIf((dto: CreateAddonDto) => dto.effectType === 'QUOTA_DELTA')
  @IsInt()
  @Min(1)
  effectAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatiblePlanCodes?: string[];
}
