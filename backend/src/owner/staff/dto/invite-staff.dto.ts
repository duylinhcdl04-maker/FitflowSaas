import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ROLE } from '../../../common/types/role';

// OW-04b. Owner chỉ mời được vai trò vận hành chi nhánh — không tự phong
// OWNER (chỉ có đúng 1 theo Tenant) hay SUPER_ADMIN/CUSTOMER (không thuộc
// phạm vi Tenant này). Khớp đúng 6-role list của AI_INSTRUCTIONS.md.
//
// BRANCH_MANAGER không còn mời qua link ở đây nữa — tài khoản Quản lý chi
// nhánh giờ tạo trực tiếp (có mật khẩu ngay, không cần accept-invite) ở
// owner/branch-managers, vì Owner cần gán quản lý cho chi nhánh ngay khi tạo.
export const INVITABLE_ROLES = [ROLE.STAFF, ROLE.PT] as const;

export class InviteStaffDto {
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  fullName!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsIn(INVITABLE_ROLES)
  roleCode!: (typeof INVITABLE_ROLES)[number];

  @IsOptional()
  @IsString()
  branchId?: string;
}
