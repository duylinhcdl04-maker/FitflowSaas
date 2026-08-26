# FitFlow — THIẾT KẾ MÀN HÌNH OWNER: ONBOARDING & DASHBOARD (v1.0)

> Phạm vi: khu vực dành cho Owner (`/owner`), tách khỏi khu vực quản trị nền tảng (`/admin`, xem `UI_SuperAdmin.md`) và marketing site.
> Căn cứ: `backend/docs/Owner/BE_Owner.md`, `backend/docs/Owner/OnBoarding_Dashboard.md`.
> Phạm vi đợt này: **hành trình Onboarding (đăng ký → dùng thử → thiết lập) và màn Dashboard**. Các mục còn lại của sitemap (Chi nhánh, Khách hàng, Membership, PT, Check-in, Thanh toán, Báo cáo, Cài đặt, Subscription chi tiết) liệt kê ở mục IX để giữ bức tranh toàn cảnh, nhưng đặc tả chi tiết từng màn để đợt sau.
> **Trạng thái hiện tại của code:** chưa có gì phía Owner tồn tại — không có app `/owner` ở frontend, không có API tenant-facing nào ở backend (chỉ có `auth` và `super-admin/*`). Tài liệu này là bản thiết kế làm nền cho việc dựng module mới, không mô tả cái đã có.

---

# I. NĂM NGUYÊN TẮC THIẾT KẾ

## NT-1. Owner là khách hàng trả tiền, không phải nhân viên vận hành nội bộ

Khác với SuperAdmin (`UI_SuperAdmin.md` NT-6: "giao diện dày đặc, không phải giao diện đẹp" — vì người dùng là 3–10 nhân sự nội bộ, dùng mỗi ngày), Owner là **khách hàng SaaS trả tiền cho FitFlow**. Giao diện cần thân thiện, có onboarding dẫn dắt, có trạng thái rỗng (empty state) tử tế — đúng như cả hai tài liệu gốc đều nhấn mạnh. Owner Portal nên có ngôn ngữ thị giác gần với sản phẩm tiêu dùng (giống trang marketing) hơn là bảng điều khiển nội bộ, dù vẫn cần mật độ thông tin cao ở màn Dashboard/Báo cáo.

## NT-2. Dashboard trả lời quyết định, không phải liệt kê dữ liệu

Trích nguyên văn `OnBoarding_Dashboard.md`: *"Dashboard không nên trở thành một trang chứa tất cả dữ liệu. Nó phải là màn hình hỗ trợ ra quyết định và điều hướng đến các vấn đề cần xử lý."* Khu vực "Cần chú ý" (Attention Center) được tài liệu gốc xác định là **phần quan trọng nhất** của Dashboard — ưu tiên hiển thị trên các con số thuần tuý.

## NT-3. Không bắt Owner nhìn Dashboard trống sau khi đăng ký

Trích `BE_Owner.md`: *"không nên bắt Owner đăng nhập xong là thấy một Dashboard trống hoàn toàn."* Hệ thống phải dẫn dắt qua Onboarding Checklist, nhưng **không bắt buộc hoàn thành mới được dùng** — luôn có lối thoát "Vào Dashboard" ở mọi bước.

## NT-4. Dùng thử trước, thanh toán sau — nhưng có giới hạn tài nguyên rõ ràng

Đây là quyết định nghiệp vụ cốt lõi xuyên suốt `BE_Owner.md` (bản sửa cuối, mục XIV): Owner đăng ký → tạo Tenant → **được cấp Trial 7 ngày ngay lập tức, không cần thanh toán** → mới đến bước chọn gói khi Trial gần hết hoặc muốn dùng sớm. Đừng thiết kế lại thành mô hình "chọn gói rồi mới tạo Tenant" ở bản đầu tài liệu — bản đó đã được chính tài liệu gốc thay thế.

## NT-5. Trial hết hạn không xoá dữ liệu, chỉ hạn chế quyền ghi

`READ_ONLY` khi Trial hết hạn, `SUSPENDED` sau Grace Period — không bao giờ xoá dữ liệu nghiệp vụ. Nguyên tắc này khớp với `BR-SA-001`/`BR-DATA-001` đã áp dụng cho toàn hệ thống (`AI_INSTRUCTIONS.md`).

---

# II. TRẠNG THÁI & LUỒNG CHUYỂN ĐỔI

Tài liệu gốc đề xuất tách ba trường trạng thái độc lập — **đây là quyết định kiến trúc quan trọng nhất của toàn bộ đặc tả này**, mọi UI theo sau phải tôn trọng:

```text
Subscription Status:  TRIAL | ACTIVE | EXPIRED | CANCELLED
Tenant Status:         PENDING | ACTIVE | SUSPENDED | ARCHIVED
Access Mode:           FULL_ACCESS | READ_ONLY | LIMITED_ACCESS | BLOCKED
```

| Trường hợp | Subscription | Tenant | Access Mode | UI thể hiện |
|---|---|---|---|---|
| Đang Trial | TRIAL | ACTIVE | FULL_ACCESS | Banner "Dùng thử — còn N ngày" |
| Đã mua, còn hạn | ACTIVE | ACTIVE | FULL_ACCESS | Không banner |
| Trial hết hạn (trong Grace Period) | EXPIRED | ACTIVE | READ_ONLY | Banner đỏ + khoá mọi CTA tạo dữ liệu |
| Quá Grace Period | EXPIRED | SUSPENDED | BLOCKED | Chỉ vào được Subscription/Billing |
| Bị SuperAdmin khoá | ACTIVE/EXPIRED | SUSPENDED | BLOCKED | Giống trên, thông báo lý do khác |

**Không dùng một trường status duy nhất cho tất cả các trường hợp trên** — đây là lỗi thiết kế phổ biến mà tài liệu gốc cảnh báo rõ ràng.

## Vòng đời Trial

```text
Đăng ký Account → Xác thực → Tạo Tenant
                                  │
                                  ▼
                    Tenant.status = ACTIVE
                    Subscription.status = TRIAL
                    Trial: 7 ngày, tính theo timestamp
                    (không chỉ theo ngày — để backend xử lý chính xác)
                                  │
                                  ▼
                         Owner vào Onboarding
                                  │
                                  ▼
                      ┌───────────┴───────────┐
                      │                       │
              Thanh toán trước           Không thanh toán
              khi hết Trial              trước khi hết Trial
                      │                       │
                      ▼                       ▼
          Subscription = ACTIVE       Trial hết hạn (mốc 7 ngày)
          (KHÔNG cộng dồn ngày             │
           Trial còn lại — Subscription    ▼
           Start = ngày thanh toán)   Subscription = EXPIRED
                      │              Access Mode = READ_ONLY
                      │              (Grace Period 30 ngày)
                      │                     │
                      │          ┌──────────┴──────────┐
                      │     Thanh toán trong        Hết 30 ngày
                      │     Grace Period             không thanh toán
                      │          │                       │
                      │          ▼                       ▼
                      │  Subscription = ACTIVE    Tenant = SUSPENDED
                      │  Access Mode = FULL       Access Mode = BLOCKED
                      └──────────┴───────────────────────┘
```

## ⚠️ Điểm cần chốt trước khi lên schema (xem mục X)

Bảng "Trial Entitlement" trong `BE_Owner.md` (Branch tối đa 1, Staff 5–10) **khác với** `PackageSaasTrial.md` đã chốt trước đó trong dự án (Branch tối đa **2**, User tối đa **10**, đủ cho 1 Owner + 1 BM + 4 Staff + 4 PT). Tài liệu này lấy `PackageSaasTrial.md` làm chuẩn vì nó là tài liệu chuyên biệt cho đúng chủ đề này, đã được chốt trước — nhưng đây vẫn là quyết định nghiệp vụ cần bạn xác nhận lại, không phải quyết định thiết kế.

---

# III. BẢN ĐỒ MÀN HÌNH (PHẠM VI ĐỢT NÀY)

```text
/owner (public, chưa đăng nhập)
│
├── OW-00  Đăng ký tài khoản Owner
├── OW-01  Xác thực tài khoản (OTP)
│
/owner (đã đăng nhập, Tenant chưa tồn tại)
├── OW-02  Tạo doanh nghiệp (Tenant)
├── OW-03  Chào mừng — kích hoạt Trial 7 ngày
│
/owner/onboarding (Trial đang chạy, chưa hoàn thành thiết lập)
├── OW-04  Danh sách việc cần làm (Onboarding Checklist)
│           ├── OW-04a  Bước 1 — Tạo chi nhánh đầu tiên
│           ├── OW-04b  Bước 2 — Mời nhân sự
│           ├── OW-04c  Bước 3 — Thiết lập dịch vụ & gói tập
│           └── OW-04d  Bước 4 — Thiết lập phương thức Check-in
│
/owner (đã đăng nhập, mọi lúc)          ◄── màn mặc định sau đăng nhập
├── OW-05  Dashboard (Business Overview)          [màn quan trọng nhất]
├── OW-06  Trial sắp hết hạn / Trial đã hết hạn    [banner + màn chuyển tiếp]
├── OW-07  Chọn gói SaaS
└── OW-08  Thanh toán gói SaaS
```

Ngoài phạm vi đợt này (đã liệt kê trong sitemap đầy đủ ở mục IX, chưa đặc tả chi tiết): Chi nhánh, Khách hàng, Membership, PT & Booking, Check-in, Thanh toán vận hành, Báo cáo, Thông báo, Nhân sự, Cài đặt, Subscription chi tiết.

Điều hướng chung: sidebar cố định bên trái sau khi có Tenant (danh sách đầy đủ ở mục IX), header trên cùng luôn hiển thị tên doanh nghiệp + bộ lọc chi nhánh/thời gian (chỉ áp dụng cho các màn dữ liệu, không áp dụng cho Onboarding).

---

# IV. ĐẶC TẢ TỪNG MÀN HÌNH

---

## OW-00 — Đăng ký tài khoản Owner

**Mục đích:** chuyển một người quan tâm (Lead) thành một Account. **Chưa tạo Tenant ở bước này** — Owner có thể bỏ dở giữa chừng.

```text
┌───────────────────────────────────────┐
│               FITFLOW                 │
│                                       │
│     Bắt đầu quản lý phòng tập          │
│                                       │
│ Họ và tên                             │
│ [____________________________]        │
│                                       │
│ Email                                 │
│ [____________________________]        │
│                                       │
│ Số điện thoại                         │
│ [____________________________]        │
│                                       │
│ Mật khẩu                              │
│ [____________________________]        │
│                                       │
│ Xác nhận mật khẩu                     │
│ [____________________________]        │
│                                       │
│        [ Tạo tài khoản ]              │
│                                       │
│ Đã có tài khoản? [Đăng nhập]          │
└───────────────────────────────────────┘
```

**Kết quả backend:** tạo `users` với `user_type = TENANT`, `tenant_id = NULL` tạm thời, trạng thái ở dạng chờ xác thực (ví dụ `status = PENDING`). Role `OWNER` chỉ gán khi Tenant được tạo ở OW-02 — trước đó user này chưa thuộc Tenant nào.

**Validate:** email/số điện thoại chưa từng đăng ký; mật khẩu tối thiểu theo chính sách chung của hệ thống.

---

## OW-01 — Xác thực tài khoản (OTP)

```text
┌─────────────────────────────────────┐
│        Xác thực tài khoản           │
│                                     │
│ Chúng tôi đã gửi mã xác nhận đến    │
│ email của bạn.                      │
│                                     │
│       [ _ ] [ _ ] [ _ ] [ _ ]       │
│                                     │
│        [ Xác nhận ]                  │
│                                     │
│ Gửi lại mã sau 01:25                │
└─────────────────────────────────────┘
```

Sau xác thực: `user.status = ACTIVE`, chuyển sang OW-02. Đếm ngược gửi lại mã (chống spam) — không cho gửi lại trước khi hết đếm ngược.

---

## OW-02 — Tạo doanh nghiệp (Tenant)

**Một màn đơn giản**, không phải wizard nhiều bước — vì mô hình đã chốt là dùng thử ngay, không chọn gói/thanh toán tại bước này (khác bản nháp đầu của `BE_Owner.md`).

```text
┌─────────────────────────────────────────────┐
│ Doanh nghiệp của bạn                        │
│                                             │
│ Tên phòng tập / thương hiệu                 │
│ [ FitFlow Fitness                      ]     │
│                                             │
│ Loại hình                                  │
│ [ Gym / Fitness ▼ ]                         │
│                                             │
│ Email liên hệ                              │
│ [_______________________________]           │
│                                             │
│ Số điện thoại                              │
│ [_______________________________]           │
│                                             │
│ Địa chỉ chính                              │
│ [_______________________________]           │
│                                             │
│                  [Bắt đầu dùng thử →]        │
└─────────────────────────────────────────────┘
```

**Khi bấm "Bắt đầu dùng thử":** tạo trong cùng một transaction — `tenants` (status `ACTIVE`), gán `user_roles` role `OWNER` cho user hiện tại, tạo `subscriptions` (status `TRIAL`, `start_date` = timestamp hiện tại, `trial_ends_at` = +7 ngày theo `PackageSaasTrial.md`), snapshot `subscription_features` theo Trial Entitlement. Không tạo `saas_invoices` — Trial không phát sinh hoá đơn.

**BR-TENANT-CREATE-01:** chỉ tạo được Tenant khi user chưa sở hữu Tenant nào khác đang ở trạng thái Trial chưa dùng — xem BR-TRIAL-04 ở mục V.

---

## OW-03 — Chào mừng, kích hoạt Trial

```text
┌───────────────────────────────────────────────┐
│                                               │
│              🎉 Chào mừng đến FitFlow!         │
│                                               │
│   Doanh nghiệp của bạn đã được tạo thành công │
│                                               │
│        Bạn được dùng thử miễn phí 7 ngày       │
│                                               │
│       Thời gian dùng thử còn: 7 ngày           │
│                                               │
│          [ Bắt đầu thiết lập → ]               │
│                                               │
└───────────────────────────────────────────────┘
```

Mục tiêu UX (nguyên văn tài liệu gốc): Owner hiểu ngay ba điều — đã tạo doanh nghiệp thành công, có thể bắt đầu sử dụng ngay, chưa cần thanh toán nhưng thời gian Trial có giới hạn. Bấm "Bắt đầu thiết lập" → OW-04.

---

## OW-04 — Onboarding Checklist

```text
THIẾT LẬP PHÒNG TẬP CỦA BẠN
Hoàn thành các bước để bắt đầu vận hành

✓ Thông tin doanh nghiệp

① Tạo cơ sở đầu tiên
② Thêm nhân viên
③ Tạo gói tập
④ Thiết lập Check-in

[ Tiếp tục thiết lập ]        [ Vào Dashboard ]
```

**Không bắt buộc hoàn thành** (NT-3) — nút "Vào Dashboard" luôn hiển thị. Trạng thái từng bước lưu ở cấp Tenant (ví dụ `tenant_settings` key `onboarding_progress`), không phải điều kiện chặn truy cập.

### OW-04a — Bước 1: Tạo chi nhánh đầu tiên

```text
Tên chi nhánh      [________________]
Địa chỉ            [________________]
Số điện thoại      [________________]
Giờ mở cửa         [_____]  Giờ đóng cửa  [_____]

                          [Tạo chi nhánh]
```

**BR-TRIAL-BRANCH-01:** kiểm tra `MAX_BRANCH` theo Trial Entitlement (2, theo `PackageSaasTrial.md`) trước khi cho tạo — cùng cơ chế `PLAN_LIMIT_EXCEEDED` áp dụng cho mọi gói, không phải luật riêng cho Trial.

### OW-04b — Bước 2: Mời nhân sự

```text
Email hoặc SĐT     [________________]
Vai trò            ○ Branch Manager   ○ Staff   ○ PT
Chi nhánh          [ Chọn chi nhánh ▼ ]

                          [ Gửi lời mời ]
```

**BR-INVITE-01:** Owner không tự đặt mật khẩu hộ nhân viên. Luồng: `Gửi lời mời (email) → Nhân viên bấm link → Tự đặt mật khẩu → Account ACTIVE`. Đây là cơ chế khác với cách SuperAdmin đặt lại mật khẩu Owner (SA-03) — ở đó không có mail service nên trả mật khẩu tạm trực tiếp; ở đây có lời mời qua email nên **phải** dùng luồng tự đặt mật khẩu, không phát mật khẩu tạm.

### OW-04c — Bước 3: Thiết lập dịch vụ & gói tập

```text
Dịch vụ (Service)
[ Gym ] [ Yoga ] [ Fitness ] [+ Thêm dịch vụ]

Gói tập (Membership Package)
Tên gói         [________________]
Giá             [________________] đ
Thời hạn        [___] [ngày ▾]
Phạm vi         ○ Chỉ chi nhánh này   ○ Toàn hệ thống (cần gói hỗ trợ đa chi nhánh)

                          [Tạo gói tập]
```

**BR-TRIAL-SCOPE-01:** tuỳ chọn "Toàn hệ thống" (`ALL_BRANCHES`) chỉ bật khi Trial Entitlement cho phép đa chi nhánh — theo `PackageSaasTrial.md`, Trial **có** mở khoá tính năng này để Owner thử nghiệm.

### OW-04d — Bước 4: Thiết lập Check-in

```text
Phương thức Check-in được phép

☑ Quét mã QR cá nhân
☑ Check-in thủ công tại quầy
☑ Nhận diện khuôn mặt          [Đang dùng thử — có trong gói Trial]

                          [Hoàn tất thiết lập]
```

Sau bước này → OW-05 Dashboard. Nếu Owner bấm "Vào Dashboard" ở bất kỳ bước nào trước đó, checklist vẫn hiển thị dạng thu gọn trên Dashboard cho tới khi hoàn tất hoặc bị ẩn thủ công.

---

## OW-05 — Dashboard (Business Overview) ⭐ Màn quan trọng nhất

**Mục đích** (nguyên văn `OnBoarding_Dashboard.md`): trả lời nhanh — doanh nghiệp hôm nay hoạt động thế nào, bao nhiêu khách đang hoạt động/có mặt, doanh thu ra sao, chi nhánh nào cần chú ý, có vấn đề gì cần xử lý ngay, gói SaaS còn đủ tài nguyên không.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Chào buổi sáng, Trung 👋                                                   │
│  Theo dõi tình hình hoạt động doanh nghiệp của bạn                         │
│                                                                            │
│  [Tất cả chi nhánh ▾]  [Hôm nay ▾]                                        │
├────────────────────────────────────────────────────────────────────────────┤
│  ⏳ Bạn đang dùng thử FitFlow · Còn 6 ngày 12 giờ    [Chọn gói] [Ẩn]        │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐            │
│  │ 💰 DOANH THU │ 📍 CHECK-IN  │ 🏋 ĐANG TẬP  │ 👥 MEMBER    │            │
│  │ 12.500.000đ  │ 125 lượt     │ 42 khách     │ 1.245        │            │
│  │ ▲ 15%        │ ▲ 8%         │ (thời điểm   │ ▲ 12%        │            │
│  │              │ 110 · 15     │  hiện tại)   │              │            │
│  └──────────────┴──────────────┴──────────────┴──────────────┘            │
│                                                                            │
│  ┌─────────────────────────────────┬──────────────────────────────────┐   │
│  │ DOANH THU                       │ ⚠ CẦN CHÚ Ý                      │   │
│  │ [Ngày] [Tuần] [Tháng]           │ 🔴 5 Membership hết hạn hôm nay  │   │
│  │                                 │ 🟠 12 Membership hết hạn 7 ngày  │   │
│  │      ▁▂▃▃▄▅▅▆▇█                 │ 🟡 3 khách chưa Check-out lâu    │   │
│  │                                 │ 🔵 Đã dùng 90% giới hạn Staff    │   │
│  │                                 │                    [Xem tất cả]  │   │
│  └─────────────────────────────────┴──────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────┬──────────────────────────────────┐   │
│  │ HIỆU SUẤT CHI NHÁNH             │ GÓI SỬ DỤNG                      │   │
│  │ (chỉ hiện khi ≥ 2 chi nhánh)    │ FITFLOW GROWTH                   │   │
│  │ Cầu Giấy   ███████████  12.5M  │ ● Trial còn 5 ngày                │   │
│  │ Mỹ Đình    ████████     8.2M   │ Chi nhánh  ████░ 1 / 2            │   │
│  │ Hà Đông    █████        5.6M   │ Nhân sự    ██░░░ 3 / 10           │   │
│  │                  [Xem chi tiết] │              [Nâng cấp gói]      │   │
│  └─────────────────────────────────┴──────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ HOẠT ĐỘNG GẦN ĐÂY                                                   │   │
│  │ 10:30 — Nguyễn Văn A Check-in tại Branch Cầu Giấy                   │   │
│  │ 10:15 — Membership mới được tạo cho Trần B                          │   │
│  │ 10:00 — Thanh toán thành công 1.200.000 VNĐ                         │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

### A. Context & Filter

- **Tên doanh nghiệp** luôn hiển thị — Owner phải luôn biết mình đang xem Tenant nào (dù chỉ có một Tenant, để nhất quán khi mở rộng multi-tenant-per-owner sau này).
- **Bộ lọc chi nhánh** (`BR-OD-01`): chỉ liệt kê chi nhánh có `tenant_id = currentOwner.tenant_id`. Không bao giờ nhận `branchId` của Tenant khác dù biết ID.
- **Khoảng thời gian**: Hôm nay / Hôm qua / 7 ngày qua / Tháng này / Tuỳ chỉnh. Mặc định "Hôm nay".
- **Lưu ý hiển thị quan trọng**: các KPI vận hành tức thời (Đang tập) luôn tính theo *thời điểm hiện tại*, không phụ thuộc Date Range đã chọn — phải ghi rõ trong UI ("42 khách đang ở phòng tập ngay lúc này") để tránh hiểu nhầm khi Date Range = "Tháng này".

### B. KPI Cards (4 thẻ, ưu tiên P0)

| Thẻ | Công thức | Business Rule |
|---|---|---|
| Doanh thu | Tổng `payments.status` thành công trong kỳ | `BR-OD-02`: chỉ tính `PAID`/`SUCCESS`, không tính `PENDING/FAILED/CANCELLED/REFUNDED`. `BR-OD-05`: tính theo thời điểm thanh toán thành công, không theo ngày tạo Membership |
| Check-in | Đếm lượt check-in hợp lệ trong kỳ (tách Member/Guest) | `BR-OD-03`: chỉ đếm `status = CHECKED_IN` hợp lệ; lượt đã Undo (`CANCELLED`) không được tính |
| Đang tập | `CHECKED_IN AND NOT CHECKED_OUT` tại thời điểm hiện tại | `BR-OD-09`: theo trạng thái Check-in/Check-out thời gian thực. `BR-OD-10`: Auto Checkout phải cập nhật ngay, không chờ Staff thao tác |
| Member đang hoạt động | Khách có ít nhất 1 Membership hợp lệ | `BR-OD-04`: một khách có nhiều Membership vẫn chỉ tính 1 lần |

### C. Biểu đồ doanh thu

Chuyển đổi Ngày/Tuần/Tháng. Nguồn: `GET /owner/dashboard/revenue?branchId=&from=&to=&groupBy=day`.

### D. Hiệu suất chi nhánh

`BR-OD-06`: **chỉ hiển thị khi Tenant có ≥ 2 chi nhánh** — Tenant 1 chi nhánh (đúng như hạn mức Basic Plan) không cần widget so sánh vô nghĩa với chính mình. Khi Owner đã lọc theo một chi nhánh cụ thể, widget này ẩn hoặc đổi thành "Tóm tắt chi nhánh" (không so sánh, chỉ hiển thị số của chi nhánh đang chọn).

### E. Cần chú ý (Attention Center) — quan trọng nhất theo tài liệu gốc

Phân theo mức độ ưu tiên `CRITICAL/HIGH/MEDIUM/LOW`, giới hạn hiển thị Top 5–10, có link "Xem tất cả". Ví dụ nội dung: Membership hết hạn hôm nay/trong 7 ngày, khách chưa Check-out bất thường lâu, chi nhánh gần chạm hạn mức Staff/Branch của gói.

### F. Hoạt động gần đây

`BR-OD-07`: chỉ hiển thị **sự kiện nghiệp vụ** (check-in, tạo Membership, thanh toán, đặt lịch PT) — tuyệt đối không hiển thị sự kiện kỹ thuật (đăng nhập, refresh token, request API).

### G. Gói sử dụng (Subscription & Usage)

`BR-OD-08`: widget này phải tính từ **Entitlement thực tế** (Plan + Subscription snapshot + Override/Add-on), **không** lấy thẳng giới hạn từ Plan gốc — đúng kiến trúc ba lớp đã dựng ở phía SuperAdmin (`subscription_features` snapshot + `tenant_feature_overrides`, xem `UI_SuperAdmin.md` SA-03 Tab 2). Hiển thị khác nhau theo trạng thái:
- Đang Trial: "Trial còn N ngày"
- Đã mua, còn hạn xa: "Gia hạn sau N ngày"
- Sắp hết hạn: "⚠ Gói của bạn sẽ hết hạn sau N ngày"

### Empty State (EC-OD-01)

Khi Tenant chưa có chi nhánh/khách hàng nào, **không hiển thị "Doanh thu: 0đ" khô khan**. Thay bằng:

> *"Bạn chưa có chi nhánh nào. Hãy tạo chi nhánh đầu tiên để bắt đầu vận hành."* — kèm CTA quay lại OW-04a.

### Trạng thái Read-Only (EC-OD-02)

Khi `Access Mode = READ_ONLY` (Trial hết hạn hoặc quá hạn thanh toán): Dashboard vẫn hiển thị đầy đủ số liệu lịch sử, nhưng **mọi CTA tạo dữ liệu mới bị khoá** (không phải ẩn — khoá kèm giải thích, để Owner hiểu vì sao, theo đúng tinh thần NT-4 của `UI_SuperAdmin.md`: cho thấy hệ quả trước khi chặn).

### API tổng hợp (tránh gọi rời rạc nhiều endpoint khi vào trang)

```http
GET /owner/dashboard/overview?branchId=&from=&to=
```

```json
{
  "context": { "tenantId": "...", "branchId": null, "dateRange": { "from": "...", "to": "..." } },
  "kpis": { "revenue": {}, "checkins": {}, "currentlyInGym": 42, "activeMembers": 1245 },
  "revenueChart": [],
  "branchPerformance": [],
  "alerts": [],
  "recentActivities": [],
  "subscription": {}
}
```

---

## OW-06 — Banner & màn chuyển tiếp khi Trial sắp/đã hết hạn

Không phải màn riêng biệt mà là **các trạng thái của Dashboard**, mốc thời gian đề xuất:

| Còn lại | Hình thức |
|---|---|
| 7–4 ngày | Banner nhẹ: "Bạn đang trải nghiệm FitFlow miễn phí." |
| 3 ngày | Banner vàng: "⏳ Thời gian dùng thử còn 3 ngày. Hãy chọn gói phù hợp để tiếp tục sử dụng." |
| 1 ngày | Banner đỏ: "⚠ Trial của bạn sẽ kết thúc sau 24 giờ." |
| Hết hạn | Chuyển hẳn sang màn OW-06b (dưới) ở lần đăng nhập/điều hướng tiếp theo |

### OW-06b — Màn Trial Expired (hiển thị một lần khi vừa hết hạn)

```text
┌───────────────────────────────────────────────────────┐
│                 Thời gian dùng thử đã kết thúc         │
│                                                       │
│ Cảm ơn bạn đã trải nghiệm FitFlow.                     │
│ Dữ liệu của bạn vẫn được lưu an toàn.                  │
│                                                       │
│ Chọn gói phù hợp để tiếp tục vận hành phòng tập.       │
│                                                       │
│              [ XEM CÁC GÓI SỬ DỤNG ]                   │
└───────────────────────────────────────────────────────┘
```

Sau đó Owner vẫn có thể vào Dashboard ở chế độ `READ_ONLY` — màn này không phải màn chặn duy nhất, chỉ là thông báo một lần.

---

## OW-07 — Chọn gói SaaS

```text
┌───────────────┐ ┌────────────────┐ ┌────────────────┐
│ BASIC         │ │ STANDARD ⭐    │ │ ENTERPRISE     │
│ 1 Chi nhánh   │ │ 3 Chi nhánh    │ │ Không giới hạn │
│ 5 Nhân sự     │ │ 15–20 Nhân sự  │ │ Không giới hạn │
│ xxx/tháng     │ │ xxx/tháng      │ │ Liên hệ        │
│ [ Chọn gói ]  │ │ [ Chọn gói ]   │ │ [ Liên hệ ]    │
└───────────────┘ └────────────────┘ └────────────────┘
       [ Thanh toán theo tháng ]  [ Thanh toán theo năm ]
```

Ba gói và hạn mức lấy đúng theo `Bussinessrule_PackageSaas.md` (Cơ bản/Tiêu chuẩn/Nâng cao) đã chốt trước đó trong dự án — **không tự đặt tên/hạn mức gói mới** ở màn này.

---

## OW-08 — Thanh toán gói SaaS

```text
┌──────────────────────────────────────┐
│ Thanh toán                            │
├──────────────────────────────────────┤
│ Gói: FITFLOW STANDARD                │
│ Chu kỳ: Hàng tháng                   │
│ Giá: xxx VND                         │
│ Tổng cộng: xxx                       │
│                                       │
│         [ Quét mã VietQR ]            │
└──────────────────────────────────────┘
```

**BR-PAY-ACTIVATE-01:** chỉ `Payment SUCCESS` mới kích hoạt `Subscription = ACTIVE` và cập nhật Entitlement. `PENDING/FAILED/EXPIRED` giữ nguyên quyền truy cập hiện tại (không nâng, cũng không hạ thêm).

**BR-TRIAL-05 (đã chốt hướng xử lý, xem mục V):** nếu Owner thanh toán trước khi Trial hết hạn, **không cộng dồn** số ngày Trial còn lại — `Subscription.start_date` = ngày thanh toán thành công.

---

# V. BUSINESS RULES TỔNG HỢP

## Nhóm Trial

| ID | Nội dung |
|---|---|
| `BR-TRIAL-01` | Trial bắt đầu khi **Tenant được tạo thành công**, không phải khi Account đăng ký. Tính theo timestamp, không chỉ theo ngày |
| `BR-TRIAL-02` | Trial cấp Core Feature gần như đầy đủ (để Owner trải nghiệm trọn chu trình: Tạo chi nhánh → Thêm nhân sự → Bán Membership → Check-in → Xem báo cáo), nhưng giới hạn theo Usage — con số cụ thể theo `PackageSaasTrial.md` (2 chi nhánh, 10 tài khoản nhân sự), không phải bảng đề xuất khác trong `BE_Owner.md` (xem cảnh báo mục II) |
| `BR-TRIAL-03` | Trial hết hạn → `Subscription = EXPIRED`, `Tenant` giữ `ACTIVE`, `Access Mode = READ_ONLY` trong Grace Period 30 ngày. Không xoá dữ liệu |
| `BR-TRIAL-04` | Mỗi user chỉ được cấp Trial một lần cho MVP: cờ `hasUsedTrial` trên `users`, kèm bảng `trial_history` (`trial_id, user_id, tenant_id, start_at, end_at, status`) để SuperAdmin theo dõi bất thường thủ công. Không xây cơ chế chống lạm dụng nâng cao (định danh doanh nghiệp, giấy phép kinh doanh...) ở MVP — ưu tiên đăng ký nhanh |
| `BR-TRIAL-05` | Nếu Owner thanh toán trước khi Trial hết hạn: **không cộng dồn** ngày Trial còn lại vào Subscription mới. `Subscription.start_date` = thời điểm thanh toán thành công |
| `BR-TRIAL-06` | Sau 30 ngày Grace Period không thanh toán: `Tenant = SUSPENDED`, `Access Mode = BLOCKED`. Owner vẫn đăng nhập được nhưng chỉ thấy Subscription/Billing/Support — dữ liệu nghiệp vụ không bị xoá |

## Nhóm Dashboard

| ID | Nội dung |
|---|---|
| `BR-OD-01` | Owner chỉ xem dữ liệu thuộc Tenant của mình — API không trả dữ liệu Tenant khác dù biết ID |
| `BR-OD-02` | Doanh thu chỉ tính Payment trạng thái thành công (`PAID`/`SUCCESS`) |
| `BR-OD-03` | Check-in đã Undo (`CANCELLED`) không tính vào KPI |
| `BR-OD-04` | Một khách hàng chỉ tính một lần trong "Member đang hoạt động" dù có nhiều Membership |
| `BR-OD-05` | Doanh thu tính theo thời điểm thanh toán thành công, không theo ngày tạo Membership |
| `BR-OD-06` | Widget Hiệu suất chi nhánh chỉ hiển thị khi Tenant có ≥ 2 chi nhánh |
| `BR-OD-07` | Hoạt động gần đây chỉ hiển thị sự kiện nghiệp vụ, không hiển thị sự kiện kỹ thuật |
| `BR-OD-08` | Widget Gói sử dụng tính từ Entitlement thực tế (Plan + Snapshot + Override/Add-on), không lấy thẳng từ Plan gốc |
| `BR-OD-09` | "Đang tập" = `CHECKED_IN AND NOT CHECKED_OUT` tại thời điểm hiện tại, độc lập với Date Range đã chọn |
| `BR-OD-10` | Auto Checkout phải cập nhật ngay trạng thái "Đang tập", không chờ thao tác của Staff |
| `BR-OD-11` | Khi `Access Mode = READ_ONLY`: Dashboard vẫn hiển thị dữ liệu lịch sử, nhưng mọi CTA tạo dữ liệu mới bị khoá kèm giải thích |
| `BR-OD-12` | Khi Tenant chưa có dữ liệu (0 chi nhánh/khách hàng): hiển thị Empty State hướng dẫn, không hiển thị KPI "0" khô khan |

## Nhóm Onboarding

| ID | Nội dung |
|---|---|
| `BR-INVITE-01` | Owner mời nhân sự qua email/SĐT, nhân sự tự đặt mật khẩu khi chấp nhận lời mời — Owner không tự đặt mật khẩu hộ |
| `BR-ONBOARD-01` | Hoàn thành Onboarding Checklist không phải điều kiện bắt buộc để dùng hệ thống — luôn có lối thoát "Vào Dashboard" |

---

# VI. MA TRẬN ƯU TIÊN TRIỂN KHAI

**P0 — Bắt buộc MVP:**
`OW-00` đăng ký · `OW-01` xác thực · `OW-02` tạo Tenant · `OW-03` chào mừng Trial · `OW-05` Dashboard (Bộ lọc chi nhánh + thời gian, 4 KPI, Biểu đồ doanh thu, Attention Center, Empty State)

**P1 — Nên có:**
`OW-04` Onboarding Checklist đầy đủ 4 bước · Hiệu suất chi nhánh · Hoạt động gần đây · Widget Gói sử dụng · `OW-06` banner/màn Trial hết hạn · `OW-07`/`OW-08` chọn gói & thanh toán

**P2 — Phát triển sau:**
So sánh nhiều kỳ · Dự báo doanh thu · AI Insight · Benchmark giữa các chi nhánh · Phát hiện bất thường tự động

---

# VII. RÀNG BUỘC KỸ THUẬT (khi bắt đầu code)

Vì backend hiện **chưa có API tenant-facing nào**, việc dựng OW-* cần đi kèm dựng mới hoàn toàn:

1. **Auth phía Tenant:** `AuthService.login()` hiện chỉ xử lý `user_type = PLATFORM` (xem comment trong `auth.service.ts`). Cần mở rộng cho `user_type = TENANT`, bao gồm kiểm tra `tenant.status` (đã có sẵn nhánh xử lý phòng thủ trong code, nhưng chưa có luồng gọi tới).
2. **Module `owner/*` mới** ở backend, theo đúng pattern 4-file (`module/controller/service/dto`) đã dùng cho `super-admin/*`, mọi query bắt buộc `WHERE tenant_id = :currentTenantId` (`BR-OD-01`, đúng luật `AI_INSTRUCTIONS.md` mục I.2).
3. **Bảng mới cần thêm:** `trial_history` (BR-TRIAL-04). Cân nhắc thêm cột `has_used_trial` trên `users` hoặc suy ra từ `trial_history` trực tiếp (tránh trạng thái trùng lặp).
4. **KPI "Đang tập"/Doanh thu theo kỳ** ở quy mô lớn nên đọc từ `daily_branch_stats` giống khuyến nghị đã áp dụng cho SA-01 (`UI_SuperAdmin.md`), tránh COUNT trực tiếp trên `attendances`/`payments` khi dữ liệu lớn.
5. **App `frontend/src/owner/`** mới, độc lập với `frontend/src/admin/` — không dùng chung `AdminLayout`/route `/admin/*`. Có thể tái dùng các primitive UI trung lập (Modal/Callout/Toggle vừa nâng cấp) nếu ngôn ngữ thị giác được thống nhất là dùng chung; nếu chọn hướng "thân thiện hơn" theo NT-1, cân nhắc bộ component riêng.

---

# VIII. NHỮNG ĐIỂM CẦN CHỐT

1. **Hạn mức Trial:** `PackageSaasTrial.md`sử dụng bảng đề xuất riêng trong `BE_Owner.md` (1 chi nhánh, 5–10 staff)
2. **Grace Period 30 ngày** là đề xuất mới, chưa xuất hiện ở bất kỳ tài liệu nào trước đó trong dự án (`Bussinessrule_PackageSaas.md`, `PackageSaasTrial.md` đều không nhắc).có áp dụng
3. **`hasUsedTrial` theo User hay theo một định danh doanh nghiệp khác?** Tài liệu gốc tự nhận đây là hướng "cân bằng cho MVP", chưa xử lý được trường hợp một người tạo nhiều tài khoản email khác nhau. Chấp nhận rủi ro này ở MVP hay cần thêm lớp kiểm tra? -> trả lời. cứ dựa vào phần 'CÁCH XỬ LÝ TỐT NHẤT CHO MVP' ĐỒNG THỜI BÊN PHÍA SUPERADMIN CŨNG CÓ CÔNG CỤ THEO DÕI TRƯỜNG HỢP BẤT THƯỜNG
4. **Ngôn ngữ thị giác Owner Portal:** dùng chung hệ thống với `/admin` (đã có sẵn Card/Button/Modal/Toggle/Callout) để tiết kiệm công sức, hay xây bộ nhận diện "thân thiện hơn" riêng theo đúng tinh thần NT-1? Ảnh hưởng trực tiếp đến việc có tái dùng code hiện có hay không.XÂY DỰNG BỘ NHẬN DIỆN THÂN THIỆN HƠN.
Lưu ý trong phần đăng ký khi owner tạo tài khoản thì sẽ cho họ tạo tên thương hiệu, hiện tại đang local nhưng sau này tôi sẽ đăng ký tên miền riêng thì sẽ có dạng như kiot viet: Đăng nhập tài khoản fitflow: địachỉtruycậpcửahàng.FitFlow.vn
5. **Multi-Tenant-per-Owner:** tài liệu gốc không đề cập một User có thể sở hữu nhiều Tenant. Giả định hiện tại: 1 Owner ↔ 1 Tenant. Nếu sai, ảnh hưởng tới OW-02 (luồng tạo Tenant) và cần màn "chọn doanh nghiệp" trước khi vào Dashboard.
1 Owner ( 1 tài khoản đăng ký) chỉ đăng ký được 1 tenant và có thể có nhiều chi nhánh
