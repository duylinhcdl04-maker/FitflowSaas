import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Tài khoản không hợp lệ' })
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  userId!: string;

  @IsString({ message: 'Mã xác nhận không hợp lệ' })
  @IsNotEmpty({ message: 'Mã xác nhận không được để trống' })
  code!: string;

  @IsString({ message: 'Mật khẩu không hợp lệ' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword!: string;
}
