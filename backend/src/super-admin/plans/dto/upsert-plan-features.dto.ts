import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class PlanFeatureSettingDto {
  @IsString()
  featureCode!: string;

  @IsBoolean()
  isEnabled!: boolean;

  // Only meaningful for QUOTA-type features (e.g. MAX_BRANCHES); omit for BOOLEAN features.
  @IsOptional()
  @IsInt()
  quotaValue?: number;
}

export class UpsertPlanFeaturesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureSettingDto)
  features!: PlanFeatureSettingDto[];
}
