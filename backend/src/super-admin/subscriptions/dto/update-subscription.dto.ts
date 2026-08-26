import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export const SUBSCRIPTION_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED',
  'EXPIRED',
  'CANCELLED',
] as const;

export class UpdateSubscriptionDto {
  // Upgrade/downgrade: switches the subscription to a different SaaS Plan.
  @IsOptional()
  @IsString()
  planCode?: string;

  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: (typeof SUBSCRIPTION_STATUSES)[number];

  @IsOptional()
  @IsString()
  cancelReason?: string;

  // Renewal: extends the current period by this many days.
  @IsOptional()
  @IsInt()
  @Min(1)
  renewDays?: number;
}
