import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export const FEATURE_TYPES = ['BOOLEAN', 'QUOTA'] as const;

export class CreateFeatureDto {
  @Matches(/^[A-Z0-9_]{2,50}$/, {
    message: 'Mã feature chỉ gồm chữ hoa, số và gạch dưới',
  })
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(FEATURE_TYPES)
  featureType!: (typeof FEATURE_TYPES)[number];

  @IsOptional()
  @IsString()
  module?: string;
}
