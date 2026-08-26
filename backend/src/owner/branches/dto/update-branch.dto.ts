import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateBranchDto } from './create-branch.dto';

export const BRANCH_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

// `code` giữ trong shape kế thừa nhưng OwnerBranchesService.update() không
// bao giờ chuyển tiếp nó — mã chi nhánh không đổi sau khi tạo (dùng làm khoá
// tự nhiên `[tenant_id, code]`, được các gói tập/giá tham chiếu).
export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @IsOptional()
  @IsIn(BRANCH_STATUSES)
  status?: BranchStatus;
}
