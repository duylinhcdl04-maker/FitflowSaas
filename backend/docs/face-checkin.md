# FITFLOW — THIẾT KẾ CHECK-IN BẰNG NHẬN DIỆN KHUÔN MẶT (FACE CHECK-IN)

> **Trạng thái triển khai (2026-08-28): Phase 0, 1, 2 đã code xong**, chưa live-test bằng
> camera/khách hàng thật. Phase 3 (checkin_devices thật, liveness, self-service enroll, công cụ
> khiếu nại cho Manager) **chưa làm**. Tóm tắt việc đã hoàn thành theo §9:
> - Migration `prisma/manual-migrations/2026-08-28-face-checkin.sql` đã **áp dụng lên DB thật**.
> - `FACE_CHECKIN_ENABLED=true` (env, backend) bật tạm tính năng bỏ qua entitlement thật —
>   chưa seed `platform_features`/`saas_plan_features` "đúng chuẩn" (Hướng A §6 vẫn chưa làm).
> - Backend: toàn bộ API ở `ManagerController`/`ManagerService` (không tách module riêng như
>   phương án ban đầu — gộp vào `manager.service.ts` để tái dùng thẳng `createCheckInRecord`,
>   `resolveBranchId`, `syncGuestVisitAfterCheckout` sẵn có, giảm rủi ro thay vì tách module mới).
> - Frontend: `frontend/src/shared/face/` (model loader + camera + matcher dùng chung),
>   `MemberDetailModal.tsx`'s tab "Face ID" đã nối vào camera/API thật (trước đó là mock
>   `setTimeout`), kiosk mới tại `/staff/checkin-kiosk` (`FaceCheckinKioskPage.tsx`).
> - Model weights copy từ `node_modules/@vladmandic/face-api/model` vào `frontend/public/models/`.
> - Sửa thêm 1 lỗi phát hiện khi làm: `isFaceIdEnabled` bị hard-code `true` ở mọi nơi gọi
>   `MemberDetailModal` (chưa từng đọc config thật của Owner) — nay tự đọc qua
>   `GET /manager/checkin-config` (route mới, proxy read-only qua `OwnerSettingsService`).
> - **2026-08-28 (bổ sung):** Hướng A ở §6 **đã làm cho riêng gói TRIAL** —
>   `prisma/manual-migrations/2026-08-28b-face-checkin-trial-entitlement.sql` seed 2 dòng
>   `platform_features` (`QR_CHECKIN`, `FACE_RECOGNITION`) + gán `is_enabled=true` cho plan
>   `TRIAL` ("Gói Dùng Thử 14 Ngày") — đã áp dụng lên DB thật, verify lại bằng query mô phỏng
>   đúng `assertFeatureEnabled`. BASIC/PRO/ENTERPRISE **cố tình chưa đụng tới** (quyết định
>   giá/gói nằm ngoài phạm vi yêu cầu) — mở khoá cho các gói đó là việc riêng nếu cần sau này.

> Dựa trên thư viện [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) (fork TensorFlow.js của face-api.js gốc).
> **Lưu ý:** repo này đã archived (read-only) từ 02/2025, tác giả khuyến nghị dự án mới dùng thư viện kế nhiệm `Human`. Vẫn chọn `@vladmandic/face-api` vì: (1) người dùng yêu cầu cụ thể thư viện này, (2) package `@vladmandic/face-api` vẫn cài/dùng bình thường qua npm dù repo archived, (3) API 128-d descriptor + FaceMatcher đã ổn định, không cần cập nhật thường xuyên. Ghi nhận rủi ro: không còn được vá lỗi/CVE trong tương lai — nếu muốn an toàn dài hạn, cân nhắc `Human` ở Phase sau (API tương tự, cùng tác giả).

**Quyết định sản phẩm đã chốt với user:**
- **Nơi triển khai:** Kiosk/máy tại quầy lễ tân (1 màn hình + webcam cố định, khách tự đứng trước camera).
- **Enroll:** Staff chụp ảnh khuôn mặt tại quầy khi tạo/sửa hồ sơ khách hàng (không tự đăng ký qua app ở MVP).
- **Nơi matching:** Toàn bộ chạy trên trình duyệt (client-side) — kiosk tải danh sách descriptor về, tự detect + so khớp bằng `@vladmandic/face-api`, chỉ gửi kết quả cuối cùng lên backend.

---

## 0. Phát hiện quan trọng: hạ tầng đã được chuẩn bị sẵn (nhưng chưa nối dây)

Trước khi thiết kế thêm bất cứ gì, đã xác nhận trực tiếp trên DB (Neon Postgres) + code hiện tại:

1. **Schema đã có sẵn toàn bộ bảng cần thiết**, hoàn toàn chưa được dùng ở bất kỳ service/controller nào (trừ 1 dòng `.count()` trong `super-admin/dashboard.service.ts`):
   - `face_profiles` — 1 hồ sơ khuôn mặt ACTIVE / khách hàng (`@unique(customer_id, where: status='ACTIVE')`).
   - `face_embeddings` — nhiều embedding / hồ sơ (`embedding_raw Bytes?`, `model_version`, `quality_score`, `image_url`).
   - `checkin_devices` — đăng ký thiết bị kiosk (`device_type`, `mode`, `api_key_hash`, `last_seen_at`).
   - `access_denied_logs` — log các lần từ chối check-in (`method`, `reason_code`, `detail Json`).
   - `Customer.face_consent_at` / `face_consent_ip` — đồng ý thu thập sinh trắc học.
   - `attendances.face_match_score` — điểm khớp lưu lại mỗi lần check-in bằng face.
   - `attendances.check_in_method` hiện chỉ ghi `'MANUAL' | 'QR'` trong code — cần thêm `'FACE'` (xem §5).
2. **Toggle bật/tắt "Check-in bằng khuôn mặt" đã tồn tại đầy đủ**, chỉ chưa có luồng chạy thật đứng sau nó:
   - `OwnerSettingsService.getCheckinConfig/updateCheckinConfig` (`backend/src/owner/settings/owner-settings.service.ts:103-168`) — key `checkin_methods` trong `tenantSettings`, default `{qr:true, manual:true, face:false}`.
   - `updateCheckinConfig` đã gọi `assertFeatureEnabled(tenantId, 'FACE_RECOGNITION', ...)` trước khi cho bật `face`.
   - Frontend `frontend/src/owner/pages/SettingsPage.tsx:685-710` đã có checkbox "face" trong Cấu hình Check-in.
3. **⚠️ Blocker cần xử lý trước tiên (Phase 0):** bảng `platform_features`, `saas_plan_features`, `subscription_features`, `addons` **đang có 0 dòng** trong DB thật — nghĩa là `assertFeatureEnabled()` sẽ **luôn ném lỗi** cho MỌI feature code (không riêng FACE_RECOGNITION). Checkbox "face" trong Owner Settings hiện tại **không thể bật được** dù code đã sẵn sàng, vì thiếu dữ liệu seed. Đây là lỗ hổng của toàn bộ hệ thống entitlement, không phải riêng tính năng face — nhưng phải vá trước khi demo được tính năng này end-to-end.
4. **`backend/docs/checkin.md`** (spec cũ, tiếng Việt) đã liệt kê Face Recognition như 1 trong 3 phương thức check-in (cùng QR, Manual) và đã định nghĩa sẵn `check_out_method` mong muốn gồm `QR | FACE | MANUAL | AUTO_TIMEOUT | AUTO_BRANCH_CLOSING` — tài liệu này mô tả mô hình tương lai (`IN_GYM` thay vì `CHECKED_IN`) **chưa được cài đặt đúng như vậy**; code hiện tại vẫn dùng `CHECKED_IN/CHECKED_OUT` đơn giản. Thiết kế dưới đây bám theo **code thật hiện tại**, không theo tài liệu aspirational đó.
5. **`docs/Phantichnghiepvu.md`** xác nhận đúng phân công vai trò đã chọn: Staff "Hỗ trợ chụp ảnh và đăng ký dữ liệu khuôn mặt (Face Enrollment) cho hội viên" (§2.1 Member Registration), Branch Manager xử lý "khiếu nại thông tin nhận diện khuôn mặt" (§2.3), Customer app chỉ "cung cấp hình ảnh... đăng ký Face ID" ở tương lai (không phải MVP).

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────── KIOSK (trình duyệt, quầy lễ tân) ───────────────────────────┐
│                                                                                          │
│  useFaceApiModels()  ── tải model 1 lần (tinyFaceDetector + faceLandmark68 + faceRecognition) │
│         │                                                                               │
│  FaceCameraCapture   ── mở webcam, vòng lặp detect mỗi ~400ms                            │
│         │                                                                               │
│         ▼                                                                               │
│  faceapi.detectSingleFace(video, TinyFaceDetectorOptions)                               │
│    .withFaceLandmarks().withFaceDescriptor()   → Float32Array(128)                      │
│         │                                                                               │
│         ▼                                                                               │
│  FaceMatcher(descriptorsCủaChiNhánh, threshold=0.5)   ← tải 1 lần lúc mở kiosk           │
│    .findBestMatch(descriptor)  → { customerId, distance } | 'unknown'                   │
│         │ (chỉ khi match, không phải 'unknown')                                         │
│         ▼                                                                               │
│  POST /manager/checkin/face  { customerId, matchScore, deviceId? }  ──────────────────┐ │
└──────────────────────────────────────────────────────────────────────────────────────┼─┘
                                                                                         │
                                                                                         ▼
                                                                    createCheckInRecord({ method:'FACE', ... })
                                                                    (tái dùng y hệt logic manualCheckin/QR hiện có)
```

Nguyên tắc cốt lõi: **kiosk không bao giờ tải ảnh gốc**, chỉ tải mảng descriptor 128 số/khách (không thể suy ngược ra ảnh khuôn mặt), và chỉ cho những khách thuộc chi nhánh + đang có gói hoạt động. So khớp chạy hoàn toàn client-side (không tốn CPU server, không cần GPU backend, độ trễ ~50-200ms/frame trên máy tầm trung).

---

## 2. Enroll khuôn mặt (Staff chụp tại quầy)

### 2.1. UI

Thêm vào `MemberDetailModal.tsx` (hoặc trang tạo khách hàng ở `CustomersPage.tsx`) 1 tab/section "Nhận diện khuôn mặt":
- Nếu khách chưa có `face_profiles` ACTIVE: nút "Đăng ký khuôn mặt" → mở `FaceCameraCapture` (component dùng chung, xem §4.1), yêu cầu staff hướng dẫn khách nhìn thẳng, chụp **3 ảnh** (chính diện, hơi trái, hơi phải) để tăng độ chính xác matching.
- Bắt buộc tick "Khách đồng ý thu thập dữ liệu khuôn mặt để check-in" **trước khi bật camera** — ghi vào `Customer.face_consent_at = now()`, `Customer.face_consent_ip = <IP request>`. Không consent → không cho enroll (tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, vì sinh trắc học là "dữ liệu cá nhân nhạy cảm").
- Sau khi chụp đủ, mỗi ảnh chạy `detectSingleFace().withFaceLandmarks().withFaceDescriptor()` ngay trên trình duyệt; hiển thị cảnh báo nếu không detect được mặt hoặc `detectionScore` quá thấp (ánh sáng yếu, quay lưng...) — bắt chụp lại trước khi cho submit.
- Nếu khách đã có `face_profiles` ACTIVE: hiện thông tin (ngày đăng ký, ai đăng ký) + nút "Đăng ký lại" (revoke bản cũ, tạo bản mới) và "Thu hồi" (chỉ set `status='REVOKED'`, `revoked_at=now()` — không xoá vật lý, giữ lịch sử).

### 2.2. API

**`POST /manager/customers/:customerId/face-profile`** (role: `STAFF, BRANCH_MANAGER, OWNER`)
```ts
// DTO
{
  consentGiven: true,               // bắt buộc true, nếu false → 400
  descriptors: number[][],          // 1-3 mảng, mỗi mảng đúng 128 phần tử (validate độ dài)
  qualityScores?: number[],         // detectionScore của face-api cho từng ảnh, optional
}
```
Service (`FaceProfileService`, module mới `backend/src/face-checkin/`, theo đúng convention `pt`/`manager`):
1. Validate `descriptors[i].length === 128` cho mọi phần tử — chặn payload rác/tấn công.
2. `writeAuditLog` + update `Customer.face_consent_at/face_consent_ip` nếu đây là lần enroll đầu.
3. `face_profiles.upsert` theo `customer_id` (soft-revoke bản ACTIVE cũ nếu có, tạo bản mới `status='ACTIVE'`, `registered_by=user.id`, `provider='vladmandic/face-api'`, giữ giá trị `model_version` = version model đang dùng, ví dụ `'face_recognition_model_v1'`).
4. Với mỗi descriptor: `face_embeddings.create({ face_profile_id, embedding_raw: Buffer.from(Float32Array.from(descriptor).buffer), model_version, quality_score })`. **Không lưu `image_url`** ở MVP — giảm tối đa dữ liệu nhạy cảm lưu trữ (chỉ lưu descriptor toán học, không lưu ảnh khuôn mặt thật; nếu sau này cần lưu ảnh để đối soát khiếu nại, upload lên storage riêng có kiểm soát truy cập và ghi rõ trong chính sách bảo mật cho khách).
5. Emit realtime `face:updated` theo branch (`realtimeGateway.emitToBranch`) để kiosk đang mở tự làm mới danh sách descriptor mà không cần reload.

**`DELETE /manager/customers/:customerId/face-profile`** — thu hồi (`status='REVOKED', revoked_at=now()`), giữ nguyên `face_embeddings` để audit (không xoá).

---

## 3. Check-in tại kiosk

### 3.1. API tải descriptor về kiosk

**`GET /manager/checkin/face-descriptors`** (role: `STAFF, BRANCH_MANAGER, OWNER`, scope theo branch hiện tại của user như `resolveBranchId()`):
```json
{
  "customers": [
    { "customerId": "uuid", "fullName": "Nguyễn Văn A", "descriptors": [[0.12, -0.03, ...128 số...], [...]] }
  ]
}
```
- Chỉ trả khách có `face_profiles.status='ACTIVE'` **và** đang có membership hợp lệ (giống điều kiện `manualCheckin` đang check: `status IN ('ACTIVE','FROZEN')`) — khách hết hạn gói thì kiosk không tải descriptor của họ nữa, tránh false-positive check-in cho người hết hạn.
- Kiosk gọi 1 lần khi mở trang + refetch khi nhận socket event `face:updated`/`checkin_methods` thay đổi — **không** poll liên tục (danh sách vài trăm khách × 128 float × 4 byte ≈ vài trăm KB, chấp nhận được, nhưng không cần tải lại mỗi giây).

### 3.2. Vòng lặp nhận diện trên kiosk

- `FaceMatcher` khởi tạo lại mỗi khi danh sách descriptor thay đổi: `new faceapi.FaceMatcher(labeledDescriptors, 0.5)` — **threshold 0.5** (chặt hơn mặc định 0.6 của thư viện) vì đây là kiểm soát ra/vào, ưu tiên giảm false-accept hơn false-reject; nếu quá nhiều "unknown" thật khi test, có thể nới lên 0.55.
- Vòng lặp `setInterval` ~400-600ms: `detectSingleFace` (dùng `TinyFaceDetectorOptions` để nhẹ, đủ nhanh chạy CPU/WASM, không cần GPU) → nếu có mặt, lấy descriptor → `matcher.findBestMatch()`.
- Khi có match liên tiếp **2 frame** cùng 1 `customerId` (chống nhiễu 1 frame ảnh mờ ăn may khớp) → gọi API check-in, tạm khoá vòng lặp 5s (giống `DECODE_COOLDOWN_MS` của `QrCameraScanner.tsx`) để không gọi API lặp lại liên tục trong lúc khách vẫn đứng trước camera.
- Nếu 1 khung hình detect được **nhiều mặt cùng lúc** (2 khách đứng gần camera) — chỉ xử lý mặt có `detectionScore` cao nhất/gần tâm khung hình nhất, bỏ qua các mặt còn lại của frame đó.

### 3.3. API xác nhận check-in

**`POST /manager/checkin/face`**
```ts
{ customerId: string, matchScore: number /* 1 - distance, để dễ đọc hơn distance */, deviceId?: string }
```
Service tái dùng gần như nguyên vẹn logic của `manualCheckin()` (`backend/src/manager/manager.service.ts:860`):
- Check trùng `CHECKED_IN` hiện có → nếu có, đây là lần thứ 2 khách đứng trước camera trong ngày mà **vẫn đang IN_GYM** → coi là ý định **check-out** (giống hành vi "toggle" của `checkInOrOutViaQr`), không báo lỗi "đang ở trong phòng tập".
- Check membership `ACTIVE|FROZEN` + `HOME_BRANCH` scope — y hệt `manualCheckin`.
- Nếu hợp lệ: gọi `createCheckInRecord({ method: 'FACE', checkInBy: user.id, ... })` — **chỉ cần thêm `'FACE'` vào union type `'MANUAL' | 'QR'` hiện tại** (`manager.service.ts:946`), lưu thêm `face_match_score: params.faceMatchScore` vào `attendances.create` (cột đã có sẵn, hiện chưa được ghi).
- Nếu **không tìm thấy customer / membership hết hạn / sai branch** → không throw 500 cho khách đứng chờ, mà ghi `access_denied_logs.create({ method:'FACE', reason_code: 'MEMBERSHIP_EXPIRED'|'WRONG_BRANCH', customer_id, branch_id, detail:{matchScore} })` rồi trả về lỗi rõ ràng để kiosk hiển thị (vd: "Gói tập đã hết hạn, vui lòng ra quầy lễ tân").

### 3.4. Khi kiosk không nhận ra ai ('unknown')

Không gọi API — chỉ hiện trên màn hình kiosk: *"Không nhận diện được khuôn mặt. Vui lòng dùng QR hoặc liên hệ lễ tân."* + nút chuyển sang `QrCameraScanner` sẵn có ngay trên cùng màn hình kiosk (kiosk nên gộp cả 2: mặc định chạy face-detect nền, có tab phụ bật QR thủ công) để không chặn khách khi nhận diện thất bại (ánh sáng, đổi kiểu tóc, khẩu trang...).

---

## 4. Thành phần Frontend cần xây

### 4.1. `frontend/src/shared/face/` (thư mục dùng chung mới, vì cả staff/manager kiosk đều cần)

- **`useFaceApiModels.ts`** — hook load model 1 lần cho toàn app (React context hoặc module-level singleton promise, tránh tải lại model 6.4MB mỗi lần mount):
  ```ts
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  ```
  File model (`tiny_face_detector_model-*`, `face_landmark_68_model-*`, `face_recognition_model-*`, tổng ~7MB) copy vào `frontend/public/models/` — **tự host, không dùng CDN jsdelivr** (tuân thủ CSP/offline-capable, và tránh phụ thuộc bên thứ 3 cho tính năng an ninh).
- **`FaceCameraCapture.tsx`** — clone cấu trúc từ `QrCameraScanner.tsx` (cùng pattern bật/tắt camera, `useEffect` cleanup, `videoRef`) nhưng dùng `navigator.mediaDevices.getUserMedia` trực tiếp thay vì `qr-scanner`, gắn `faceapi.detectSingleFace(video)` vào vòng lặp thay vì decode QR. Prop `mode: 'enroll' | 'checkin'` để tái dùng cho cả 2 luồng.
- **`faceMatcher.ts`** — wrapper quản lý `FaceMatcher` instance + rebuild khi danh sách descriptor thay đổi.

### 4.2. Trang kiosk mới

`frontend/src/staff/pages/FaceCheckinKioskPage.tsx` (route riêng, ví dụ `/staff/checkin-kiosk`, full-screen, không cần sidebar — nghĩ tới việc chạy trình duyệt ở chế độ kiosk trên 1 màn hình cố định gắn webcam tại quầy). Query `getCurrentlyInGym`/descriptor list qua React Query như các trang khác, subscribe `useRealtimeInvalidate` cho event `face:updated` và `attendance:updated` để danh sách + toast "Đã check-in: Nguyễn Văn A" cập nhật real-time trên chính màn kiosk.

### 4.3. Package mới cần thêm (`frontend/package.json`)

```json
"@vladmandic/face-api": "^1.7.15"
```
Không cần thêm `@tensorflow/tfjs` riêng — package này bundle sẵn.

---

## 5. Thay đổi Schema / Migration cần làm

Theo đúng convention đã dùng trong repo (`prisma/manual-migrations/2026-08-24b-addons.sql` — viết SQL tay rồi `prisma db pull`, **không** dùng `prisma migrate`):

Tạo `prisma/manual-migrations/2026-08-28-face-checkin.sql`:
```sql
-- Cho phép 'FACE' là giá trị hợp lệ của check_in_method / check_out_method.
-- Xác nhận trực tiếp trên DB thật (2026-08-28): attendances hiện KHÔNG có
-- CHECK constraint nào trên 2 cột này (dù nhiều model khác trong schema.prisma
-- có comment "This table contains check constraints" — comment đó không còn
-- đúng thực tế cho attendances/face_profiles/checkin_devices/access_denied_logs,
-- có thể do bị drop thủ công ở lần nào đó, không rõ nguyên nhân). Vẫn nên thêm
-- CHECK tường minh ở đây để không lặp lại lỗi kiểu guest_visits_status_check
-- (silent 500 vì giá trị code ghi không khớp enum DB) khi sau này ai đó thêm cột
-- tương tự mà quên định nghĩa lại.
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
```
Sau khi chạy SQL này trên DB (Neon), chạy `npx prisma db pull` rồi `npx prisma generate` để đồng bộ lại `schema.prisma` (comment check-constraint tự động xuất hiện lại đúng).

**Không cần** tạo bảng mới — `face_profiles`, `face_embeddings`, `checkin_devices`, `access_denied_logs` đã tồn tại sẵn.

---

## 6. Phase 0 bắt buộc: seed Entitlement (nếu muốn dùng đúng toggle Owner Settings có sẵn)

Vì `platform_features`/`saas_plan_features`/`addons` đang trống hoàn toàn, cần 1 trong 2 hướng:

- **Hướng A (đúng kiến trúc, khuyến nghị):** seed 1 dòng `platform_features` code=`FACE_RECOGNITION`, gán `saas_plan_features` cho các plan Growth/Enterprise (không gán Free Trial/Starter — khớp định hướng "gói cao cấp" trong `docs/Phantichnghiepvu.md`), và/hoặc thêm 1 dòng `addons` code=`FACE_RECOGNITION` (đã có sẵn khung migration `addons`/`subscription_addons`) cho tenant nào muốn mua thêm riêng lẻ dù ở plan thấp.
- **Hướng B (tạm thời cho MVP/demo nội bộ):** bypass tạm `assertFeatureEnabled` cho riêng `FACE_RECOGNITION` (feature flag qua env `FACE_CHECKIN_ENABLED=true` để test nội bộ), rồi mở khoá thật qua Hướng A khi đưa ra khách hàng.

Việc seed toàn bộ hệ thống entitlement (đang 0 dòng, ảnh hưởng mọi feature khác, không riêng face) nằm ngoài phạm vi tính năng này — nên xử lý như 1 task hạ tầng riêng, chỉ cần đủ 1 dòng cho `FACE_RECOGNITION` để tính năng này chạy được.

---

## 7. Bảo mật & Quyền riêng tư (quan trọng, sinh trắc học là dữ liệu nhạy cảm)

| Rủi ro | Biện pháp |
|---|---|
| Lộ descriptor hàng loạt nếu kiosk bị xâm nhập | Endpoint `GET /manager/checkin/face-descriptors` yêu cầu JWT hợp lệ role STAFF+ như mọi route khác — **không** làm public endpoint. Chỉ trả descriptor của đúng branch, không phải toàn tenant. |
| Không consent vẫn bị enroll | Bắt buộc `face_consent_at` set trước insert `face_profiles`, chặn ở service layer (không chỉ ở UI). |
| Khách muốn xoá dữ liệu khuôn mặt | Nút "Thu hồi" ở §2.1 — set `REVOKED`, dừng trả về trong `face-descriptors` ngay (query lọc `status='ACTIVE'`). Cân nhắc thêm job xoá cứng `face_embeddings` sau N ngày kể từ revoke nếu chính sách công ty yêu cầu "xoá hẳn" (Nghị định 13/2023 cho phép chủ thể dữ liệu yêu cầu xoá). |
| False-accept (nhận nhầm người) | Threshold 0.5 (chặt), yêu cầu 2 frame liên tiếp cùng match, `access_denied_logs` + `face_match_score` lưu lại mọi lần để Branch Manager tra soát khiếu nại (đúng vai trò đã ghi trong `Phantichnghiepvu.md`). |
| Giả mạo bằng ảnh in/video (spoofing) | **`@vladmandic/face-api` không có liveness detection sẵn.** MVP chấp nhận rủi ro này (rủi ro thấp vì có staff giám sát tại quầy lễ tân, không phải cửa an ninh không người trông). Phase sau nếu cần: thêm thử thách chủ động (yêu cầu chớp mắt/quay đầu, đo eye-aspect-ratio qua các landmark 68 điểm theo thời gian) hoặc chuyển sang thư viện `Human` (có face-liveness module, cùng tác giả, API gần giống). |
| Retention ảnh gốc | Thiết kế này **chủ động không lưu ảnh khuôn mặt** (`image_url` bỏ trống), chỉ lưu descriptor toán học không thể phục hồi thành ảnh — giảm mức độ nhạy cảm của dữ liệu lưu trữ. |

---

## 8. Việc cần sửa trong code hiện có (danh sách cụ thể)

1. `backend/src/manager/manager.service.ts:946` — union type `method: 'MANUAL' | 'QR'` → thêm `| 'FACE'`; `createCheckInRecord` nhận thêm `faceMatchScore?: number` để ghi vào `attendances.face_match_score`.
2. `backend/src/manager/manager.controller.ts` — thêm route `POST checkin/face`, `GET checkin/face-descriptors`.
3. Module mới `backend/src/face-checkin/` — `face-checkin.module.ts`, `face-profile.controller.ts` + `.service.ts` (enroll/revoke), `face-checkin.controller.ts` + `.service.ts` (descriptor list + verify check-in), `dto/face-checkin.dto.ts`. Import vào `manager.module.ts` hoặc để `ManagerModule` import `FaceCheckinModule` (theo đúng cách `AutoCheckoutPolicyModule` đang được import).
4. `backend/prisma/manual-migrations/2026-08-28-face-checkin.sql` — theo §5.
5. `frontend/src/manager/components/MemberDetailModal.tsx` — thêm section enroll khuôn mặt.
6. `frontend/src/shared/face/` — 3 file mới ở §4.1.
7. `frontend/src/staff/pages/FaceCheckinKioskPage.tsx` (+ route trong router của staff app).
8. `frontend/public/models/` — copy model weights từ `@vladmandic/face-api` (build step hoặc commit thẳng ~7MB vào repo, tuỳ policy giữ repo nhẹ — có thể tải qua `postinstall` script thay vì commit).
9. Seed entitlement theo §6.

---

## 9. Đề xuất thứ tự triển khai

```
Phase 0 — Hạ tầng & gỡ blocker
  → Migration §5, seed entitlement §6 (tối thiểu Hướng B để demo nội bộ)

Phase 1 — Enroll (Staff)
  → FaceProfileService, UI trong MemberDetailModal, useFaceApiModels + FaceCameraCapture (mode=enroll)

Phase 2 — Check-in Kiosk (MVP)
  → face-descriptors API, FaceCheckinKioskPage, FaceMatcher client-side, POST checkin/face
  → Test edge case: 2 người trong khung hình, ánh sáng yếu, khách đeo khẩu trang, hết hạn gói

Phase 3 — Hoàn thiện
  → checkin_devices thật (đăng ký kiosk bằng api_key riêng thay vì dùng JWT staff cá nhân,
    để kiosk không cần đăng nhập lại khi staff đổi ca)
  → Face check-out (khách đứng trước camera lần 2 để check-out chủ động, ngoài auto-checkout)
  → Liveness / self-service enroll qua Customer app (đúng như Phantichnghiepvu.md §Customer 2.1
    mô tả cho tương lai) / công cụ tra soát khiếu nại cho Branch Manager (đọc access_denied_logs)
```

---

## 10. Rủi ro & giới hạn cần thông báo cho user

- `@vladmandic/face-api` đã ngừng phát triển (archived) — chấp nhận được cho MVP, nhưng nếu tính năng này sống lâu dài, nên đánh giá lại thư viện `Human` (Phase 3+, không chặn MVP).
- Độ chính xác phụ thuộc ánh sáng tại quầy lễ tân, góc đặt camera, độ phân giải webcam — nên test thực tế với vài chục khách thật trước khi thay hẳn QR.
- Không có liveness detection ở MVP — chấp nhận rủi ro thấp vì có nhân viên giám sát tại chỗ, ghi rõ trong tài liệu để user tự quyết có cần Phase liveness sớm hơn không.
