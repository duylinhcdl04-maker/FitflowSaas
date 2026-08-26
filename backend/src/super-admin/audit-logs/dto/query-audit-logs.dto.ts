import { IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryAuditLogsDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
