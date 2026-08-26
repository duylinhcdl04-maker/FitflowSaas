import { IsEmail } from 'class-validator';

// OW-01b. Khôi phục kích hoạt cho tài khoản PENDING đã "mồ côi" userId — Owner
// đăng ký nhưng bỏ dở bước xác thực OTP, đóng tab/không lưu lại userId, rồi
// không còn cách nào gửi lại mã (resend-otp cũ bắt buộc userId). Endpoint này
// tra theo email thay vì userId để họ tự khôi phục được.
export class ResendOtpByEmailDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;
}
