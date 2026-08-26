import { IsString, MinLength } from 'class-validator';

// SA-03 Tab "Người dùng": Owner mất quyền truy cập. Không có tuỳ chọn "để trống
// lý do" ở bất kỳ hành động nhạy cảm nào trong khu vực này (NT-5).
export class ResetOwnerPasswordDto {
  @IsString()
  @MinLength(5, {
    message: 'Cần nêu lý do đặt lại mật khẩu (tối thiểu 5 ký tự)',
  })
  reason!: string;
}
