-- Face check-in feature (backend/docs/face-checkin.md).
--
-- Cho phép 'FACE' là giá trị hợp lệ của attendances.check_in_method / check_out_method,
-- và định nghĩa tường minh các giá trị enum-like còn lại của face_profiles/checkin_devices/
-- access_denied_logs — các bảng này đã tồn tại sẵn trong schema (pre-provisioned) nhưng
-- CHƯA từng có CHECK constraint nào ở tầng DB (xác nhận trực tiếp qua pg_constraint ngày
-- 2026-08-28, dù nhiều model trong schema.prisma có comment "This table contains check
-- constraints" — comment đó không phản ánh đúng các bảng này). Thêm constraint tường minh ở
-- đây để tránh lặp lại lỗi kiểu guest_visits_status_check (code ghi giá trị không khớp enum
-- DB, silent 500) khi mở rộng thêm giá trị sau này.
--
-- Additive-only, applied by hand rồi `prisma db pull` (theo đúng convention đã dùng ở
-- 2026-08-24b-addons.sql — DB này được quản lý theo cách đó, không dùng `prisma migrate`).

ALTER TABLE attendances
  ADD CONSTRAINT attendances_check_in_method_check
    CHECK (check_in_method IN ('MANUAL', 'QR', 'FACE')),
  ADD CONSTRAINT attendances_check_out_method_check
    CHECK (check_out_method IS NULL OR check_out_method IN ('MANUAL', 'QR', 'FACE', 'AUTO'));

ALTER TABLE face_profiles
  ADD CONSTRAINT face_profiles_status_check
    CHECK (status IN ('ACTIVE', 'REVOKED'));

ALTER TABLE access_denied_logs
  ADD CONSTRAINT access_denied_logs_method_check
    CHECK (method IN ('FACE', 'QR', 'MANUAL'));

ALTER TABLE checkin_devices
  ADD CONSTRAINT checkin_devices_device_type_check
    CHECK (device_type IN ('KIOSK', 'MOBILE')),
  ADD CONSTRAINT checkin_devices_mode_check
    CHECK (mode IN ('CHECKIN', 'CHECKIN_CHECKOUT'));
