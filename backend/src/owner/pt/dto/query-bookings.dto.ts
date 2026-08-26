import { IsOptional, IsString } from 'class-validator';

export class QueryBookingsDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  ptUserId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
