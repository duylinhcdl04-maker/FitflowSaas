import { IsIn, IsOptional, IsString } from 'class-validator';

export const DECLARABLE_METHODS = ['BANK_TRANSFER', 'QR'] as const;

// OW-08. Owner tự khai đã chuyển khoản — chỉ tạo payment ở trạng thái PENDING,
// KHÔNG kích hoạt Subscription (xem quyết định payment-gate: SuperAdmin phải
// xác nhận qua SA-10 thì Subscription mới chuyển ACTIVE).
export class MarkTransferredDto {
  @IsOptional()
  @IsIn(DECLARABLE_METHODS)
  method?: (typeof DECLARABLE_METHODS)[number];

  @IsOptional()
  @IsString()
  note?: string;
}
