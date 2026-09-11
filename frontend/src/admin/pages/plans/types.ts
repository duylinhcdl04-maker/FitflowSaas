export type PlanTab = 'plans' | 'features' | 'limits' | 'matrix';

export type PlanSection =
  | 'basic'
  | 'pricing'
  | 'features'
  | 'quotas'
  | 'integrations'
  | 'addons'
  | 'trial'
  | 'support'
  | 'display'
  | 'review';

export interface PlanSectionMeta {
  key: PlanSection;
  label: string;
  badge?: string;
  description: string;
}

export const PLAN_10_DIMENSIONS: PlanSectionMeta[] = [
  { key: 'basic', label: '1. Basic Info', description: 'Tên gói, mã định danh, slogan và đối tượng khách hàng mục tiêu' },
  { key: 'pricing', label: '2. Pricing & Billing', description: 'Cấu hình giá đa chu kỳ (Tháng, Quý, Năm) và tỷ lệ chiết khấu' },
  { key: 'features', label: '3. Features', description: '15 tính năng nền tảng phân nhóm theo 6 module chức năng' },
  { key: 'quotas', label: '4. Resource Quotas', description: '10 hạn ngạch tài nguyên với 3 chế độ: Limited, Unlimited, Disabled' },
  { key: 'integrations', label: '5. Integrations', description: '7 cổng kết nối API, Webhook, Zalo, Payment Gateway, Kế toán, CRM' },
  { key: 'addons', label: '6. Add-ons', description: 'Gói mở rộng tài nguyên và tính năng bổ trợ linh hoạt' },
  { key: 'trial', label: '7. Trial Policy', description: 'Chính sách dùng thử miễn phí và chuyển đổi thanh toán' },
  { key: 'support', label: '8. Support SLA', description: 'Cấp độ hỗ trợ kỹ thuật và cam kết dịch vụ (SLA)' },
  { key: 'display', label: '9. Display & Hero', description: 'Huy hiệu Phổ biến nhất (Hero Plan), thứ tự sắp xếp và CTA' },
  { key: 'review', label: '10. Review & Publish', description: 'Kiểm tra tính hợp lệ toàn diện, xuất bản hoặc lưu trữ gói' },
];

export const FEATURE_MODULE_GROUPS = [
  { code: 'Check-in', name: 'Check-in & Điểm danh', desc: 'Quét mã QR, Face ID nhận diện khuôn mặt và phân tích lưu lượng' },
  { code: 'Membership', name: 'Quản lý Hội viên', desc: 'Hồ sơ thẻ tập, tự động gia hạn và cảnh báo sắp hết hạn' },
  { code: 'PT', name: 'Huấn luyện viên (PT)', desc: 'Quản lý PT, đặt lịch tập thông minh và giáo án tập luyện' },
  { code: 'Analytics', name: 'Báo cáo & Phân tích', desc: 'Báo cáo doanh thu và phân tích chuyên sâu dự báo tăng trưởng' },
  { code: 'Communication', name: 'Truyền thông & CSKH', desc: 'Thông báo Email tự động và tin nhắn SMS Brandname' },
  { code: 'Security', name: 'Bảo mật & Kiểm toán', desc: 'Xác thực hai lớp (2FA) và nhật ký truy vết Audit Logs' },
];

export interface FeatureCategoryMeta {
  key: string;
  label: string;
  description: string;
}

export const FEATURE_CATEGORIES: FeatureCategoryMeta[] = [
  { key: 'CHECKIN', label: 'Check-in & Điểm danh', description: 'Tính năng quét QR, Face ID và phân tích giờ cao điểm' },
  { key: 'MEMBERSHIP', label: 'Quản lý Hội viên', description: 'Hồ sơ, gia hạn tự động và cảnh báo hết hạn thẻ' },
  { key: 'TRAINING', label: 'Huấn luyện & PT', description: 'Quản lý HLV cá nhân, đặt lịch và giáo án tập luyện' },
  { key: 'ANALYTICS', label: 'Báo cáo & Phân tích', description: 'Báo cáo doanh thu, hiệu suất kinh doanh và dự báo dòng tiền' },
  { key: 'COMMUNICATION', label: 'Truyền thông & CSKH', description: 'Gửi email tự động, SMS Brandname và thông báo đẩy' },
  { key: 'INTEGRATION', label: 'Tích hợp & Mở rộng', description: 'Kết nối Open API, Webhook và phần mềm bên thứ 3' },
  { key: 'SECURITY', label: 'Bảo mật & Kiểm toán', description: 'Xác thực 2 lớp 2FA, nhật ký truy vết hệ thống' },
];

export const LIMIT_CATEGORIES: FeatureCategoryMeta[] = [
  { key: 'ACCOUNT', label: 'Tài khoản & Chi nhánh', description: 'Giới hạn số lượng tài khoản nhân viên và phòng tập' },
  { key: 'MEMBERS', label: 'Hội viên & Khách hàng', description: 'Giới hạn hồ sơ hội viên và hội viên đang hoạt động' },
  { key: 'TRAINING', label: 'Huấn luyện viên & Lịch tập', description: 'Giới hạn số lượng PT và lượt đặt lịch mỗi tháng' },
  { key: 'OPERATIONS', label: 'Vận hành & Check-in', description: 'Giới hạn lượt quét thẻ / Face ID hàng tháng' },
  { key: 'STORAGE', label: 'Lưu trữ đám mây', description: 'Giới hạn dung lượng hình ảnh, hợp đồng và chứng từ' },
  { key: 'COMMUNICATION', label: 'Hạn mức Truyền thông', description: 'Giới hạn số lượng Email và SMS gửi đi hàng tháng' },
];

export interface LimitUnitMeta {
  code: string;
  unit: string;
  defaultVal: number | null;
}

export const LIMIT_UNITS: Record<string, LimitUnitMeta> = {
  MAX_STAFF: { code: 'MAX_STAFF', unit: 'nhân viên', defaultVal: 5 },
  MAX_BRANCHES: { code: 'MAX_BRANCHES', unit: 'chi nhánh', defaultVal: 1 },
  MAX_MEMBERS: { code: 'MAX_MEMBERS', unit: 'hội viên', defaultVal: 500 },
  MAX_ACTIVE_MEMBERS: { code: 'MAX_ACTIVE_MEMBERS', unit: 'hội viên active', defaultVal: 300 },
  MAX_PT: { code: 'MAX_PT', unit: 'HLV/PT', defaultVal: 3 },
  MAX_PT_BOOKINGS: { code: 'MAX_PT_BOOKINGS', unit: 'lượt/tháng', defaultVal: 200 },
  MAX_CHECKINS_MONTH: { code: 'MAX_CHECKINS_MONTH', unit: 'lượt/tháng', defaultVal: 5000 },
  MAX_STORAGE: { code: 'MAX_STORAGE', unit: 'GB', defaultVal: 10 },
  MAX_EMAILS_MONTH: { code: 'MAX_EMAILS_MONTH', unit: 'emails/tháng', defaultVal: 5000 },
  MAX_SMS_MONTH: { code: 'MAX_SMS_MONTH', unit: 'SMS/tháng', defaultVal: 500 },
};
