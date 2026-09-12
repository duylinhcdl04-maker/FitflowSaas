import { SetMetadata } from '@nestjs/common';

export const BYPASS_ACCESS_MODE_KEY = 'bypass_access_mode';

/**
 * Đánh dấu controller/route được phép hoạt động bất kể Access Mode của Tenant
 * (READ_ONLY/BLOCKED khi Trial/Subscription hết hạn — xem `AccessModeGuard` +
 * `common/utils/access-mode.ts`).
 *
 * Chỉ dùng cho các luồng mà Owner/nhân sự BẮT BUỘC phải dùng được để tự khôi
 * phục quyền truy cập hoặc quản trị tài khoản, đúng tinh thần BR-TRIAL-06
 * (frontend/docs/UI_Owner.md): đăng nhập, xem/thanh toán Subscription-Billing,
 * webhook xác nhận thanh toán. KHÔNG dùng cho các route nghiệp vụ thông thường
 * (tạo khách hàng, check-in, thanh toán POS...) — những route đó phải bị chặn
 * đúng theo Access Mode.
 */
export const BypassAccessMode = () => SetMetadata(BYPASS_ACCESS_MODE_KEY, true);
