import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const BRANCH_MANAGER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export class UpdateBranchManagerDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(BRANCH_MANAGER_STATUSES)
  status?: (typeof BRANCH_MANAGER_STATUSES)[number];
}
