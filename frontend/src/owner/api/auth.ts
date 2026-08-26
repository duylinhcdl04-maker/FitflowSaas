import { apiClient } from './client';

// Khớp đúng response thật của backend (AuthService.issueSessionForUser/login)
// — KHÔNG có tenantId ở đây; phải gọi fetchMe() riêng để lấy tenantId.
export interface SessionResponse {
  accessToken: string;
  user: { id: string; email: string; fullName: string; roles: string[]; mustChangePassword?: boolean };
}

export function login(email: string, password: string) {
  return apiClient.post<SessionResponse>('/auth/login', { email, password }).then((res) => res.data);
}

export function fetchMe() {
  return apiClient
    .get<{ id: string; email: string; fullName: string; roles: string[]; tenantId: string | null; mustChangePassword?: boolean }>('/auth/me')
    .then((res) => res.data);
}

export function refresh() {
  return apiClient.post<{ accessToken: string }>('/auth/refresh').then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout');
}

// Bước 1 của đăng nhập kiểu KiotViet ("tên cửa hàng" → .fitflow.vn) — mô
// phỏng bằng route nội bộ vì chưa có subdomain thật. Chỉ để định
// tuyến/hiển thị, không phải cổng xác thực.
export function lookupTenant(slug: string) {
  return apiClient.get<{ code: string; name: string }>(`/owner/auth/tenants/${slug}`).then((res) => res.data);
}

// OW-00 + OW-02 gộp một API: `users` có CHECK constraint ở DB buộc
// user_type=TENANT phải có tenant_id ngay khi tạo, nên Account và Doanh
// nghiệp phải tạo cùng lúc (xem comment ở backend OwnerAuthService).
export interface RegisterPayload {
  // Tài khoản Owner
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  // Doanh nghiệp (Tenant)
  businessName: string;
  brandSlug: string;
  businessType?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  // OW-03b. true = tạo sẵn dữ liệu mẫu (chi nhánh, khách hàng, gói tập, PT...)
  // để Owner mới khám phá hệ thống ngay; false = trang trống, tự thiết lập.
  seedSampleData?: boolean;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  expiresInSeconds: number;
}

// Mã OTP được gửi qua email thật (MailService/SMTP) — không còn trả về
// trong response API.
export function register(payload: RegisterPayload) {
  return apiClient.post<RegisterResponse>('/owner/auth/register', payload).then((res) => res.data);
}

export function resendOtp(userId: string) {
  return apiClient
    .post<{ userId: string; expiresInSeconds: number }>('/owner/auth/resend-otp', { userId })
    .then((res) => res.data);
}

// OW-01b. Khôi phục tài khoản PENDING đã "mồ côi" userId (đóng tab giữa
// chừng đăng ký, không xác thực OTP) — tra theo email thay vì userId.
export function resendOtpByEmail(email: string) {
  return apiClient
    .post<{ userId: string; email: string; expiresInSeconds: number }>('/owner/auth/resend-otp-by-email', { email })
    .then((res) => res.data);
}

export interface VerifyOtpResponse extends SessionResponse {
  tenant: { id: string } | null;
  subscription: { trialEndsAt: string | null } | null;
  seededSampleData: boolean;
}

export function verifyOtp(userId: string, code: string) {
  return apiClient.post<VerifyOtpResponse>('/owner/auth/verify-otp', { userId, code }).then((res) => res.data);
}

export function forgotPassword(email: string) {
  return apiClient
    .post<{ userId: string; email: string; expiresInSeconds: number }>('/owner/auth/forgot-password', { email })
    .then((res) => res.data);
}

export function resetPassword(userId: string, code: string, newPassword: string) {
  return apiClient
    .post<{ success: boolean; message: string }>('/owner/auth/reset-password', { userId, code, newPassword })
    .then((res) => res.data);
}

export function requestChangePasswordOtp() {
  return apiClient
    .post<{ email: string; expiresInSeconds: number }>('/owner/auth/change-password/request-otp')
    .then((res) => res.data);
}

export function changePasswordWithOtp(code: string, newPassword: string, currentPassword?: string) {
  return apiClient
    .post<{ success: boolean; message: string }>('/owner/auth/change-password', {
      code,
      newPassword,
      currentPassword: currentPassword || undefined,
    })
    .then((res) => res.data);
}
