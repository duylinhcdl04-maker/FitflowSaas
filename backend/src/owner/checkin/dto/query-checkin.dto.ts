import { IsIn, IsOptional, IsString } from 'class-validator';

export const ATTENDANCE_TYPES = ['MEMBER', 'GUEST'] as const;
export const CHECKIN_METHODS = ['FACE', 'QR', 'MANUAL', 'AUTO'] as const;
export const ATTENDANCE_STATUSES = [
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
] as const;

// OW-13. Read-only Check-in Overview — Owner theo dõi & xử lý ngoại lệ, không
// tự thao tác Check-in/Check-out hộ khách (BE_Owner.md mục XV).
export class QueryCheckinDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsIn(ATTENDANCE_TYPES)
  type?: (typeof ATTENDANCE_TYPES)[number];

  @IsOptional()
  @IsIn(CHECKIN_METHODS)
  method?: (typeof CHECKIN_METHODS)[number];

  @IsOptional()
  @IsIn(ATTENDANCE_STATUSES)
  status?: (typeof ATTENDANCE_STATUSES)[number];

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
