-- Face check-in (backend/docs/face-checkin.md §6, Hướng A): platform_features/saas_plan_features
-- đang có 0 dòng toàn hệ thống (không riêng Face) — nên checkbox "Check-in bằng QR" và
-- "Nhận diện khuôn mặt" ở Owner Settings luôn báo "Gói hiện tại chưa mở khoá tính năng" cho
-- MỌI tenant, kể cả các tenant đang ở gói TRIAL ("Vận hành hệ thống không giới hạn tính năng"
-- theo đúng mô tả gói dùng thử ở Owner Sidebar).
--
-- Seed đúng 2 feature code mà code thật đang kiểm tra (owner-settings.service.ts#assertFeatureEnabled
-- gọi 'QR_CHECKIN' / 'FACE_RECOGNITION' — không phải các tên ví dụ CHECKIN_QR/CHECKIN_FACE trong
-- docs/BE_Superadmin.md, doc đó chỉ là ví dụ minh hoạ, code mới là nguồn sự thật), gán is_enabled=true
-- cho đúng plan TRIAL (code='TRIAL', "Gói Dùng Thử 14 Ngày") — KHÔNG động vào BASIC/PRO/ENTERPRISE,
-- đó là quyết định giá/gói nằm ngoài phạm vi yêu cầu này.
--
-- Additive-only, applied by hand rồi `prisma db pull` (cùng convention đã dùng ở
-- 2026-08-24b-addons.sql / 2026-08-28-face-checkin.sql).

INSERT INTO platform_features (code, name, description, feature_type, module)
VALUES
  ('QR_CHECKIN', 'Check-in bằng QR', 'Hội viên quét mã QR động trên app để tự Check-in/Check-out tại quầy.', 'BOOLEAN', 'CHECKIN'),
  ('FACE_RECOGNITION', 'Nhận diện khuôn mặt (Face ID)', 'Check-in bằng camera nhận diện khuôn mặt tại kiosk/quầy lễ tân.', 'BOOLEAN', 'CHECKIN')
ON CONFLICT (code) DO NOTHING;

INSERT INTO saas_plan_features (plan_id, feature_id, is_enabled)
SELECT sp.id, pf.id, true
FROM saas_plans sp
CROSS JOIN platform_features pf
WHERE sp.code = 'TRIAL'
  AND pf.code IN ('QR_CHECKIN', 'FACE_RECOGNITION')
ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = true;
