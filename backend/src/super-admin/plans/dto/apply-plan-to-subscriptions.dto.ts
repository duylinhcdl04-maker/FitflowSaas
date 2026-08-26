import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

// SA-06 "Áp dụng cho doanh nghiệp hiện tại": explicit opt-in list, never "all" —
// changing what a paying Tenant is entitled to is exactly the kind of action
// NT-4 says must show its effect before it happens, one Tenant at a time chosen
// by a human, never a silent blanket update.
export class ApplyPlanToSubscriptionsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Chưa chọn doanh nghiệp nào để áp dụng' })
  @IsUUID('4', { each: true })
  subscriptionIds!: string[];
}
