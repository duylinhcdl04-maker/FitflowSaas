import { IsIn, IsOptional, IsString } from 'class-validator';
import { STAFF_STATUSES } from './update-staff-status.dto';

export class QueryStaffDto {
  @IsOptional()
  @IsIn(STAFF_STATUSES)
  status?: (typeof STAFF_STATUSES)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
