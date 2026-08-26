import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * OW-00 + OW-02 gộp làm một giao dịch. Lý do: `users` có CHECK constraint
 * `ck_user_tenant_scope` ở DB — `user_type = 'TENANT'` bắt buộc `tenant_id
 * IS NOT NULL` ngay từ khi tạo row. Không thể tạo một Account "chờ tạo
 * Tenant" như bản thiết kế ban đầu của BE_Owner.md (tài liệu đó viết trước
 * khi biết ràng buộc này) — User và Tenant phải được tạo cùng lúc.
 *
 * Frontend vẫn có thể hiển thị đây là 2 bước (thông tin cá nhân → thông tin
 * doanh nghiệp) và chỉ gọi API này một lần ở cuối, không có bước nào tạo
 * Account riêng lẻ trước.
 */
export class RegisterDto {
  // --- Tài khoản Owner ---
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  fullName!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password!: string;

  // --- Doanh nghiệp (Tenant) ---
  @IsString()
  @MinLength(2, { message: 'Tên doanh nghiệp quá ngắn' })
  businessName!: string;

  // Định danh thương hiệu — cùng quy ước hiển thị "{code}.fitflow.vn" như
  // phía SuperAdmin (SA-03). Chưa có domain routing thật, lưu sẵn để sau này
  // gắn subdomain riêng kiểu KiotViet (`<slug>.fitflow.vn`).
  @IsString()
  @Matches(/^[a-z0-9-]{2,50}$/, {
    message: 'Chỉ gồm chữ thường, số và dấu gạch ngang, 2-50 ký tự',
  })
  brandSlug!: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsEmail({}, { message: 'Email liên hệ không hợp lệ' })
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // OW-03b. Owner chọn bắt đầu với dữ liệu mẫu (để khám phá hệ thống) hay
  // trang trống (tự thiết lập từ đầu) — quyết định ở bước đăng ký, nhưng dữ
  // liệu mẫu chỉ thực sự được tạo ở verify() (chỉ tài khoản đã xác thực OTP
  // mới nhận dữ liệu mẫu, tránh rác dữ liệu cho các lượt đăng ký bỏ dở).
  @IsOptional()
  @IsBoolean()
  seedSampleData?: boolean;
}
