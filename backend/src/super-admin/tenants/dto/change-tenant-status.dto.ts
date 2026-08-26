import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export const TENANT_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export class ChangeTenantStatusDto {
  @IsIn(TENANT_STATUSES)
  status!: TenantStatus;

  // Required when suspending so BR-SA-003 always has a recorded reason for support/audit.
  @ValidateIf((dto: ChangeTenantStatusDto) => dto.status === 'SUSPENDED')
  @IsString()
  @MinLength(3, { message: 'Cần nêu lý do khi tạm ngưng Tenant' })
  reason?: string;
}
