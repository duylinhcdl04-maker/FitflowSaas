import { IsIn, IsOptional, IsString } from 'class-validator';

export const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

// OW-12. Owner chỉ xem/theo dõi Customer — tạo mới thuộc nghiệp vụ lễ tân
// (Staff), không có nút "+ Thêm khách hàng" ở Owner Portal.
export class QueryCustomersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: (typeof CUSTOMER_STATUSES)[number];

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsIn(['MEMBER', 'GUEST'])
  type?: 'MEMBER' | 'GUEST';

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
