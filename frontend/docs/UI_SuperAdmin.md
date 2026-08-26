# FitFlow — THIẾT KẾ MÀN HÌNH & TÍNH NĂNG SUPER ADMIN (v1.0)

> Phạm vi: khu vực quản trị nền tảng (`/admin`), tách hoàn toàn khỏi ứng dụng của Tenant.
> Căn cứ: BR-SYSTEM-004, BR-SA-001/002, và schema đã dựng (`fitflow_schema.sql`).

---

# I. SÁU NGUYÊN TẮC THIẾT KẾ

## NT-1. Super Admin quản trị NỀN TẢNG, không vận hành phòng gym

Đây là ranh giới bạn đã vạch đúng ở BR-SYSTEM-004, nhưng nó phải được thể hiện thành **cấu trúc màn hình**, không chỉ là quy ước:

```text
CÓ                                    KHÔNG CÓ
─────────────────────────────         ─────────────────────────────
Danh sách Tenant                      Danh sách Member của Tenant
Số Member của Tenant (con số)         Hồ sơ chi tiết một Member
Số Check-in hôm nay (con số)          Bảng Check-in từng lượt
Doanh thu SaaS                        Doanh thu bán gói của Tenant
Cấu hình gói SaaS                     Cấu hình Check-in của Tenant
```

Nghĩa là: Super Admin thấy **số liệu tổng hợp** tự do, nhưng muốn xem **dữ liệu hàng** (row-level) của Tenant thì phải đi qua cổng "Truy cập hỗ trợ" (SA-18) — có lý do, có thời hạn, có audit, có thông báo cho Owner.

Ở bản phân tích trước, mục "Tenant Monitoring" liệt kê `Total Check-ins`, `Face Recognition Usage` — đó là **chỉ số tổng hợp**, hoàn toàn hợp lệ. Nhưng nếu màn hình đó cho click xuống từng lượt check-in thì đã vượt ranh giới. Thiết kế dưới đây tách rõ hai lớp.

## NT-2. "Super Admin" không nên là một role duy nhất

Trong thực tế vận hành SaaS, ba người khác nhau làm ba việc khác nhau, và gộp họ thành một role là rủi ro lớn nhất của khu vực này:

| Role nội bộ | Ai làm | Được gì | Không được gì |
|---|---|---|---|
| `PLATFORM_ADMIN` | Founder / CTO | Toàn quyền, kể cả quản lý tài khoản nội bộ | — |
| `PLATFORM_BILLING` | Kế toán | Gói, subscription, hóa đơn, đối soát | Suspend Tenant, truy cập dữ liệu Tenant |
| `PLATFORM_SUPPORT` | CSKH / kỹ thuật | Xem tenant, mở phiên hỗ trợ (chỉ đọc), xem log lỗi | Sửa gói, sửa subscription, đổi trạng thái Tenant |

Kế toán không cần quyền khóa doanh nghiệp của khách. Nhân viên hỗ trợ không cần quyền đổi giá gói. Tách ra không tốn thêm gì — bảng `roles`/`permissions` đã sẵn sàng — nhưng chặn được cả một lớp sự cố nội bộ.

> **Ghi chú kỹ thuật:** migration `004_reference_data.sql` hiện chỉ seed 4 permission cấp Platform và một role `SUPER_ADMIN`. Cần mở rộng theo mục VI của tài liệu này.

## NT-3. Không có nút Xóa ở bất kỳ đâu

BR-SA-001 nói không xóa Tenant. Nguyên tắc đó phải áp cho toàn khu vực: Plan, Subscription, Feature, tài khoản nội bộ — tất cả chỉ có `ACTIVE ↔ INACTIVE`. Trong giao diện, chỗ mà lập trình viên hay đặt nút "Xóa" thì đặt "Ngừng sử dụng".

## NT-4. Hành động nguy hiểm phải cho thấy hệ quả TRƯỚC khi làm

Suspend một Tenant có nghĩa là 40 nhân viên không đăng nhập được và 3.000 hội viên không check-in được sáng mai. Modal xác nhận kiểu "Bạn có chắc không?" là không đủ. Modal phải **liệt kê con số thật** lấy từ DB tại thời điểm bấm, và bắt gõ đúng tên Tenant để xác nhận.

## NT-5. Mọi hành động chạm vào Tenant đều bắt buộc có lý do

Không có ô "Lý do" nào là optional trong khu vực này. Lý do đi thẳng vào `audit_logs.reason`. Khi Owner khiếu nại sáu tháng sau, đó là thứ duy nhất trả lời được câu "ai làm, lúc nào, vì sao".

## NT-6. Giao diện dày đặc, không phải giao diện đẹp

Người dùng khu vực này là 3–10 người, dùng mỗi ngày, trên màn hình lớn. Ưu tiên: mật độ thông tin cao, bảng nhiều cột, phím tắt, filter lưu được. Không cần onboarding, không cần hoạt ảnh, không cần responsive xuống mobile (trừ SA-01 Dashboard để xem nhanh trên điện thoại).

---

# II. BẢN ĐỒ MÀN HÌNH

```text
/admin
│
├── SA-00  Đăng nhập Super Admin              [tách route, bắt buộc 2FA]
│
├── SA-01  Dashboard nền tảng                 ◄── màn mặc định
│
├── DOANH NGHIỆP
│   ├── SA-02  Danh sách Tenant
│   ├── SA-03  Chi tiết Tenant                [8 tab]
│   │           ├── Tổng quan
│   │           ├── Gói & Subscription
│   │           ├── Sử dụng & Hạn mức
│   │           ├── Người dùng
│   │           ├── Chi nhánh
│   │           ├── Thanh toán SaaS
│   │           ├── Nhật ký hoạt động
│   │           └── Phiên hỗ trợ
│   └── SA-04  Tạo Tenant thủ công
│
├── GÓI & THUÊ BAO
│   ├── SA-05  Danh sách gói SaaS
│   ├── SA-06  Trình soạn gói                 [ma trận feature]
│   ├── SA-07  Danh sách Subscription
│   └── SA-08  Đổi gói (wizard)               [nâng / hạ cấp]
│
├── THANH TOÁN SAAS
│   ├── SA-09  Danh sách hóa đơn
│   ├── SA-10  Chi tiết hóa đơn
│   └── SA-11  Đối soát giao dịch
│
├── NỀN TẢNG
│   ├── SA-12  Danh mục tính năng             [feature flag]
│   ├── SA-13  Sức khỏe hệ thống
│   ├── SA-14  Sử dụng tài nguyên theo Tenant
│   └── SA-15  Nhật ký lỗi
│
├── HỖ TRỢ
│   ├── SA-16  Hàng đợi yêu cầu hỗ trợ        [Phase 2]
│   └── SA-17  Phiên truy cập hỗ trợ          ◄── màn nhạy cảm nhất
│
└── QUẢN TRỊ NỘI BỘ
    ├── SA-18  Nhật ký kiểm toán toàn nền tảng
    ├── SA-19  Tài khoản nhân sự FitFlow
    └── SA-20  Cài đặt nền tảng
```

Điều hướng: sidebar cố định bên trái, 6 nhóm như trên. Thanh trên cùng có ô tìm kiếm toàn cục (`⌘K`) tìm được Tenant theo tên / mã / email liên hệ / mã hóa đơn.

---

# III. ĐẶC TẢ TỪNG MÀN HÌNH

---

## SA-00 — Đăng nhập Super Admin

**Mục đích:** cổng vào tách biệt, giảm bề mặt tấn công.

**Vì sao tách route riêng:** nếu dùng chung `/login` với Tenant, một lỗ hổng ở luồng đăng nhập của khách hàng sẽ phơi luôn tài khoản quản trị nền tảng. Trong schema, `users.tenant_id IS NULL` đã phân biệt Super Admin — nhưng phân biệt ở tầng dữ liệu không thay thế được phân tách ở tầng truy cập.

**Yêu cầu bắt buộc:**
- 2FA (TOTP) — không phải tùy chọn
- IP allowlist cấu hình được ở SA-20
- Session ngắn hơn Tenant: access token 15 phút, refresh 8 giờ (thay vì 30 ngày)
- Rate limit chặt hơn: 5 lần/giờ/IP
- Mọi lần đăng nhập, kể cả thất bại, ghi `audit_logs`

**Không có:** đăng ký, quên mật khẩu tự phục vụ. Tài khoản nội bộ do `PLATFORM_ADMIN` tạo ở SA-19, reset mật khẩu cũng qua đó.

---

## SA-01 — Dashboard nền tảng

**Mục đích:** trả lời trong 5 giây — nền tảng đang khỏe không, tiền vào bao nhiêu, có gì cần xử lý ngay không.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Nền tảng FitFlow                              [Tháng này ▾]  [⟳ 30 giây]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐            │
│  │ MRR          │ Doanh nghiệp │ Dùng thử     │ Tạm khóa     │            │
│  │ 47.500.000₫  │ 38 đang hoạt │ 12           │ 3            │            │
│  │ ▲ 12% so T7  │ động         │ 5 hết hạn <7d│ ⚠ cần xử lý  │            │
│  └──────────────┴──────────────┴──────────────┴──────────────┘            │
│                                                                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐            │
│  │ Chi nhánh    │ Người dùng   │ Hội viên     │ Check-in hôm │            │
│  │ 94           │ 512          │ 28.430       │ nay  6.109   │            │
│  └──────────────┴──────────────┴──────────────┴──────────────┘            │
│                                                                            │
│  ┌─────────────────────────────────┬──────────────────────────────────┐   │
│  │ DOANH THU 12 THÁNG              │ CẦN XỬ LÝ                    (7) │   │
│  │                                 ├──────────────────────────────────┤   │
│  │      ▁▂▃▃▄▅▅▆▇█                 │ ⚠ ABC Fitness — quá hạn 12 ngày  │   │
│  │  (cột chồng theo gói)           │   1.500.000₫  [Xem] [Nhắc nợ]    │   │
│  │  ■ Basic ■ Pro ■ Enterprise     │ ⚠ Gym Xanh — hết hạn sau 3 ngày  │   │
│  │                                 │ ⚠ Yoga House — vượt hạn mức khách │   │
│  └─────────────────────────────────┤   5.210 / 5.000  [Đề xuất nâng]  │   │
│                                    │ ⚠ 4 dùng thử hết hạn tuần này    │   │
│  ┌─────────────────────────────────┤                                  │   │
│  │ PHỄU CHUYỂN ĐỔI (90 ngày)       │            [Xem tất cả]          │   │
│  │ Dùng thử  24 ─────────────      └──────────────────────────────────┘   │
│  │ Trả phí   14 ──────── 58%                                              │
│  │ Rời bỏ     3 ──  12,5%          ┌──────────────────────────────────┐   │
│  └─────────────────────────────────┤ SỨC KHỎE HỆ THỐNG                │   │
│                                    │ ● API      142ms   ● Redis  OK    │   │
│  ┌─────────────────────────────────┤ ● Postgres 8/20    ● Job    OK    │   │
│  │ DOANH NGHIỆP MỚI (30 ngày)  +6  │ ⚠ 12 lỗi 5xx trong 1 giờ  [Xem]  │   │
│  └─────────────────────────────────┴──────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

**Nguồn dữ liệu:**

| Chỉ số | Truy vấn |
|---|---|
| MRR | `SUM(price)` trên `subscriptions` status `ACTIVE`, quy về tháng theo `billing_cycle` |
| Doanh nghiệp theo trạng thái | `COUNT(*) GROUP BY status` trên `tenants` |
| Chi nhánh / Người dùng / Hội viên | `COUNT` trên `branches`, `users`, `memberships (ACTIVE)` — **chạy bằng `adminPool`**, không qua RLS |
| Check-in hôm nay | `COUNT` trên `attendances` hôm nay, hoặc tốt hơn: `SUM` từ `daily_branch_stats` |
| Cần xử lý | `saas_invoices` quá hạn + `subscriptions` sắp hết hạn + so `subscription_features.quota_value` với mức dùng thật |

**Cảnh báo hiệu năng:** ba chỉ số cuối (`Hội viên`, `Check-in`) quét toàn bộ dữ liệu vận hành của mọi Tenant. Ở quy mô 50 Tenant × 3 năm dữ liệu, `COUNT(*)` trên `attendances` sẽ mất vài giây. **Phải đọc từ bảng tổng hợp `daily_branch_stats`**, không đếm trực tiếp. Đây chính là lý do bảng đó tồn tại trong schema.

**Tự động làm mới:** 30 giây, qua Socket.IO room `platform:dashboard` (chỉ Super Admin join được). Không polling REST.

---

## SA-02 — Danh sách Tenant

**Mục đích:** tìm và lọc doanh nghiệp; là điểm khởi đầu của mọi thao tác hỗ trợ.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Doanh nghiệp                                        [+ Tạo doanh nghiệp]  │
├────────────────────────────────────────────────────────────────────────────┤
│  🔍 Tên, mã, email…    Trạng thái ▾  Gói ▾  Ngày tạo ▾   [Lưu bộ lọc]      │
│  ● Đang hoạt động 38   ○ Dùng thử 12   ○ Tạm khóa 3   ○ Ngừng 5           │
├──────────────────┬────────┬──────┬──────┬───────┬───────────┬──────┬───────┤
│ DOANH NGHIỆP     │ TRẠNG  │ GÓI  │ CHI  │ HỘI   │ HẾT HẠN   │ CÔNG │       │
│                  │ THÁI   │      │ NHÁNH│ VIÊN  │           │ NỢ   │       │
├──────────────────┼────────┼──────┼──────┼───────┼───────────┼──────┼───────┤
│ ABC Fitness      │ ●Hoạt  │ Pro  │  5   │ 2.140 │ 12/09/26  │ 1,5tr│  ⋯    │
│ abc-fitness      │  động  │      │      │       │           │ ⚠12d │       │
│ California Gym   │ ●Hoạt  │ Ent. │ 12   │ 8.902 │ 01/01/27  │  —   │  ⋯    │
│ XYZ Yoga         │ ○Thử   │ Trial│  1   │    47 │ 24/08/26  │  —   │  ⋯    │
│                  │        │      │      │       │ ⚠ còn 4d  │      │       │
│ Fitness 123      │ ◐Khóa  │ Basic│  2   │   580 │ 03/08/26  │ 500k │  ⋯    │
├──────────────────┴────────┴──────┴──────┴───────┴───────────┴──────┴───────┤
│  Hiển thị 1–25 / 58                                     ◄ 1 2 3 ►          │
└────────────────────────────────────────────────────────────────────────────┘
```

**Cột được chọn có chủ đích:** đây là các con số người trực nền tảng cần để quyết định "gọi cho ai trước". Không có cột `created_at` mặc định vì nó ít khi là thứ quyết định hành động.

**Menu `⋯`:** Xem chi tiết · Đổi gói · Tạm khóa · Mở phiên hỗ trợ · Xem nhật ký

**Không có thao tác hàng loạt (bulk action).** Suspend 10 Tenant cùng lúc bằng một checkbox là kiểu tai nạn không thể hoàn tác. Mỗi lần một Tenant, mỗi lần một lý do.

**Trạng thái rỗng:** khi bộ lọc không ra kết quả — "Không có doanh nghiệp nào khớp bộ lọc. [Xóa bộ lọc]". Khi hệ thống chưa có Tenant nào — "Chưa có doanh nghiệp nào. Doanh nghiệp tự đăng ký sẽ xuất hiện ở đây, hoặc bạn có thể tạo thủ công."

---

## SA-03 — Chi tiết Tenant

Màn quan trọng nhất khu vực. Header cố định khi cuộn, 8 tab bên dưới.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Doanh nghiệp                                                             │
│                                                                            │
│ ABC Fitness                       ● Đang hoạt động    Gói Pro              │
│ abc-fitness · MST 0312345678                                               │
│ Chủ: Trần Văn A · a@abc.vn · 0901234567 · Tạo 12/03/2026                   │
│                                                                            │
│              [Đổi gói]  [Mở phiên hỗ trợ]  [Tạm khóa ▾]                   │
├────────────────────────────────────────────────────────────────────────────┤
│ Tổng quan │ Gói & Thuê bao │ Hạn mức │ Người dùng │ Chi nhánh │ Thanh toán │
│           │ Nhật ký │ Phiên hỗ trợ                                         │
└────────────────────────────────────────────────────────────────────────────┘
```

### Tab 1 — Tổng quan

```text
┌───────────────────────────────┬────────────────────────────────────────┐
│ QUY MÔ                        │ MỨC ĐỘ SỬ DỤNG (30 ngày)               │
│ Chi nhánh          5          │      ▂▄▅▇▆▅▇█▆▅▄▅▆▇                    │
│ Nhân sự           28          │  Check-in/ngày · TB 412                │
│ Huấn luyện viên   11          │                                        │
│ Hội viên đang HĐ  2.140       │ Đăng nhập gần nhất: 2 giờ trước        │
│ Hội viên hết hạn    380       │ Người dùng hoạt động 7 ngày: 24/28     │
├───────────────────────────────┼────────────────────────────────────────┤
│ THUÊ BAO                      │ CẢNH BÁO                               │
│ Gói Pro · 1.500.000₫/tháng    │ ⚠ Hóa đơn HD-2608 quá hạn 12 ngày      │
│ Hiệu lực đến 12/09/2026       │ ⚠ Đã dùng 5/5 chi nhánh — chạm trần    │
│ Tự động gia hạn: Bật          │                                        │
└───────────────────────────────┴────────────────────────────────────────┘
```

Lưu ý: mọi con số ở đây là **tổng hợp**. Không có bảng nào cho click xuống hồ sơ hội viên cụ thể. Muốn xem chi tiết → mở phiên hỗ trợ.

### Tab 2 — Gói & Thuê bao

Timeline vòng đời + lịch sử đổi gói:

```text
  12/03/2026  ●  Bắt đầu dùng thử (14 ngày)
  26/03/2026  ●  Chuyển sang gói Basic          bởi hệ thống
  01/06/2026  ●  Nâng lên gói Pro               bởi Nguyễn B · "KH mở thêm 3 CN"
  12/09/2026  ○  Hết hạn kỳ hiện tại
```

Bên dưới: bảng **feature đang có hiệu lực**, và đây là chỗ dễ gây hiểu nhầm nhất nên phải hiển thị đủ ba lớp:

```text
TÍNH NĂNG              GÓI PRO    SNAPSHOT KHI KÝ    ĐIỀU CHỈNH RIÊNG    HIỆU LỰC
Nhận diện khuôn mặt    ✓          ✓                  —                   ✓
Báo cáo nâng cao       ✓          ✗                  —                   ✗  ⓘ
Số chi nhánh tối đa    5          5                  10 (đến 31/12)      10
```

Biểu tượng ⓘ ở dòng "Báo cáo nâng cao" mở tooltip: *"Gói Pro hiện đã bao gồm tính năng này, nhưng Tenant ký hợp đồng trước khi tính năng được thêm vào gói. Snapshot giữ nguyên điều kiện lúc ký. [Cập nhật snapshot theo gói hiện tại]"*

Đây là hệ quả trực tiếp của thiết kế `subscription_features` (snapshot). Nếu giao diện không giải thích, đội hỗ trợ sẽ không hiểu vì sao khách trả tiền gói Pro mà không thấy tính năng.

### Tab 3 — Hạn mức

```text
Chi nhánh        ████████████████████  5 / 5     ⚠ Đã chạm trần
Nhân sự          ███████████░░░░░░░░░ 28 / 50
Huấn luyện viên  ███████░░░░░░░░░░░░░ 11 / 30
Hội viên         ████████░░░░░░░░░░░░ 2.140 / 5.000
Lưu trữ          ██░░░░░░░░░░░░░░░░░░ 1,2 / 10 GB
Nhận diện/tháng  █████░░░░░░░░░░░░░░░ 12.400 lượt gọi
```

**Quy tắc:** chạm trần → hiển thị cảnh báo và đề xuất nâng gói; **không tự động chặn ở màn này**. Việc chặn xảy ra ở phía Tenant khi họ bấm "Tạo chi nhánh" — nơi người dùng hiểu được ngữ cảnh.

### Tab 4 — Người dùng

Danh sách tài khoản nhân sự của Tenant: họ tên, email, vai trò, chi nhánh, trạng thái, đăng nhập gần nhất.

**Được:** xem danh sách, xem ai là Owner, reset mật khẩu Owner khi họ mất quyền truy cập (có audit + gửi mail thông báo).
**Không được:** tạo, sửa vai trò, gán chi nhánh. Đó là việc của Owner (BR-SYSTEM-004). Nếu Super Admin tạo Staff hộ Tenant thì ranh giới trách nhiệm sụp đổ.

Trường hợp ngoại lệ duy nhất: **Owner rời công ty / mất tài khoản**. Cần luồng riêng "Chuyển quyền Owner" — yêu cầu văn bản xác nhận từ doanh nghiệp, hai người nội bộ duyệt, ghi audit đầy đủ. Đây là Phase 2 nhưng cần thiết kế trước vì thực tế chắc chắn xảy ra.

### Tab 5 — Chi nhánh
Danh sách chỉ đọc: tên, mã, địa chỉ, trạng thái, số hội viên, số check-in 30 ngày. Không có hành động.

### Tab 6 — Thanh toán SaaS
Hóa đơn của riêng Tenant này. Không lẫn với `payments` (tiền khách đóng cho phòng gym) — hai bảng khác nhau trong schema và **không được xuất hiện cùng một màn hình**, kể cả để "tiện so sánh".

### Tab 7 — Nhật ký hoạt động
Lọc `audit_logs` theo `tenant_id`, chỉ hiển thị hành động cấp Tenant: đổi trạng thái, đổi gói, phiên hỗ trợ, reset mật khẩu. Không hiển thị nhật ký vận hành hằng ngày (undo check-in, hủy payment) — đó là việc nội bộ của Tenant.

### Tab 8 — Phiên hỗ trợ
Lịch sử các lần Super Admin truy cập dữ liệu Tenant. Xem SA-17.

---

### Hành động: Tạm khóa Tenant

```text
┌──────────────────────────────────────────────────────────────┐
│  Tạm khóa ABC Fitness                                        │
├──────────────────────────────────────────────────────────────┤
│  Khi tạm khóa, ngay lập tức:                                 │
│                                                              │
│    • 28 nhân sự không đăng nhập được                         │
│    • 2.140 hội viên không check-in được                      │
│    • 5 chi nhánh ngừng hoạt động                             │
│    • 14 khách đang trong phòng tập vẫn tự động check-out     │
│                                                              │
│  Dữ liệu được giữ nguyên. Mở lại bất cứ lúc nào.             │
│                                                              │
│  Lý do (bắt buộc, Owner sẽ thấy nội dung này)                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Quá hạn thanh toán hóa đơn HD-2608 12 ngày             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Gõ  ABC Fitness  để xác nhận                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ☑ Gửi email thông báo cho Owner                             │
│                                                              │
│                              [Hủy]  [Tạm khóa doanh nghiệp]  │
└──────────────────────────────────────────────────────────────┘
```

Các con số trong modal **truy vấn tại thời điểm mở modal**, không lấy từ cache. Người bấm phải thấy đúng hậu quả thật.

**Điểm cần chốt nghiệp vụ — mục 3 trong danh sách cuối tài liệu:** khách đang IN_GYM tại thời điểm khóa thì xử lý ra sao? Đề xuất: cho auto check-out bình thường, không cắt giữa chừng. Khóa tài khoản không nên khiến khách bị kẹt trong bản ghi mở vĩnh viễn.

---

## SA-04 — Tạo Tenant thủ công

Dùng cho onboarding qua đội kinh doanh (khách ký hợp đồng trước, không tự đăng ký).

Wizard 3 bước:

1. **Doanh nghiệp** — tên, mã (tự sinh từ tên, sửa được), MST, địa chỉ, múi giờ
2. **Chủ tài khoản** — họ tên, email, SĐT. Hệ thống gửi email đặt mật khẩu, **không** cho Super Admin tự đặt mật khẩu hộ
3. **Gói** — chọn gói, ngày bắt đầu, chu kỳ, có tính phí kỳ đầu không

Kết thúc: tạo `tenants` + `users` (Owner) + `user_roles` + `subscriptions` + `subscription_features` + `tenant_settings` mặc định + chi nhánh đầu tiên — **cùng một transaction**, giống hệt luồng tự đăng ký ở `auth.service.js`. Dùng chung một hàm để hai đường không lệch nhau.

---

## SA-05 / SA-06 — Quản lý gói SaaS

### SA-05 Danh sách gói

```text
GÓI          GIÁ/THÁNG    ĐANG DÙNG   TÍNH NĂNG           TRẠNG THÁI
Dùng thử     Miễn phí     12          4/10                Hoạt động
Basic          500.000    18          5/10                Hoạt động
Pro          1.500.000    16          9/10                Hoạt động
Enterprise   Thỏa thuận    4          10/10               Hoạt động
Starter        300.000     0          4/10                Ngừng bán
```

Cột "Đang dùng" là quan trọng nhất: nó cho biết sửa gói này ảnh hưởng bao nhiêu khách hàng.

### SA-06 Trình soạn gói

```text
┌────────────────────────────────────────────────────────────────────┐
│  Gói Pro                                    16 doanh nghiệp đang dùng│
├────────────────────────────────────────────────────────────────────┤
│  Tên hiển thị   [Pro                    ]                          │
│  Mã             [PRO                    ]  (không sửa được)        │
│  Giá            [1.500.000] ₫ / [Tháng ▾]                          │
│  Ngày dùng thử  [0    ]                                            │
├────────────────────────────────────────────────────────────────────┤
│  TÍNH NĂNG                                                         │
│  ☑ Nhận diện khuôn mặt      ☑ Check-in QR                          │
│  ☑ Quản lý PT                ☑ Báo cáo nâng cao                     │
│  ☑ Nhiều chi nhánh           ☑ Thông báo tự động                    │
│                                                                    │
│  HẠN MỨC   (để trống = không giới hạn)                             │
│  Chi nhánh [5    ]   Nhân sự [50   ]                               │
│  PT        [30   ]   Hội viên [5000 ]                              │
├────────────────────────────────────────────────────────────────────┤
│  ⓘ Thay đổi ở đây CHỈ áp dụng cho thuê bao ký mới.                 │
│    16 doanh nghiệp hiện tại giữ nguyên điều kiện lúc ký.           │
│    [Xem danh sách]   [Áp dụng cho doanh nghiệp hiện tại…]          │
│                                                                    │
│                                     [Hủy]  [Lưu thay đổi]          │
└────────────────────────────────────────────────────────────────────┘
```

**Đây là màn dễ gây sai lệch kỳ vọng nhất trong toàn hệ thống.** Người dùng nghĩ "sửa gói Pro = mọi khách Pro được hưởng ngay". Thực tế schema dùng snapshot nên **không phải vậy**. Hai lựa chọn thiết kế:

| Cách | Ưu | Nhược |
|---|---|---|
| A. Bỏ snapshot, tính feature trực tiếp từ Plan | Trực giác đúng | Sửa gói làm gián đoạn khách đang chạy; không bán được deal riêng |
| B. **Giữ snapshot + nút "Áp dụng cho hiện tại"** | An toàn, linh hoạt | Phải giải thích trong UI |

Chọn **B**, và trả giá bằng ô ⓘ ở trên. Nút "Áp dụng cho doanh nghiệp hiện tại" mở modal chọn từng Tenant (mặc định không chọn ai), xem trước thay đổi, rồi mới cập nhật `subscription_features` — có audit.

**Không cho sửa `code`** sau khi tạo: mã gói bị tham chiếu ở `subscription_features` và logic phân quyền.

---

## SA-07 — Danh sách Subscription

Bảng gộp `subscriptions` + `tenants` + `saas_plans`, sắp xếp mặc định theo `end_date` tăng dần — vì việc cần làm luôn là "cái nào sắp hết hạn".

Bộ lọc nhanh cố định: `Hết hạn trong 7 ngày` · `Quá hạn` · `Dùng thử sắp kết thúc` · `Tự động gia hạn: Tắt`.

Cột: Doanh nghiệp · Gói · Trạng thái · Bắt đầu · Hết hạn · Còn lại · Tự gia hạn · Giá trị.

---

## SA-08 — Đổi gói (wizard)

Wizard 3 bước, và bước 2 là lý do màn này không thể là một dropdown đơn giản.

**Bước 1 — Chọn gói mới.** Hiển thị cạnh nhau gói hiện tại và gói mới, đánh dấu rõ cái gì thêm, cái gì mất.

**Bước 2 — Kiểm tra xung đột hạn mức.** Đây là bước bắt buộc khi hạ cấp:

```text
┌────────────────────────────────────────────────────────────────┐
│  ⚠ Hạ cấp Pro → Basic sẽ vượt hạn mức                          │
├────────────────────────────────────────────────────────────────┤
│  Hạng mục          Hiện tại    Gói Basic     Tình trạng        │
│  Chi nhánh              5           1        Vượt 4            │
│  Nhân sự               28          10        Vượt 18           │
│  Hội viên           2.140         500        Vượt 1.640        │
│  Nhận diện KM      Đang bật     Không có     Sẽ tắt            │
│                                                                │
│  Không thể hạ cấp khi dữ liệu đang vượt hạn mức gói mới.       │
│  Doanh nghiệp cần giảm quy mô trước, hoặc chọn gói khác.       │
│                                                                │
│                          [Chọn gói khác]  [Gửi thông báo cho KH]│
└────────────────────────────────────────────────────────────────┘
```

**Chặn cứng, không cho ghi đè.** Cho phép hạ cấp khi đang vượt hạn mức sẽ đẩy hệ thống vào trạng thái không nhất quán: Tenant có 5 chi nhánh nhưng gói chỉ cho 1 — lúc đó chi nhánh nào bị tắt? Không có câu trả lời đúng, nên không để tình huống đó xảy ra.

Nâng cấp thì không có bước này (gói mới luôn rộng hơn).

**Bước 3 — Thời điểm & tiền.** Áp dụng ngay hay cuối kỳ; có tính bù trừ (proration) không; xem trước hóa đơn sinh ra.

---

## SA-09 / SA-10 / SA-11 — Thanh toán SaaS

Ba màn này phục vụ `PLATFORM_BILLING`.

**SA-09 Danh sách hóa đơn:** lọc theo trạng thái (`DRAFT/ISSUED/PAID/OVERDUE/VOID`), kỳ, doanh nghiệp. Tổng ở đầu bảng: đã thu / chờ thu / quá hạn.

**SA-10 Chi tiết hóa đơn:** thông tin kỳ, số tiền, hạn thanh toán, lịch sử nhắc nợ, và nút **Ghi nhận thanh toán thủ công** — bắt buộc có ở thị trường Việt Nam vì phần lớn doanh nghiệp chuyển khoản ngân hàng chứ không quẹt thẻ. Form: số tiền, ngày nhận, mã giao dịch, ảnh chứng từ, ghi chú.

**SA-11 Đối soát:** danh sách bản ghi trong `payment_transactions` có `status = 'UNMATCHED'` — tiền vào tài khoản nhưng chưa gán được hóa đơn. Cho phép gán thủ công. Không có màn này thì kế toán sẽ đối soát bằng Excel, và dữ liệu trong hệ thống sẽ dần sai.

**Quy trình nhắc nợ tự động** (cấu hình ở SA-20):

```text
Đến hạn         → Email hóa đơn
+3 ngày         → Email nhắc lần 1
+7 ngày         → Email nhắc lần 2 + banner cảnh báo trong app của Tenant
+14 ngày        → subscription → PAST_DUE, giới hạn tính năng nâng cao
+21 ngày        → Đưa vào hàng chờ khóa, cần người duyệt  ◄── KHÔNG tự động khóa
```

Bước cuối **cố ý không tự động**. Khóa một phòng gym vì hệ thống kế toán lỗi là sự cố nghiêm trọng hơn nhiều so với việc chờ thêm một ngày để người duyệt.

---

## SA-12 — Danh mục tính năng

Quản lý bảng `platform_features` và bật/tắt theo diện rộng.

Hai loại khác nhau, không nên gộp:
- **Feature bán được** (`FACE_RECOGNITION`, `MAX_BRANCHES`) — gắn vào gói, khách trả tiền để có
- **Feature flag kỹ thuật** (`NEW_CHECKIN_UI`) — triển khai dần, bật cho 5 Tenant trước rồi mở rộng

Màn này quản cả hai nhưng tách thành hai tab, vì người dùng và mục đích khác nhau hoàn toàn.

---

## SA-13 — Sức khỏe hệ thống

Không thay thế Grafana/Sentry. Chỉ hiển thị những gì gắn với nghiệp vụ:

- API: p50/p95/p99, tỉ lệ lỗi 5xx
- Postgres: connection đang dùng / tối đa (cả `adminPool` và `pool`), truy vấn chậm nhất
- Redis: bộ nhớ, số key OTP đang sống, tỉ lệ trúng cache
- Socket.IO: số kết nối theo Tenant
- Job auto check-out: lần chạy gần nhất, số lượt đóng, có bị kẹt lock không
- Email: OTP gửi thành công / thất bại 24 giờ — **chỉ số này quan trọng bất thường**, vì OTP hỏng nghĩa là không ai đăng ký được, mà lỗi lại im lặng

---

## SA-14 — Sử dụng tài nguyên theo Tenant

Bảng xếp hạng để phát hiện hai nhóm: khách sắp cần nâng gói (cơ hội bán) và khách gây tải bất thường (rủi ro hạ tầng).

Cột: Doanh nghiệp · Check-in/tháng · Lượt nhận diện · Dung lượng · Request API · Tỉ lệ dùng so hạn mức.

---

## SA-15 — Nhật ký lỗi

Lỗi ứng dụng có gắn `tenant_id`, gom nhóm theo dấu vân tay (fingerprint) chứ không liệt kê từng dòng. Mỗi nhóm: thông điệp, số lần, Tenant bị ảnh hưởng, lần cuối, stack trace.

**Bắt buộc che dữ liệu nhạy cảm:** stack trace có thể chứa SĐT, email khách hàng của Tenant. Phải lọc trước khi hiển thị.

---

## SA-17 — Phiên truy cập hỗ trợ ⚠

**Màn nhạy cảm nhất toàn hệ thống.** Đây là nơi Super Admin được phép nhìn vào dữ liệu vận hành của một Tenant cụ thể — và cũng là nơi rủi ro pháp lý cao nhất (Nghị định 13/2023/NĐ-CP: dữ liệu khách hàng của Tenant là dữ liệu cá nhân, FitFlow là bên xử lý).

### Luồng mở phiên

```text
┌──────────────────────────────────────────────────────────────┐
│  Mở phiên hỗ trợ — ABC Fitness                               │
├──────────────────────────────────────────────────────────────┤
│  Mức truy cập                                                │
│  ● Chỉ đọc      Xem được dữ liệu, không thay đổi được gì     │
│  ○ Có thao tác  Cần Owner chấp thuận trước                   │
│                                                              │
│  Phạm vi   ☑ Cấu hình   ☑ Hội viên   ☐ Thanh toán   ☐ Chấm công│
│                                                              │
│  Thời hạn  ● 30 phút   ○ 2 giờ   ○ 8 giờ                     │
│                                                              │
│  Lý do (bắt buộc — Owner sẽ đọc được)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Ticket #482: Owner báo hội viên VIP không check-in     │  │
│  │ được tại chi nhánh Q7                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ⓘ Owner nhận email ngay khi phiên bắt đầu.                  │
│    Mọi truy vấn trong phiên được ghi lại.                    │
│                                                              │
│                              [Hủy]  [Bắt đầu phiên]          │
└──────────────────────────────────────────────────────────────┘
```

### Trong phiên

Thanh cảnh báo màu nổi bật, cố định trên cùng, không tắt được:

```text
▌ PHIÊN HỖ TRỢ · ABC Fitness · Chỉ đọc · Còn 24:13 · Ticket #482   [Kết thúc]
```

### Ràng buộc kỹ thuật

- Phiên phát một access token riêng có `support_session_id`, hết hạn đúng bằng thời hạn phiên
- Token này **không** bypass RLS: nó set `app.current_tenant_id` đúng như một user của Tenant. Cơ chế cách ly không bị nới lỏng, chỉ có ngữ cảnh được cấp
- Chế độ Chỉ đọc: connection dùng role Postgres riêng chỉ có `SELECT`. Chặn ở tầng DB, không phải tầng ứng dụng
- Mỗi truy vấn ghi vào `audit_logs` với `support_session_id`
- Owner thấy được toàn bộ lịch sử phiên trong app của mình — minh bạch hai chiều

### Business Rule cần bổ sung

```text
BR-SA-003  Super Admin chỉ truy cập dữ liệu vận hành của Tenant
           thông qua phiên hỗ trợ có thời hạn, có lý do, có ghi nhận.

BR-SA-004  Phiên hỗ trợ mặc định là chỉ đọc.
           Phiên có quyền thao tác cần Owner chấp thuận trước.

BR-SA-005  Owner luôn xem được toàn bộ lịch sử phiên hỗ trợ
           trên Tenant của mình.
```

Ba rule này lấp đúng khoảng trống của BR-SYSTEM-004 — rule cũ nói Super Admin "không trực tiếp thay Owner vận hành **trừ trường hợp Support**", nhưng không định nghĩa cơ chế của ngoại lệ đó. Ngoại lệ không có cơ chế thì trên thực tế là không có giới hạn.

---

## SA-18 — Nhật ký kiểm toán toàn nền tảng

Đọc `audit_logs` không lọc `tenant_id`. Lọc theo: người thực hiện, doanh nghiệp, loại đối tượng, hành động, khoảng thời gian.

Mỗi dòng mở rộng được để xem `before_data` / `after_data` dạng diff.

**Chỉ đọc. Không sửa, không xóa, kể cả `PLATFORM_ADMIN`.** Bảng đã partition theo tháng nên truy vấn theo khoảng thời gian nhanh; truy vấn không có khoảng thời gian phải bị chặn ở tầng API.

---

## SA-19 — Tài khoản nhân sự FitFlow

Quản lý người dùng có `tenant_id IS NULL`. Tạo, gán role nội bộ (mục II), vô hiệu hóa, buộc bật 2FA, xem phiên đang mở và thu hồi.

**Chỉ `PLATFORM_ADMIN` vào được.** Và cần một rule: **không ai tự vô hiệu hóa hoặc tự hạ quyền chính mình** — tránh khóa toàn bộ đội ngũ khỏi hệ thống.

---

## SA-20 — Cài đặt nền tảng

| Nhóm | Nội dung |
|---|---|
| Thương hiệu | Tên, logo, email gửi đi, domain |
| Email | Mẫu email hệ thống (OTP, chào mừng, nhắc nợ, thông báo khóa) |
| Thu nợ | Lịch nhắc, ngưỡng chuyển `PAST_DUE`, ngưỡng đưa vào hàng chờ khóa |
| Bảo mật | IP allowlist khu vực admin, thời hạn session, chính sách mật khẩu |
| Mặc định Tenant | `tenant_settings` mặc định khi tạo doanh nghiệp mới |
| Thông báo nội bộ | Webhook Slack/Telegram cho cảnh báo nền tảng |

---

# IV. NĂM LUỒNG XUYÊN MÀN

### L1 — Doanh nghiệp tự đăng ký
```
Tenant đăng ký + xác thực OTP  →  SA-01 hiện cảnh báo "doanh nghiệp mới"
→  SA-03 xem thông tin  →  theo dõi trong 14 ngày dùng thử
→  hết hạn: SA-08 chuyển sang gói trả phí, hoặc SA-03 chuyển INACTIVE
```

### L2 — Quá hạn thanh toán
```
SA-09 hóa đơn OVERDUE  →  nhắc nợ tự động (3/7/14 ngày)
→  +14d subscription PAST_DUE, giới hạn tính năng
→  +21d vào hàng chờ khóa  →  người duyệt xem xét
→  SA-03 tạm khóa (nếu quyết định khóa)  →  Owner thanh toán  →  mở lại
```

### L3 — Xử lý yêu cầu hỗ trợ
```
SA-16 ticket  →  SA-03 xem chỉ số tổng hợp  →  chưa đủ thông tin
→  SA-17 mở phiên chỉ đọc 30 phút, ghi lý do  →  Owner nhận email
→  điều tra  →  kết thúc phiên  →  ghi kết luận vào ticket
```

### L4 — Khách yêu cầu nâng gói
```
SA-14 phát hiện chạm trần, hoặc Owner yêu cầu
→  SA-08 wizard: đối chiếu hạn mức  →  chọn thời điểm & bù trừ
→  sinh hóa đơn  →  SA-10 ghi nhận thanh toán  →  subscription_features cập nhật
```

### L5 — Ra mắt tính năng mới
```
SA-12 tạo feature flag, tắt toàn bộ
→  bật cho 3 Tenant thử nghiệm  →  SA-15 theo dõi lỗi
→  mở rộng dần  →  SA-06 đưa vào gói  →  SA-06 "Áp dụng cho hiện tại"
```

---

# V. MA TRẬN QUYỀN NỘI BỘ

| Màn hình | PLATFORM_ADMIN | PLATFORM_BILLING | PLATFORM_SUPPORT |
|---|---|---|---|
| SA-01 Dashboard | ✓ | ✓ | ✓ |
| SA-02 Danh sách Tenant | ✓ | ✓ | ✓ |
| SA-03 Chi tiết Tenant | ✓ | Chỉ tab thanh toán | ✓ (trừ thanh toán) |
| SA-03 Tạm khóa / Mở khóa | ✓ | ✗ | ✗ |
| SA-03 Reset mật khẩu Owner | ✓ | ✗ | ✓ có duyệt |
| SA-04 Tạo Tenant | ✓ | ✓ | ✗ |
| SA-05/06 Gói SaaS | ✓ | ✓ | Chỉ xem |
| SA-07/08 Subscription | ✓ | ✓ | Chỉ xem |
| SA-09/10/11 Hóa đơn | ✓ | ✓ | Chỉ xem |
| SA-12 Feature flag | ✓ | ✗ | ✗ |
| SA-13/14/15 Giám sát | ✓ | ✗ | ✓ |
| SA-17 Phiên chỉ đọc | ✓ | ✗ | ✓ |
| SA-17 Phiên có thao tác | ✓ | ✗ | ✗ |
| SA-18 Nhật ký kiểm toán | ✓ | Phạm vi thanh toán | Phạm vi của mình |
| SA-19 Tài khoản nội bộ | ✓ | ✗ | ✗ |
| SA-20 Cài đặt nền tảng | ✓ | Chỉ mục Thu nợ | ✗ |

Permission code cần bổ sung vào `004_reference_data.sql`:

```text
platform.tenant.read          platform.tenant.create
platform.tenant.suspend       platform.tenant.reset_owner
platform.plan.read            platform.plan.manage
platform.subscription.read    platform.subscription.manage
platform.invoice.read         platform.invoice.manage
platform.invoice.reconcile
platform.feature.manage
platform.monitoring.read      platform.error.read
platform.support.readonly     platform.support.write
platform.audit.read
platform.user.manage          platform.setting.manage
```

---

# VI. ƯU TIÊN TRIỂN KHAI

**MVP** — đủ để vận hành nền tảng thật:
`SA-00` · `SA-01` (rút gọn: KPI + cảnh báo, chưa cần biểu đồ) · `SA-02` · `SA-03` (tab 1,2,3,6) · `SA-05` · `SA-07` · `SA-18`

**Giai đoạn 2** — khi có khách trả phí:
`SA-04` · `SA-06` · `SA-08` · `SA-09/10/11` · `SA-19` · `SA-20`

**Giai đoạn 3** — khi có đội hỗ trợ:
`SA-12` · `SA-13/14/15` · `SA-16` · `SA-17`

Lưu ý: `SA-17` xếp giai đoạn 3 vì tốn công, nhưng **BR-SA-003/004/005 phải chốt từ MVP**. Trước khi có SA-17, quy tắc tạm là: Super Admin truy cập dữ liệu Tenant bằng truy vấn SQL trực tiếp, và mỗi lần như vậy phải ghi tay vào sổ nội bộ. Không đẹp, nhưng có kỷ luật còn hơn không có ranh giới nào.

---

# VII. TÁM ĐIỂM CẦN CHỐT

1. **Tách role nội bộ hay giữ một `SUPER_ADMIN` duy nhất?** Ảnh hưởng migration `004` và thiết kế SA-19. Đề xuất: tách ngay, chi phí gần bằng không.

2. **Khóa Tenant thì Owner còn đăng nhập được không?** Đề xuất: có, nhưng chỉ vào được màn thanh toán — để họ trả tiền và tự mở khóa. Khóa hoàn toàn thì họ không có đường tự xử lý.

3. **Khách đang IN_GYM khi Tenant bị khóa?** Đề xuất: để auto check-out chạy bình thường.

4. **Tự động khóa khi quá hạn, hay luôn cần người duyệt?** Đề xuất: luôn cần người duyệt. Rủi ro sai sót kế toán lớn hơn rủi ro chậm thu tiền.

5. **Có tính bù trừ (proration) khi đổi gói giữa kỳ không?** Ảnh hưởng SA-08 bước 3 và cấu trúc `saas_invoices`. Bỏ qua ở MVP thì đơn giản hơn nhiều.

6. **Super Admin được reset mật khẩu Owner không?** Đề xuất: được, nhưng chỉ gửi link đặt lại về email đã đăng ký, không tự đặt mật khẩu.

7. **Luồng chuyển quyền Owner khi chủ cũ rời công ty?** Chắc chắn sẽ xảy ra. Cần chốt yêu cầu chứng từ và số người duyệt.

8. **Dashboard đọc từ `daily_branch_stats` hay đếm trực tiếp?** Đề xuất: bảng tổng hợp, và cần viết job tính toán — hiện job này chưa có trong codebase.