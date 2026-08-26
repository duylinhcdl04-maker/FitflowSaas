import { IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryDashboardDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
