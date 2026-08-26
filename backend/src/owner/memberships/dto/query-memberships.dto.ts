import { IsIn, IsOptional, IsString } from 'class-validator';

export const MEMBERSHIP_STATUSES = [
  'SCHEDULED',
  'ACTIVE',
  'FROZEN',
  'EXPIRED',
  'CANCELLED',
] as const;

// OW-14. Read-only — Membership (giao dịch hội viên) do Staff bán hàng tạo
// tại quầy, Owner chỉ theo dõi. Tạo/sửa Membership Package (Template) thì có
// ở owner/catalog.
export class QueryMembershipsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(MEMBERSHIP_STATUSES)
  status?: (typeof MEMBERSHIP_STATUSES)[number];

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
