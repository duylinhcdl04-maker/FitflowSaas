Rất tốt. Dựa **trực tiếp trên tài liệu `ROLE_PT.md` bạn đã chốt**, UI dành cho PT nên được thiết kế khác hoàn toàn với Staff hay Branch Manager.

* **Staff:** thao tác nhanh tại quầy.
* **Branch Manager:** điều hành chi nhánh.
* **PT:** quản lý công việc cá nhân, lịch dạy và học viên.

Tôi đề xuất thiết kế theo tư duy **Personal Workspace / My Work**, tức khi PT đăng nhập, mọi thứ xoay quanh câu hỏi:

> **“Hôm nay tôi phải dạy ai? Lịch của tôi thế nào? Học viên của tôi đang tiến độ ra sao?”**

---

# PHÂN TÍCH & THIẾT KẾ UI PHÂN HỆ PT — FITFLOW

## 1. Kiến trúc tổng thể UI

Sidebar nên tối giản:

```text
🏠 Tổng quan
────────────────────
📅 Lịch của tôi
👥 Học viên của tôi
📦 Gói PT
⏱ Buổi tập
────────────────────
👤 Hồ sơ chuyên môn
⚙️ Lịch làm việc
```

Không nên hiển thị:

* Danh sách Member toàn phòng tập.
* Doanh thu của chi nhánh.
* Danh sách PT khác.
* Cấu hình hệ thống.
* Báo cáo tài chính.

Điều này đúng với `Scope & Boundaries` của PT.

---

# 2. PT DASHBOARD — “MY WORKSPACE”

## Mục tiêu

PT mở Dashboard và phải biết ngay:

1. Hôm nay có bao nhiêu buổi tập?
2. Buổi tiếp theo là với ai?
3. Có Booking nào đang chờ xác nhận?
4. Học viên nào có gói PT sắp hết hạn hoặc sắp hết buổi?
5. Có việc nào cần xử lý?

## Layout đề xuất

```text
┌───────────────────────────────────────────────────────────┐
│ Chào buổi sáng, PT Nguyễn Văn A 👋                        │
│ Hôm nay: Thứ Ba, 25/08/2026                              │
├───────────────────────────────────────────────────────────┤
│  📅 Hôm nay     ⏳ Sắp tới      ⏱ Chờ xác nhận            │
│     5 buổi        3 buổi             2                  │
├─────────────────────────────────────┬─────────────────────┤
│ LỊCH HÔM NAY                        │ BUỔI TIẾP THEO      │
│                                     │                     │
│ 08:00  Nguyễn Văn A                 │ 10:00 – 11:00       │
│ 10:00  Trần Văn B                   │ 👤 Trần Văn B       │
│ 15:00  Lê Văn C                     │ [ Xem buổi tập ]    │
├─────────────────────────────────────┴─────────────────────┤
│ ⚠️ CẦN CHÚ Ý                                             │
│                                                          │
│ • 2 Booking đang chờ xác nhận                            │
│ • 3 học viên còn ≤ 2 buổi                                │
│ • 1 gói PT sắp hết hạn                                   │
└───────────────────────────────────────────────────────────┘
```

### Quick Actions

```text
[ Xem lịch hôm nay ]
[ Xác nhận Booking ]
[ Hoàn thành buổi tập ]
```

PT không cần Dashboard nhiều biểu đồ phức tạp. Giá trị lớn nhất là **biết việc cần làm và hành động nhanh**.

---

# 3. MÀN HÌNH “LỊCH CỦA TÔI”

Đây là màn hình trung tâm thứ hai.

URL ví dụ:

```text
/pt/schedule
```

## Chế độ hiển thị

```text
[ Ngày ] [ Tuần ]
```

Ví dụ:

```text
08:00 ─────────────────
       👤 Nguyễn Văn A
       🟢 CONFIRMED

10:00 ─────────────────
       👤 Trần Văn B
       🟡 PENDING

15:00 ─────────────────
       👤 Lê Văn C
       🟢 CONFIRMED
```

Màu trạng thái cần trực quan:

* 🟡 Pending.
* 🟢 Confirmed/Scheduled.
* 🔵 In Progress nếu có.
* ⚫ Completed.
* 🔴 Cancelled.

---

## Khi click vào một Booking

```text
┌─────────────────────────────────────┐
│ BUỔI TẬP                            │
│                                     │
│ 👤 Nguyễn Văn A                     │
│                                     │
│ Thời gian: 10:00 – 11:00            │
│ Trạng thái: CONFIRMED               │
│                                     │
│ Gói PT: 20 buổi                     │
│ Đã hoàn thành: 8                    │
│ Còn lại: 12                         │
│                                     │
│ [ Xem học viên ]                    │
│ [ Hoàn thành buổi tập ]             │
└─────────────────────────────────────┘
```

---

# 4. UI XÁC NHẬN / TỪ CHỐI BOOKING

Theo tài liệu:

> PT có quyền tiếp nhận và xác nhận hoặc từ chối yêu cầu Booking.

## Booking Pending

```text
┌─────────────────────────────────────┐
│ YÊU CẦU ĐẶT LỊCH MỚI                │
│                                     │
│ 👤 Nguyễn Văn A                     │
│ Ngày: 26/08/2026                    │
│ Thời gian: 10:00 – 11:00            │
│                                     │
│ [ Từ chối ]      [ Xác nhận ]       │
└─────────────────────────────────────┘
```

### Khi từ chối

UI nên yêu cầu lý do:

```text
Lý do từ chối

[ PT không có mặt                 ▼ ]

[_______________________________]

[ Hủy ]       [ Xác nhận từ chối ]
```

Lý do từ chối giúp người quản lý hoặc học viên hiểu tình trạng Booking.

---

# 5. MÀN HÌNH “MY CLIENTS”

URL:

```text
/pt/clients
```

PT chỉ nhìn thấy học viên có hợp đồng PT hợp lệ với chính mình.

## Danh sách

```text
MY CLIENTS                          🔍 Tìm học viên

┌─────────────────────────────────────────────────────────┐
│ 👤 Nguyễn Văn A                                         │
│ Gói PT: 20 buổi                                         │
│ ███████████░░░░░░░  12 / 20 buổi                       │
│ Còn lại: 8 buổi                                         │
│ Hạn sử dụng: 30/09/2026                                │
│ [ Xem chi tiết ]                                        │
├─────────────────────────────────────────────────────────┤
│ 👤 Trần Văn B                                          │
│ Gói PT: 10 buổi                                         │
│ ████████░░░░░░░░░  5 / 10 buổi                         │
│ Còn lại: 5 buổi                                         │
└─────────────────────────────────────────────────────────┘
```

## Filter đề xuất

* Active.
* Sắp hết buổi.
* Sắp hết hạn.
* Đã hết hạn.

---

# 6. UI CHI TIẾT HỌC VIÊN

Đây là nơi PT làm việc nhiều nhất với một học viên.

```text
← Quay lại

👤 NGUYỄN VĂN A

PT Package
────────────────────
20 Sessions

████████████░░░░░░░░

Đã hoàn thành: 12
Còn lại: 8

Hạn sử dụng: 30/09/2026
Status: 🟢 ACTIVE
```

## Tabs

```text
[ Tổng quan ]
[ Lịch tập ]
[ Workout Log ]
[ Measurements ]
```

### Lưu ý về Privacy

Chỉ hiển thị dữ liệu phù hợp với `BR-PT-004`.

PT không nên thấy các thông tin không cần thiết ngoài phạm vi học viên của mình.

---

# 7. UI WORKOUT LOG

PT có thể ghi lại thông tin sau mỗi buổi:

```text
WORKOUT LOG

Ngày: 25/08/2026

Buổi tập số: 13

Nội dung buổi tập:
[________________________________]

Bài tập chính:
[________________________________]

Đánh giá tiến độ:
[________________________________]

Ghi chú:
[________________________________]

[ Lưu nhật ký ]
```

Theo tài liệu, đây là nơi lưu:

* Workout Log.
* Ghi chú tập luyện.
* Tiến độ của học viên.

Tôi khuyến nghị thiết kế theo dạng timeline để PT dễ xem lịch sử.

```text
25/08/2026
Session #13
Upper Body Training
[ Xem chi tiết ]

22/08/2026
Session #12
Cardio & Core
[ Xem chi tiết ]
```

---

# 8. UI MEASUREMENTS / INBODY

```text
CHỈ SỐ HỌC VIÊN

[ + Thêm chỉ số ]

Ngày đo: 25/08/2026

Cân nặng:    70 kg
Chiều cao:   175 cm
Body Fat:    20 %
```

Nếu có nhiều lần đo:

```text
Weight
70 kg  →  68 kg

Body Fat
20%    →  17%
```

UI có thể hiển thị biểu đồ tiến trình theo thời gian.

**Tuy nhiên:** mức độ chi tiết của các chỉ số và danh mục dữ liệu cần lưu chưa được định nghĩa trong `ROLE_PT.md`, nên đây nên được coi là phần cần chốt thêm khi phân tích Database và Business Rules.

---

# 9. UI HOÀN THÀNH BUỔI TẬP — QUAN TRỌNG NHẤT

Đây là chức năng ảnh hưởng trực tiếp đến số buổi còn lại.

Theo `BR-PT-002`:

> Chỉ khi Session chuyển sang `COMPLETED` mới trừ số buổi.

UI cần làm rõ điều này.

```text
HOÀN THÀNH BUỔI TẬP

👤 Nguyễn Văn A

Session: 13 / 20

Sau khi xác nhận:

Remaining Sessions:
8 → 7

⚠️ Thao tác này sẽ ghi nhận buổi tập
và trừ 1 Session khỏi gói PT.

[ Hủy ]   [ Xác nhận hoàn thành ]
```

Sau khi thành công:

```text
✓ SESSION COMPLETED

Đã hoàn thành: 13 / 20
Còn lại: 7 buổi
```

### UX Recommendation

Không nên để nút `COMPLETED` quá dễ bấm một lần mà hoàn tất ngay. Nên có Confirmation Modal để tránh trừ nhầm Session.

---

# 10. MÀN HÌNH PT PACKAGE & PRICING

URL:

```text
/pt/packages
```

## Danh sách gói của chính PT

```text
GÓI HUẤN LUYỆN CỦA TÔI

[ + Tạo gói mới ]

────────────────────────────

PT BASIC
10 buổi
3.000.000 VNĐ
Status: 🟢 ACTIVE

[ Chỉnh sửa ]

────────────────────────────

PT TRANSFORMATION
20 buổi
5.500.000 VNĐ
Status: 🟡 PENDING APPROVAL
```

---

## Tạo PT Package

```text
TẠO GÓI PT

Tên gói *
[_______________________]

Số buổi *
[ 10 ]

Giá *
[ 3.000.000 VNĐ ]

Thời hạn sử dụng
[ 60 ngày ▼ ]

[ Lưu nháp ]   [ Gửi phê duyệt ]
```

Tuy nhiên, có một điểm nghiệp vụ cần lưu ý:

> Tài liệu nói PT có thể cấu hình giá và gửi Owner phê duyệt **nếu chính sách yêu cầu**.

Vì vậy UI nên hỗ trợ hai trạng thái tùy theo chính sách Tenant:

```text
Policy = AUTO_APPROVE
→ PT tạo → ACTIVE

Policy = OWNER_APPROVAL
→ PT tạo → PENDING_APPROVAL
```

---

# 11. UI QUẢN LÝ WORKING HOURS

URL:

```text
/pt/availability
```

PT thiết lập lịch khả dụng:

```text
LỊCH LÀM VIỆC

THỨ 2
☑ 06:00 – 10:00
☑ 17:00 – 21:00

THỨ 3
☑ 06:00 – 12:00

THỨ 4
☐ Nghỉ

[ Lưu thay đổi ]
```

Tôi khuyến nghị UI Calendar/Time Slot.

Nguyên tắc:

```text
Available Time
-
Existing Confirmed Booking
=
Bookable Time
```

PT không nên có khả năng tạo Working Hours chồng lên những Session đã được xác nhận mà không có cảnh báo.

---

# 12. PROFESSIONAL PROFILE

URL:

```text
/pt/profile
```

## Thông tin hiển thị

```text
👤 Nguyễn Văn A

[ Ảnh đại diện ]

Chuyên môn
[ Strength Training, Weight Loss ]

Kinh nghiệm
[ 5 năm ]

Chứng chỉ
[ NASM Certified ]

Phong cách huấn luyện
[____________________________]

Giới thiệu bản thân
[____________________________]

[ Lưu thay đổi ]
```

Nên chia thành:

### Thông tin cá nhân

* Avatar.
* Tên hiển thị.

### Thông tin chuyên môn

* Chứng chỉ.
* Kinh nghiệm.
* Chuyên môn.
* Phong cách huấn luyện.
* Tiểu sử.

---

# 13. THÔNG BÁO CHO PT

Bell Notification:

```text
🔔 3

• Booking mới từ Nguyễn Văn A
• Buổi tập lúc 10:00 sắp bắt đầu
• Gói PT của Trần Văn B còn 1 buổi
```

Thông báo nên liên kết trực tiếp:

```text
Notification
       ↓
Related Booking / Client
```

---

# 14. LUỒNG UI PT TỔNG THỂ

```text
PT LOGIN
   ↓
MY WORKSPACE
   │
   ├── Today's Schedule
   │       ↓
   │   Session Detail
   │       ↓
   │   Complete Session
   │
   ├── Pending Bookings
   │       ↓
   │   Confirm / Reject
   │
   ├── My Clients
   │       ↓
   │   Client Profile
   │   ├── PT Progress
   │   ├── Workout Logs
   │   └── Measurements
   │
   ├── My PT Packages
   │
   └── Professional Profile / Availability
```

---

# 15. ĐỀ XUẤT BỐ CỤC RESPONSIVE

PT có khả năng sử dụng điện thoại nhiều hơn Owner hoặc Manager vì đang di chuyển và trực tiếp tập cùng học viên.

Do đó, UI PT nên ưu tiên:

### Desktop

```text
Sidebar + Calendar + Client Workspace
```

### Mobile

```text
Bottom Navigation

🏠 Home
📅 Schedule
👥 Clients
🔔 Alerts
👤 Profile
```

Điều này giúp PT có thể nhanh chóng:

* Xem lịch.
* Xem thông tin học viên.
* Hoàn thành Session.
* Ghi Workout Log.

---

# TỔNG KẾT CẤU TRÚC UI PT

```text
PT PORTAL
│
├── Dashboard / My Workspace ⭐
│   ├── Today Sessions
│   ├── Next Session
│   ├── Pending Booking
│   └── Client Alerts
│
├── My Schedule ⭐
│   ├── Day / Week View
│   ├── Confirm Booking
│   ├── Reject Booking
│   └── Session Detail
│
├── My Clients ⭐
│   ├── Client List
│   ├── Package Progress
│   ├── Workout Log
│   └── Measurements
│
├── PT Sessions ⭐
│   └── Complete Session
│
├── My PT Packages
│   ├── Pricing
│   └── Approval Status
│
├── Availability
│
└── Professional Profile
```

## Nhận xét BA

Theo tài liệu nghiệp vụ hiện tại, **PT Portal nên được thiết kế như một công cụ quản lý công việc cá nhân**, không phải một hệ thống quản trị phòng gym thu nhỏ.

Ba màn hình cần đầu tư UX nhiều nhất là:

> **📅 My Schedule → 👥 My Clients → ⏱ Complete Session**

Vì đây là ba nơi trực tiếp tạo ra giá trị vận hành của PT và ảnh hưởng đến các Business Rule quan trọng như `PT Binding`, `Session Deduction Trigger`, `Active Membership Prerequisite` và `Client Data Privacy`.
