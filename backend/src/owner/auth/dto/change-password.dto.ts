import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString({ message: 'Mật khẩu hiện tại không hợp lệ' })
  currentPassword?: string;

  @IsString({ message: 'Mã xác nhận không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã xác nhận OTP' })
  code!: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword!: string;
}
