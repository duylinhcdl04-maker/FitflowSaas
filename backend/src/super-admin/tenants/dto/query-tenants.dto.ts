import { IsIn, IsOptional, IsString } from 'class-validator';
import { TENANT_STATUSES, type TenantStatus } from './change-tenant-status.dto';

export class QueryTenantsDto {
  @IsOptional()
  @IsIn(TENANT_STATUSES)
  status?: TenantStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
