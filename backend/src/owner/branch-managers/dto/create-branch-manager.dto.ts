import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// OW-11b. Owner tạo tài khoản Quản lý chi nhánh trực tiếp — hệ thống tự sinh
// mật khẩu và kích hoạt ngay (khác owner/staff invite: không qua accept-link),
// vì Owner cần gán quản lý cho chi nhánh ngay lúc tạo, không thể chờ xác thực.
export class CreateBranchManagerDto {
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  fullName!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
