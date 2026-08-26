import { IsString, MinLength } from 'class-validator';

export class ResetStaffPasswordDto {
  @IsString()
  @MinLength(5, {
    message: 'Cần nêu lý do đặt lại mật khẩu (tối thiểu 5 ký tự)',
  })
  reason!: string;
}
