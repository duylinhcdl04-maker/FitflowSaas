import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export const DURATION_UNITS = [
  'DAY',
  'WEEK',
  'MONTH',
  'QUARTER',
  'YEAR',
] as const;
export const BRANCH_ACCESS_SCOPES = ['HOME_BRANCH', 'ALL_BRANCHES'] as const;

export class CreatePackageDto {
  @IsString()
  @MinLength(2, { message: 'Tên gói tập quá ngắn' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationValue!: number;

  @IsIn(DURATION_UNITS)
  durationUnit!: (typeof DURATION_UNITS)[number];

  // BR-TRIAL-SCOPE-01 / Bussinessrule_PackageSaas.md: ALL_BRANCHES chỉ hợp lệ
  // khi gói SaaS hiện tại của Tenant có tính năng đa chi nhánh (MULTI_BRANCH).
  @IsOptional()
  @IsIn(BRANCH_ACCESS_SCOPES)
  branchAccessScope?: (typeof BRANCH_ACCESS_SCOPES)[number];

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  freezeAllowedDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxCheckinsPerDay?: number;

  // Phạm vi BÁN gói (package_branches) — khác branchAccessScope (phạm vi SỬ
  // DỤNG sau khi mua). Để trống/không gửi = áp dụng cho tất cả chi nhánh;
  // gửi danh sách id = chỉ bán tại các chi nhánh đó.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];
}
