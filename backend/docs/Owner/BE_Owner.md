Dựa trên toàn bộ mô hình nghiệp vụ FitFlow mà chúng ta đã thống nhất, tôi sẽ phân tích giao diện **Owner** theo góc nhìn **BA + UX/Product Designer**.

Tôi sẽ không thiết kế Owner Dashboard như một trang quản trị thông thường với hàng loạt menu. Owner của phòng tập thường quan tâm 4 câu hỏi:

> **Hôm nay phòng tập của tôi hoạt động thế nào?**
> **Có bao nhiêu khách đang tập?**
> **Doanh thu ra sao?**
> **Có vấn đề gì cần tôi xử lý không?**

Vì vậy, hành trình Owner cần được thiết kế xuyên suốt từ **khách hàng tiềm năng → đăng ký SaaS → thiết lập doanh nghiệp → vận hành phòng tập → quản lý thuê bao**.

---

# I. Tổng thể hành trình giao diện Owner

Tôi đề xuất User Journey như sau:

```text
PUBLIC WEBSITE
      │
      ▼
CHỌN GÓI SaaS
      │
      ▼
ĐĂNG KÝ TÀI KHOẢN OWNER
      │
      ▼
XÁC MINH TÀI KHOẢN
      │
      ▼
TẠO DOANH NGHIỆP / TENANT
      │
      ▼
THANH TOÁN GÓI SaaS
      │
      ▼
ONBOARDING SETUP
      │
      ▼
OWNER DASHBOARD
      │
      ├── Quản lý Branch
      ├── Quản lý Staff
      ├── Quản lý Member
      ├── Membership
      ├── PT
      ├── Check-in
      ├── Payment
      ├── Reports
      └── Subscription
```

Điểm quan trọng: **không nên bắt Owner đăng nhập xong là thấy một Dashboard trống hoàn toàn**. Hệ thống cần dẫn dắt Owner thiết lập phòng tập theo từng bước.

---

# II. Giai đoạn 1 — Trang đăng ký Owner

## Mục tiêu nghiệp vụ

Biến một người quan tâm đến FitFlow thành:

```text
Lead
→ Account
→ Tenant Owner
→ Subscriber
→ Active Customer
```

## Giao diện Register

Tôi đề xuất thiết kế tối giản:

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

### Business Rule đề xuất

Ở thời điểm này chỉ tạo:

```text
USER
Role = OWNER_PENDING
```

Tôi **không nên tạo Tenant ngay khi người dùng chỉ mới điền form đăng ký**, bởi vì họ có thể bỏ dở giữa chừng.

---

# III. Giai đoạn 2 — Xác thực tài khoản

Sau đăng ký:

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

Sau xác thực thành công:

```text
USER STATUS = ACTIVE
```

Sau đó chuyển sang bước:

> **Tạo doanh nghiệp của bạn**

---

# IV. Giai đoạn 3 — Tạo Business/Tenant

Đây là bước rất quan trọng vì nó xác định Tenant.

```text
┌─────────────────────────────────────────────┐
│ Bước 1/4 — Thông tin doanh nghiệp           │
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
│                  [Tiếp tục →]               │
└─────────────────────────────────────────────┘
```

Backend:

```text
Tenant
Status = PENDING_SETUP
Owner = User hiện tại
```

---

# V. Giai đoạn 4 — Chọn gói SaaS

Owner nhìn thấy các gói:

```text
┌────────────┐  ┌──────────────┐  ┌─────────────┐
│   START    │  │   GROWTH ⭐   │  │    SCALE    │
│            │  │              │  │             │
│ 1 Branch   │  │ 5 Branch     │  │ Unlimited   │
│            │  │              │  │             │
│  xxx/tháng │  │ xxx/tháng    │  │ Liên hệ     │
│            │  │              │  │             │
│ [Chọn]     │  │ [Chọn gói]   │  │ [Liên hệ]   │
└────────────┘  └──────────────┘  └─────────────┘
```

Nên có:

```text
Monthly | Yearly
```

Owner chọn gói xong:

```text
Tenant
        +
Selected Plan
        ↓
Create Pending Subscription
```

---

# VI. Giai đoạn 5 — Thanh toán SaaS

```text
┌──────────────────────────────────────┐
│ Thanh toán                            │
├──────────────────────────────────────┤
│ Gói: FITFLOW GROWTH                  │
│ Chu kỳ: Hàng tháng                   │
│                                       │
│ Giá: xxx VND                         │
│ VAT: ...                             │
│ Tổng cộng: xxx                       │
│                                       │
│        [ THANH TOÁN ]                 │
└──────────────────────────────────────┘
```

Sau thanh toán thành công:

```text
Payment = SUCCESS
        ↓
Subscription = ACTIVE
        ↓
Tenant = ACTIVE
        ↓
Start Onboarding
```

---

# VII. Giai đoạn 6 — Owner Onboarding

Đây là phần tôi **rất khuyên bạn xây dựng**.

Thay vì vào Dashboard:

```text
Branches = 0
Staff = 0
Members = 0
```

Owner sẽ được dẫn dắt:

```text
WELCOME TO FITFLOW

Hoàn thành thiết lập để bắt đầu quản lý
phòng tập của bạn.

✓ Tạo doanh nghiệp
◉ Tạo cơ sở đầu tiên
○ Thêm nhân viên
○ Thiết lập Membership Package
○ Hoàn thành
```

---

## Step 1: Tạo Branch đầu tiên

```text
Tên cơ sở
Địa chỉ
Số điện thoại
Giờ hoạt động
```

```text
Tenant
   ↓
Branch #1
```

---

## Step 2: Mời Staff/Branch Manager

```text
Email: [________________]

Role:
○ Branch Manager
○ Staff

[ Gửi lời mời ]
```

Lưu ý nghiệp vụ:

> Owner không nên tự tạo mật khẩu cho nhân viên.

Nên:

```text
Invite
→ Email
→ Nhân viên chấp nhận
→ Tạo mật khẩu
→ Active
```

---

## Step 3: Tạo Membership Package

Ví dụ:

```text
Gói: Gym 1 tháng
Giá: 500,000
Thời hạn: 30 ngày
Branch áp dụng: Branch A
```

Sau đó Owner có thể vào Dashboard.

---

# VIII. Kiến trúc giao diện Owner Dashboard

Tôi đề xuất Sidebar:

```text
┌─────────────────────┐
│ 🏋 FITFLOW          │
│                     │
│ 🏠 Tổng quan         │
│                     │
│ ─── QUẢN LÝ ─────   │
│ 🏢 Chi nhánh         │
│ 👥 Khách hàng        │
│ 🎫 Gói tập           │
│ 🏋 PT & Lịch tập     │
│ 💳 Thanh toán        │
│                     │
│ ─── VẬN HÀNH ─────   │
│ 📍 Check-in          │
│ 🔔 Thông báo         │
│                     │
│ ─── PHÂN TÍCH ────   │
│ 📊 Báo cáo           │
│                     │
│ ─── HỆ THỐNG ─────   │
│ 👤 Nhân viên         │
│ ⚙️ Cài đặt           │
│ 💎 Gói sử dụng       │
│                     │
└─────────────────────┘
```

Tuy nhiên menu có thể thay đổi theo Plan/Entitlement.

Ví dụ:

```text
PT Management
```

nếu Tenant chưa mua quyền:

```text
🔒 PT & Lịch tập
```

Bấm vào:

> “Nâng cấp gói để sử dụng tính năng này”.

---

# IX. Trang Dashboard Owner

Đây là trang quan trọng nhất.

## Header

```text
Chào buổi sáng, Trung 👋

FITFLOW FITNESS
Tất cả chi nhánh ▼

[ 24/08/2026 ]
```

Owner có thể chọn:

```text
Tất cả Branch
Branch A
Branch B
Branch C
```

## KPI Cards

```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 👥 MEMBERS    │ │ 📍 CHECK-IN  │ │ 💰 DOANH THU │
│              │ │              │ │              │
│ 1,245        │ │ 85 hôm nay   │ │ 12,500,000   │
│ ↑ 12%        │ │ ↑ 8%         │ │ ↑ 15%        │
└──────────────┘ └──────────────┘ └──────────────┘
```

Card thứ tư:

```text
Membership sắp hết hạn
```

hoặc:

```text
Active Members
```

Tôi ưu tiên:

```text
⚠️ Cần chú ý
```

vì Owner quan tâm đến việc cần xử lý.

Ví dụ:

```text
23 Membership sắp hết hạn
4 PT Package sắp hết hạn
2 Branch gần đạt giới hạn nhân sự
```

---

# X. Dashboard theo Branch

Owner có thể chọn:

```text
[Tất cả Branches ▼]
```

Khi chọn All:

```text
Toàn bộ doanh nghiệp
```

Khi chọn một Branch:

```text
Branch Performance
```

Ví dụ:

```text
DOANH THU THEO CHI NHÁNH

Branch A   ███████████  45M
Branch B   ████████     32M
Branch C   █████        18M
```

Đây là lợi thế lớn của Owner so với Branch Manager.

---

# XI. Trang Chi nhánh

```text
CHI NHÁNH

[+ Thêm chi nhánh]

┌─────────────────────────────────────────┐
│ FITFLOW CẦU GIẤY                        │
│ Hà Nội                                  │
│                                         │
│ Members: 450                            │
│ Staff: 8                                │
│ Check-in hôm nay: 75                    │
│                                         │
│ [Quản lý]                               │
└─────────────────────────────────────────┘
```

Khi bấm vào:

```text
Branch Detail
│
├── Tổng quan
├── Nhân viên
├── Khách hàng
├── Check-in
├── Doanh thu
└── Cài đặt
```

Business Rule:

Owner được quản lý tất cả Branch thuộc Tenant, nhưng phải kiểm tra:

```text
MAX_BRANCH
```

trước khi tạo Branch mới.

---

# XII. Trang Khách hàng / Member

```text
KHÁCH HÀNG

[🔍 Tìm kiếm tên, SĐT...]

[Filter Status] [Filter Branch]

[+ Thêm khách hàng]

─────────────────────────────────────

Tên       SĐT        Membership   Status

Nguyễn A  09...      Gym 1 Month  Active
Trần B    08...      Gym 3 Month  Expired
```

Bấm vào Customer:

```text
CUSTOMER PROFILE

Thông tin cá nhân

Membership
─────────────
Gym 3 tháng
01/08 → 31/10
Active

PT Package
─────────────
PT A – 20 Sessions
Remaining: 12

Check-in History
Payment History
```

---

# XIII. Trang Membership

Tôi sẽ tách rõ:

```text
Membership Packages
```

và:

```text
Customer Memberships
```

Không nên gộp.

## Package

```text
GÓI TẬP

[+ Tạo gói]

Gym 1 tháng
500,000 VND

Gym 3 tháng
1,200,000 VND

VIP Multi-Branch
2,000,000 VND
```

## Membership đang sử dụng

```text
MEMBERSHIPS

Customer | Package | Start | End | Status
```

Điều này giúp Owner quản lý Template và dữ liệu giao dịch riêng.

---

# XIV. Trang PT & Lịch tập

```text
PT MANAGEMENT

[PT] [PT Packages] [Bookings]
```

## PT List

```text
PT A
Active Customers: 12
Today's Sessions: 5

PT B
Active Customers: 8
Today's Sessions: 3
```

## Booking

```text
LỊCH HÔM NAY

08:00  Customer A — PT A
09:00  Customer B — PT B
10:30  Customer C — PT A
```

Owner nhìn tổng thể, không nhất thiết trực tiếp thao tác lịch cho từng buổi.

---

# XV. Trang Check-in

Đây là trang vận hành rất quan trọng.

```text
CHECK-IN OVERVIEW

Hôm nay: 24/08/2026

Total: 125
Members: 110
Guests: 15

Currently In Gym: 42
```

Bên dưới:

```text
Thời gian | Khách | Branch | Phương thức | Status

08:10 | Nguyễn A | Branch A | QR | Checked In
08:15 | Trần B | Branch B | Face | Checked Out
```

Có filter:

```text
Branch
Member / Guest
Check-in Method
Status
```

Owner thường chỉ nên **theo dõi và xử lý ngoại lệ**, không phải làm Check-in hàng ngày.

---

# XVI. Trang Payment

Owner cần nhìn tài chính vận hành.

```text
PAYMENTS

Today
Revenue: 12,500,000

[Membership]
[Guest]
[PT Package]
```

Danh sách:

```text
Customer      Type          Amount       Status

Nguyễn A      Membership    1,200,000    PAID
Guest A       Guest          100,000     PAID
Trần B        PT Package     2,000,000   PAID
```

Có Date Range:

```text
Today
This Week
This Month
Custom
```

---

# XVII. Trang Reports

Tôi chia theo nhóm:

```text
REPORTS

Overview
Revenue
Members
Check-in
PT
Branch Performance
```

Ví dụ Owner chọn:

```text
01/08 → 31/08
```

Có:

```text
Total Revenue
New Customers
Active Membership
Expired Membership
Total Check-in
```

---

# XVIII. Notification Center

```text
🔔 THÔNG BÁO

⚠️ 10 Membership sẽ hết hạn trong 7 ngày

⚠️ PT Package của Nguyễn A còn 2 buổi

💰 Thanh toán mới: 1,200,000

🏢 Branch B đạt 90% giới hạn Staff
```

Tôi khuyên Notification phải có:

```text
Type
Priority
Related Entity
Read Status
```

---

# XIX. Trang Subscription — cực kỳ quan trọng với Owner

```text
GÓI SỬ DỤNG

FITFLOW GROWTH

● ACTIVE

Gia hạn: 30/12/2026

────────────────────

USAGE

Branches
████████░░ 4 / 5

Staff
██████░░░░ 12 / 20

PT
████░░░░░░ 8 / 20

────────────────────

ADD-ONS

✓ Face Recognition
✓ Extra Branch

[ Nâng cấp gói ]
[ Gia hạn ]
[ Lịch sử thanh toán ]
```

Đây chính là nơi kết nối:

```text
Owner UI
      ↓
Subscription
      ↓
Tenant Entitlement
```

---

# XX. Trang Settings

Tôi đề xuất:

```text
SETTINGS

Business Information
Branding
Branch Configuration
Check-in Configuration
Notification Settings
Payment Configuration
Subscription
Security
```

Đặc biệt:

## Check-in Configuration

Vì trước đó bạn đã xác nhận Owner sẽ cấu hình một số hành vi Check-in:

```text
✓ Auto Checkout
```

Ví dụ:

```text
Tự động Checkout

[✓] Bật Auto Checkout

Thời gian:
[ 4 ] giờ sau Check-in
```

Nghiệp vụ:

```text
Customer A Check-in 08:00
→ Auto Checkout 12:00

Customer B Check-in 09:00
→ Auto Checkout 13:00
```

Đúng theo nghiệp vụ chúng ta đã thống nhất trước đó.

---

# XXI. Phân quyền Owner trên giao diện

Owner có quyền:

```text
✓ Xem tất cả Branch
✓ Quản lý Branch
✓ Quản lý Staff
✓ Quản lý Customer
✓ Quản lý Membership
✓ Quản lý PT
✓ Xem Payment
✓ Xem Reports
✓ Cấu hình doanh nghiệp
✓ Quản lý Subscription
```

Nhưng Owner không nên có quyền:

```text
✕ Cấu hình SaaS Plan
✕ Thay đổi Feature Catalog
✕ Quản lý Tenant khác
✕ Xem dữ liệu Platform
✕ Quản lý Subscription của Tenant khác
```

---

# XXII. Sitemap cuối cùng của Owner Portal

Tôi đề xuất chốt cấu trúc:

```text
OWNER PORTAL
│
├── Dashboard
│
├── Branches
│   └── Branch Detail
│
├── Customers
│   └── Customer Detail
│
├── Membership
│   ├── Membership Packages
│   └── Active Memberships
│
├── PT & Booking
│   ├── PT
│   ├── PT Packages
│   └── Booking
│
├── Check-in
│
├── Payments
│
├── Notifications
│
├── Reports
│
├── Staff
│
├── Settings
│   ├── Business
│   ├── Check-in
│   ├── Notification
│   └── Security
│
└── Subscription
    ├── Current Plan
    ├── Usage
    ├── Add-ons
    └── Billing History
```

---

# Kết luận dưới góc nhìn BA

Tôi sẽ thiết kế Owner Experience theo **3 giai đoạn lớn**:

### 1. Acquire — Đăng ký và trở thành khách hàng

```text
Register → Verify → Create Business → Choose Plan → Pay
```

### 2. Activate — Thiết lập phòng tập

```text
Create Branch → Invite Staff → Configure Packages
```

### 3. Operate & Grow — Vận hành và phát triển

```text
Dashboard
→ Monitor Business
→ Manage Customers
→ Manage Operations
→ Analyze Reports
→ Upgrade SaaS
```

Điểm quan trọng nhất trong UI Owner của FitFlow là: **Owner không nên phải đi qua quá nhiều màn hình để biết tình hình phòng tập của mình**. Dashboard phải trả lời được ngay:

> **Hôm nay có gì đang xảy ra? Tôi cần xử lý vấn đề gì? Doanh thu và lượng khách đang như thế nào?**
IV. Giai đoạn 4 — Kích hoạt Tenant và bắt đầu dùng thử 7 ngày
1. Thời điểm bắt đầu Trial

Sau khi Owner đã:

Đăng ký tài khoản
        ↓
Xác thực tài khoản
        ↓
Nhập thông tin doanh nghiệp
        ↓
Tạo Tenant thành công

Hệ thống không yêu cầu thanh toán ngay.

Thay vào đó:

Tenant Created Successfully
        ↓
Tenant Status = ACTIVE
        ↓
Subscription Status = TRIAL
        ↓
Trial Duration = 7 Days
        ↓
Owner được truy cập hệ thống
Ví dụ

Owner tạo Tenant lúc:

24/08/2026 – 10:00

Hệ thống tạo Trial:

Trial Start: 24/08/2026 – 10:00
Trial End:   31/08/2026 – 10:00

Tôi khuyên nên tính theo đúng thời điểm (timestamp), thay vì chỉ tính theo ngày, để minh bạch và dễ xử lý ở backend.

V. Màn hình chào mừng sau khi tạo Tenant

Sau khi đăng ký thành công, Owner không nên vào Dashboard ngay.

Hiển thị màn hình:

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
│                                               │
│          [ Bắt đầu thiết lập → ]               │
│                                               │
└───────────────────────────────────────────────┘
Mục tiêu UX

Owner hiểu ngay 3 điều:

Đã tạo doanh nghiệp thành công.
Có thể bắt đầu sử dụng ngay.
Chưa cần thanh toán ngay nhưng thời gian Trial có giới hạn.
VI. Giai đoạn 5 — Onboarding trong thời gian Trial

Sau màn hình Welcome, Owner được đưa vào luồng thiết lập.

Tôi đề xuất một Onboarding Checklist, nhưng không nên bắt buộc hoàn thành toàn bộ mới được sử dụng hệ thống.

THIẾT LẬP PHÒNG TẬP CỦA BẠN

Hoàn thành các bước để bắt đầu vận hành

✓ Thông tin doanh nghiệp

① Tạo cơ sở đầu tiên
② Thêm nhân viên
③ Tạo gói tập
④ Hoàn tất thiết lập

Owner có thể:

[ Tiếp tục thiết lập ]

hoặc

[ Vào Dashboard ]
Bước 1 — Tạo Branch đầu tiên
Tên chi nhánh
Địa chỉ
Số điện thoại
Giờ mở cửa
Giờ đóng cửa

Sau khi tạo:

Tenant
   │
   └── Branch #1
Business Rule

Backend phải kiểm tra:

TRIAL ENTITLEMENT

Ví dụ Trial cho phép:

MAX_BRANCH = 1

hoặc Trial có toàn quyền theo gói mặc định mà bạn lựa chọn.

Bước 2 — Thêm Staff

Owner có thể mời:

Branch Manager
Staff
PT

Thông qua:

Tên
Email hoặc Số điện thoại
Role
Branch

Sau khi gửi:

INVITATION
   ↓
User Accept
   ↓
Create Password
   ↓
Account Active
Bước 3 — Thiết lập dịch vụ và gói tập

Owner có thể tạo:

Service

Ví dụ:

Gym
Yoga
Fitness
Personal Training

Sau đó tạo:

Membership Package

Ví dụ:

Gym 1 tháng
500,000 VNĐ
30 ngày

hoặc:

VIP Multi-Branch
2,000,000 VNĐ
90 ngày
Bước 4 — Thiết lập Check-in

Đây là phần quan trọng với FitFlow.

Owner lựa chọn các phương thức được phép sử dụng theo Entitlement:

✓ QR Check-in
✓ Manual Check-in
🔒 Face Recognition

Nếu Face Recognition là tính năng trả phí hoặc Add-on, Trial có thể hiển thị:

Dùng thử tính năng Face Recognition trong 7 ngày.

Điều này tạo cơ hội tốt để Owner trải nghiệm trước khi quyết định mua.

VII. Dashboard Owner trong thời gian Trial

Sau khi Owner hoàn thành hoặc bỏ qua Onboarding, họ vào Dashboard.

Trên Dashboard cần có một Trial Banner.

Ví dụ:

┌──────────────────────────────────────────────────────┐
│ ⏳ Bạn đang dùng thử FitFlow                           │
│ Còn 6 ngày 12 giờ để trải nghiệm đầy đủ hệ thống.     │
│                                      [ Chọn gói ]     │
└──────────────────────────────────────────────────────┘

Tôi khuyên banner này không nên quá gây khó chịu, nhưng phải luôn có thể nhìn thấy ở các màn hình quan trọng.

VIII. Giai đoạn 6 — Nhắc Owner khi Trial sắp hết hạn

Đây là một nghiệp vụ rất quan trọng mà nhiều hệ thống SaaS bỏ qua.

Timeline đề xuất
Còn 7–4 ngày
Thông báo nhẹ:

Bạn đang trải nghiệm FitFlow miễn phí.
Còn 3 ngày
⏳ Thời gian dùng thử còn 3 ngày.

Hãy chọn gói phù hợp để tiếp tục sử dụng hệ thống.
Còn 1 ngày
⚠️ Trial của bạn sẽ kết thúc sau 24 giờ.
Hết hạn
TRIAL EXPIRED

Owner được chuyển sang màn hình:

Chọn gói để tiếp tục sử dụng
IX. Giai đoạn 7 — Trial hết hạn

Đây là điểm cần xác định rõ nghiệp vụ.

Tôi đề xuất:

Subscription = EXPIRED
Tenant = ACTIVE
Access Mode = READ_ONLY

Tức là dữ liệu không bị xóa.

Owner vẫn có thể:

✓ Đăng nhập
✓ Xem Dashboard
✓ Xem dữ liệu cũ
✓ Chọn và thanh toán gói

Nhưng không thể:

✕ Check-in
✕ Tạo Membership
✕ Tạo Payment
✕ Tạo Customer mới
✕ Tạo Booking
✕ Mời Staff mới
Lý do tôi đề xuất READ_ONLY

Nếu khóa hoàn toàn ngay khi hết Trial, Owner có thể cảm thấy bị “mất quyền kiểm soát” dữ liệu.

READ_ONLY giúp Owner:

Vẫn thấy được dữ liệu đã tạo → hiểu giá trị của hệ thống → dễ quyết định nâng cấp.

X. Màn hình Trial Expired
┌───────────────────────────────────────────────────────┐
│                                                       │
│                 Thời gian dùng thử đã kết thúc         │
│                                                       │
│ Cảm ơn bạn đã trải nghiệm FitFlow.                     │
│                                                       │
│ Dữ liệu của bạn vẫn được lưu an toàn.                  │
│                                                       │
│ Chọn gói phù hợp để tiếp tục vận hành phòng tập.       │
│                                                       │
│              [ XEM CÁC GÓI SỬ DỤNG ]                   │
│                                                       │
└───────────────────────────────────────────────────────┘

Các trang khác có thể hiển thị:

🔒 Trial đã kết thúc.
Chọn gói để tiếp tục sử dụng tính năng này.

[ Nâng cấp ngay ]
XI. Giai đoạn 8 — Owner chọn gói SaaS

Lúc này Owner đã hiểu hệ thống và có dữ liệu thật.

Giao diện Subscription:

┌───────────────┐ ┌────────────────┐ ┌────────────────┐
│ STARTER       │ │ GROWTH ⭐      │ │ ENTERPRISE     │
│               │ │                │ │                │
│ 1 Branch      │ │ 5 Branch       │ │ Custom         │
│ 5 Staff       │ │ 20 Staff       │ │ Unlimited      │
│               │ │                │ │                │
│ xxx/tháng     │ │ xxx/tháng      │ │ Liên hệ        │
│               │ │                │ │                │
│ [ Chọn gói ]  │ │ [ Chọn gói ]   │ │ [ Liên hệ ]    │
└───────────────┘ └────────────────┘ └────────────────┘

Owner có thể chọn:

Thanh toán theo tháng

hoặc:

Thanh toán theo năm

Sau đó chuyển sang:

Payment
XII. Giai đoạn 9 — Thanh toán và kích hoạt Subscription

Luồng:

Owner chọn Plan
        ↓
Create Subscription Pending
        ↓
Create Payment
        ↓
QR Payment
        ↓
Payment Success
        ↓
Subscription ACTIVE
        ↓
Update Tenant Entitlement
        ↓
Full Access

Backend cần đảm bảo:

Chỉ Payment SUCCESS mới kích hoạt Subscription.

Nếu Payment:

PENDING
FAILED
EXPIRED

thì quyền truy cập chưa được kích hoạt.

XIII. Business Rule cho Trial 7 ngày

Tôi đề xuất bổ sung các Business Rule sau.

BR-TRIAL-01 — Mỗi Tenant chỉ có một lần Trial

Không được:

Trial hết hạn
→ Xóa Tenant
→ Tạo lại Tenant
→ Dùng thử tiếp

Hệ thống cần kiểm soát theo logic kinh doanh phù hợp, nhưng không nên chỉ dựa duy nhất vào email vì có thể phát sinh nhiều tình huống.

BR-TRIAL-02 — Trial bắt đầu khi Tenant được tạo thành công

Không bắt đầu từ lúc người dùng chỉ đăng ký Account.

Register Account
       ≠
Start Trial

Mà:

Tenant Created
       ↓
Start Trial
BR-TRIAL-03 — Trial có Entitlement riêng

Tôi đề xuất mô hình:

TRIAL ENTITLEMENT

Ví dụ:

7 ngày
1 Branch
10 Staff
100 Members
QR Check-in
Manual Check-in
PT Management
Basic Report

Hoặc bạn có thể cho trải nghiệm toàn bộ tính năng.

BR-TRIAL-04 — Trial hết hạn không xóa dữ liệu
Trial Expired
       ↓
Read Only
       ↓
Select Plan
       ↓
Payment Success
       ↓
Restore Full Access
BR-TRIAL-05 — Nếu Owner thanh toán trước khi hết Trial

Tôi đề xuất:

Payment Success
       ↓
Trial kết thúc
       ↓
Subscription ACTIVE

Cần quyết định một điểm: 7 ngày Trial còn lại có được cộng dồn vào Subscription không?

Khuyến nghị của tôi

Không cộng dồn.

Ví dụ:

Trial: 24/08 → 31/08

Owner mua gói ngày 27/08

Sau Payment Success:

Subscription Start = 27/08

Lý do: đây là mô hình SaaS phổ biến, dễ hiểu và dễ quản lý.

Tuy nhiên, đây là một điểm bạn có thể thay đổi nếu muốn chính sách thân thiện hơn với khách hàng.

XIV. Luồng hoàn chỉnh sau khi thay đổi
PUBLIC WEBSITE
       ↓
REGISTER OWNER ACCOUNT
       ↓
VERIFY ACCOUNT
       ↓
CREATE TENANT
       ↓
┌──────────────────────┐
│ START 7-DAY FREE TRIAL│
└──────────┬───────────┘
           ↓
      ONBOARDING
           ↓
     OWNER DASHBOARD
           ↓
    ┌──────┴──────┐
    │             │
PAY BEFORE     TRIAL EXPIRED
TRIAL END          │
    │               ↓
    ↓           READ ONLY
SUBSCRIPTION        │
ACTIVE              ↓
    │           CHOOSE PLAN
    └───────────────┤
                    ↓
                 PAYMENT
                    ↓
          SUBSCRIPTION ACTIVE
                    ↓
             FULL ACCESS
Với mô hình của FitFlow, tôi cho rằng phương án:

Tạo Tenant → Dùng thử miễn phí 7 ngày → Sau đó mới yêu cầu chọn gói và thanh toán

là hợp lý hơn việc bắt Owner phải thanh toán ngay.

Theo góc nhìn của tôi với vai trò **BA + Product/SaaS Architect**, tôi sẽ không chọn cách “mở toàn bộ miễn phí, hết 7 ngày thì khóa ngay” một cách đơn giản. Với FitFlow, 3 vấn đề này liên quan trực tiếp đến **trải nghiệm khách hàng, khả năng chuyển đổi trả phí và độ phức tạp backend**.

Dưới đây là phương án tôi đề xuất để bạn có thể chốt nghiệp vụ.

---

# 1. Trial 7 ngày nên cho dùng toàn bộ hay giới hạn tính năng?

## Khuyến nghị: Dùng gần như đầy đủ Core Features, nhưng giới hạn Usage

Tôi **không khuyến nghị** tạo một Trial quá ít tính năng.

Ví dụ nếu khách vào dùng thử nhưng thấy:

```text
🔒 PT Management
🔒 Reports
🔒 Multi Branch
🔒 Face Recognition
```

thì họ chưa thực sự hiểu FitFlow có gì. Trial sẽ mất ý nghĩa.

Tuy nhiên, cũng không nên cho phép sử dụng hoàn toàn không giới hạn vì có thể phát sinh dữ liệu lớn hoặc chi phí vận hành cao.

### Tôi đề xuất Trial Entitlement như sau:

| Nhóm             | Trial đề xuất                               |
| ---------------- | ------------------------------------------- |
| Branch           | Tối đa 1                                    |
| Staff            | 5–10 người                                  |
| Member           | Không giới hạn hoặc giới hạn cao            |
| Membership       | Có                                          |
| Guest            | Có                                          |
| Payment          | Có                                          |
| QR Check-in      | Có                                          |
| Manual Check-in  | Có                                          |
| PT Management    | Có                                          |
| PT Booking       | Có                                          |
| Dashboard        | Có                                          |
| Basic Report     | Có                                          |
| Multi-Branch     | Không cần thiết vì chỉ 1 Branch             |
| Face Recognition | Nên có Demo/Trial nếu không quá tốn chi phí |

### Tại sao?

Trong 7 ngày, Owner cần cảm nhận được chu trình vận hành hoàn chỉnh:

```text
Tạo Branch
   ↓
Thêm Staff
   ↓
Tạo Customer
   ↓
Bán Membership
   ↓
Customer Check-in
   ↓
Xem Dashboard / Report
```

Nếu Owner trải nghiệm được chuỗi này, khả năng họ hiểu giá trị của FitFlow sẽ cao hơn.

### Business Rule tôi đề xuất

```text
BR-TRIAL-01:
Trial được cung cấp Core Feature đầy đủ,
nhưng áp dụng Usage Limit để kiểm soát tài nguyên.
```

---

# 2. Trial hết hạn thì READ_ONLY trong bao lâu?

## Khuyến nghị: 30 ngày Grace Period

Tôi đề xuất luồng:

```text
7 DAYS TRIAL
      ↓
TRIAL EXPIRED
      ↓
30 DAYS READ_ONLY / GRACE PERIOD
      ↓
SUSPENDED
```

Trong 30 ngày này:

### Owner vẫn được:

```text
✓ Đăng nhập
✓ Xem Dashboard
✓ Xem Member
✓ Xem Membership
✓ Xem Payment History
✓ Xem Check-in History
✓ Xem Report
✓ Chọn Plan và thanh toán
```

### Nhưng không được:

```text
✕ Tạo Member mới
✕ Tạo Membership
✕ Check-in
✕ Nhận Payment mới
✕ Tạo Booking
✕ Tạo Branch
✕ Mời Staff mới
```

## Sau 30 ngày thì sao?

Tôi đề xuất:

```text
Tenant = SUSPENDED
```

Khi đó:

```text
Owner vẫn có thể đăng nhập
```

nhưng chỉ thấy một số màn hình cơ bản:

```text
Subscription
Billing
Support
```

Các dữ liệu nghiệp vụ không bị xóa.

---

## Tại sao tôi chọn 30 ngày?

7 ngày Trial là thời gian để trải nghiệm.

30 ngày Grace Period là thời gian để Owner:

* cân nhắc lựa chọn gói;
* trao đổi với đối tác;
* chờ phê duyệt chi phí;
* quay lại tiếp tục sử dụng.

Đặc biệt với mô hình B2B SaaS, quyết định mua đôi khi không diễn ra ngay trong ngày thứ 7.

### Business Rule

```text
BR-TRIAL-02:
Khi Trial hết hạn, Subscription chuyển sang EXPIRED
và Tenant vào chế độ READ_ONLY trong 30 ngày.

BR-TRIAL-03:
Sau Grace Period, Tenant chuyển sang SUSPENDED.
```

> **Lưu ý:** `Subscription Status` và `Tenant Access Mode` nên được thiết kế riêng. Đừng chỉ dùng một trường Status cho tất cả.

Ví dụ:

```text
Subscription Status = EXPIRED

Tenant Status = ACTIVE

Access Mode = READ_ONLY
```

---

# 3. Làm sao ngăn khách tạo Trial nhiều lần?

Đây là vấn đề phức tạp nhất trong 3 vấn đề.

## Tôi không khuyến nghị chỉ kiểm tra Email

Vì khách có thể:

```text
Email A → Trial
Email B → Trial tiếp
Email C → Trial tiếp
```

Cũng không nên chỉ kiểm tra số điện thoại vì có trường hợp doanh nghiệp thay đổi Owner hoặc người quản lý.

---

# Giải pháp tôi đề xuất: Trial Eligibility

Thay vì đặt logic:

```text
Email đã dùng Trial?
```

Tôi đề xuất một module hoặc bảng nghiệp vụ:

```text
TRIAL ELIGIBILITY
```

Mục tiêu:

> Hệ thống xác định một Tenant/Business có đủ điều kiện nhận Trial hay không.

---

## Các mức kiểm tra

### Level 1 — Email

```text
Email đã từng nhận Trial?
```

Nếu có → cảnh báo.

---

### Level 2 — Số điện thoại

```text
Phone đã từng nhận Trial?
```

Nếu có → không tự động cấp Trial mới.

---

### Level 3 — Business Identity

Khi Tenant đã có thông tin:

```text
Business Name
Phone
Contact Email
```

hệ thống có thể kiểm tra dấu hiệu trùng lặp.

Nhưng tôi lưu ý:

> Không nên tự động khóa chỉ vì tên doanh nghiệp giống nhau.

Ví dụ:

```text
ABC Gym
ABC Fitness
```

có thể hoàn toàn khác nhau.

---

## Cách xử lý tốt nhất cho MVP

Tôi khuyên bạn nên triển khai đơn giản nhưng có khả năng mở rộng:

### Khi một User tạo Tenant lần đầu:

```text
User.hasUsedTrial = false
```

→ được cấp Trial.

Sau khi cấp:

```text
User.hasUsedTrial = true
```

Lần sau nếu User đó tạo Tenant khác:

```text
Trial không được tự động cấp.
```

Đồng thời lưu lịch sử:

```text
TrialHistory
```

Ví dụ:

```text
trial_id
user_id
tenant_id
start_at
end_at
status
```

### Với Tenant mới từ User mới

MVP vẫn có thể cho Trial, nhưng Super Admin có công cụ theo dõi các trường hợp bất thường.

Đây là cách **cân bằng giữa độ đơn giản và thực tế**.

---

# Tôi đề xuất mô hình tổng thể như sau

```text
USER REGISTER
      ↓
CREATE TENANT
      ↓
CHECK TRIAL ELIGIBILITY
      │
      ├── Eligible
      │       ↓
      │   CREATE TRIAL
      │
      └── Not Eligible
              ↓
        REQUIRE PLAN SELECTION
```

---

# Cấu trúc trạng thái tôi khuyên dùng

## Subscription

```text
TRIAL
ACTIVE
EXPIRED
CANCELLED
```

## Tenant

```text
PENDING
ACTIVE
SUSPENDED
ARCHIVED
```

## Access Mode

```text
FULL_ACCESS
READ_ONLY
LIMITED_ACCESS
BLOCKED
```

Nhờ vậy backend dễ xử lý:

| Trường hợp       | Subscription   | Tenant    | Access      |
| ---------------- | -------------- | --------- | ----------- |
| Đang Trial       | TRIAL          | ACTIVE    | FULL_ACCESS |
| Đã mua           | ACTIVE         | ACTIVE    | FULL_ACCESS |
| Trial hết hạn    | EXPIRED        | ACTIVE    | READ_ONLY   |
| Quá Grace Period | EXPIRED        | SUSPENDED | BLOCKED     |
| Bị Admin khóa    | ACTIVE/EXPIRED | SUSPENDED | BLOCKED     |

---

# Phương án cuối cùng tôi khuyên bạn chốt cho FitFlow

## 🎯 Trial

> **7 ngày, cho phép trải nghiệm đầy đủ các chức năng Core nhưng giới hạn số lượng sử dụng.**

## ⏳ Sau Trial

> **30 ngày READ_ONLY để Owner xem dữ liệu và có cơ hội nâng cấp.**

## 🔐 Chống Abuse

> **MVP kiểm tra Trial theo User Account và lưu Trial History; các cơ chế phát hiện trùng lặp nâng cao để Super Admin xử lý ngoại lệ.**

---

## Một lưu ý BA rất quan trọng

Tôi **không khuyên bạn làm quá phức tạp ngay từ MVP** bằng cách xác minh pháp nhân, giấy phép kinh doanh hoặc cơ chế chống tạo tài khoản giả quá mạnh.

FitFlow ở giai đoạn đầu nên ưu tiên:

```text
Đăng ký nhanh
      +
Trải nghiệm giá trị
      +
Thanh toán đơn giản
```

Khi hệ thống có lượng khách hàng lớn và bắt đầu gặp tình trạng lạm dụng Trial thực tế, bạn mới bổ sung các lớp kiểm soát nâng cao.

---

# XX. Quản lý Mật khẩu — Quên mật khẩu & Đổi mật khẩu qua Email OTP

## 1. Luồng Quên Mật Khẩu (Forgot Password - Chưa đăng nhập)

### Quy trình nghiệp vụ:
1. **Yêu cầu mã OTP**: Tại màn hình đăng nhập, Owner chọn "Quên mật khẩu?", nhập email đã đăng ký.
   - API: `POST /api/v1/owner/auth/forgot-password`
   - Hệ thống tạo mã OTP (6 chữ số), lưu vào `otp_codes` với `purpose = 'FORGOT_PASSWORD'`, hết hạn sau 5 phút. Cooldown resend là 60s.
   - Gửi mail chứa OTP tới email người dùng via `MailService`.
2. **Xác nhận OTP & Đặt mật khẩu mới**:
   - Owner nhập mã OTP 6 số và mật khẩu mới.
   - API: `POST /api/v1/owner/auth/reset-password`
   - Backend xác thực OTP (chưa tiêu thụ, chưa hết hạn, số lần thử < 5). Đổi `password_hash`, đánh dấu OTP consumed và lưu AuditLog.

## 2. Luồng Đổi Mật Khẩu (Change Password - Đã đăng nhập)

### Quy trình nghiệp vụ:
1. **Yêu cầu mã OTP đổi mật khẩu**: Trong Cài đặt hệ thống (Settings), Owner chọn tab "Bảo mật & Mật khẩu" và nhấn "Gửi mã OTP".
   - API: `POST /api/v1/owner/auth/change-password/request-otp` (Yêu cầu xác thực JwtAuthGuard)
   - Hệ thống tạo mã OTP (6 chữ số), lưu vào `otp_codes` với `purpose = 'CHANGE_PASSWORD'`, gửi email xác thực.
2. **Xác nhận đổi mật khẩu**:
   - Owner nhập OTP, mật khẩu cũ (tùy chọn) và mật khẩu mới.
   - API: `POST /api/v1/owner/auth/change-password`
   - Backend kiểm tra OTP + mật khẩu cũ (nếu có), mã hóa mật khẩu mới với bcrypt và cập nhật DB.



