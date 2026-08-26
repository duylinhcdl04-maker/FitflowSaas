import { IsOptional, IsString } from 'class-validator';

export class QuerySupportSessionsDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
