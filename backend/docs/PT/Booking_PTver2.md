Rất hợp lý. Tôi thậm chí cho rằng đây là **chức năng nên có trong MVP**, vì trên thực tế nhiều khách hàng không chủ động đặt lịch trên app; họ thường nhắn tin, gọi điện hoặc trao đổi trực tiếp với PT. PT cần có quyền chủ động sắp lịch cho học viên của mình.

Tuy nhiên, khi bổ sung chức năng này, chúng ta cần thiết kế lại module **PT Booking** để hỗ trợ **2 nguồn tạo lịch**, nhưng vẫn dùng chung một nghiệp vụ lõi để tránh sai lệch.

# PHÂN TÍCH BỔ SUNG – PT CHỦ ĐỘNG ĐẶT LỊCH CHO KHÁCH HÀNG

## 1. Mục tiêu nghiệp vụ

Hệ thống cần cho phép:

* Customer tự đặt lịch với PT.
* PT chủ động tạo lịch tập cho Customer thuộc danh sách học viên của mình.
* Cả hai cách đều sử dụng chung cơ chế chống trùng lịch.
* PT có một màn hình **thời khóa biểu/lịch làm việc** để theo dõi:

  * Lịch trống.
  * Lịch đã được đặt.
  * Khách hàng trong từng buổi.
  * Trạng thái từng buổi tập.

---

# 2. Phân biệt nguồn tạo PT Booking

Bổ sung trường:

```text
booking_source
```

Các giá trị:

```text
CUSTOMER
PT
```

Có thể mở rộng sau:

```text
STAFF
BRANCH_MANAGER
SYSTEM
```

Ví dụ:

| Booking               | Người tạo | Source   |
| --------------------- | --------- | -------- |
| Khách tự đặt          | Customer  | CUSTOMER |
| PT sắp lịch trực tiếp | PT        | PT       |
| Nhân viên hỗ trợ đặt  | Staff     | STAFF    |

**Nhưng dù ai tạo lịch thì tất cả đều phải đi qua cùng một cơ chế kiểm tra nghiệp vụ.**

---

# 3. PT đặt lịch cho khách như thế nào?

## Luồng nghiệp vụ

PT vào:

```text
My Schedule
   ↓
Chọn ngày
   ↓
Chọn khung giờ trống
   ↓
Chọn học viên
   ↓
Tạo lịch tập
```

Ví dụ:

```text
Ngày: 30/08/2026

PT: Nguyễn Văn A

09:00 – 10:00

Customer: Trần Văn B

PT Package: Gói 20 buổi
```

Backend kiểm tra:

```text
1. Customer có thuộc PT này không?
2. PT Package có ACTIVE không?
3. Gói còn hạn không?
4. Có còn quyền đặt buổi không?
5. PT có bị trùng lịch không?
6. Customer có bị trùng lịch PT khác không?
```

Nếu tất cả hợp lệ:

```text
PT Booking được tạo.
```

---

# 4. Trạng thái Booking khi PT tự đặt

Ở đây có một điểm cần chốt.

Khi Customer tự đặt:

```text
PENDING
↓
PT CONFIRMED
```

Nhưng khi **PT chính là người tạo lịch**, thì không cần PT tự xác nhận lại.

Tôi đề xuất:

```text
PT tạo Booking
↓
CONFIRMED
```

Lý do:

> PT đã chủ động lựa chọn thời gian và khách hàng, vì vậy việc tạo lịch đã được xem là xác nhận từ phía PT.

### Nhưng có nên yêu cầu Customer xác nhận?

Tôi đề xuất MVP **không bắt buộc**, tránh làm quy trình quá phức tạp.

Thay vào đó:

```text
PT tạo lịch
↓
CONFIRMED
↓
Gửi Notification cho Customer
```

Customer nhìn thấy:

> “PT Nguyễn Văn A đã đặt lịch tập cho bạn vào 09:00 ngày 30/08.”

Nếu sau này cần nâng cấp, có thể thêm:

```text
PT_BOOKED_PENDING_CUSTOMER_CONFIRMATION
```

Nhưng hiện tại chưa cần.

---

# 5. QUAN TRỌNG: PT chỉ được đặt cho khách của mình

Business Rule:

```text
BR-PTB-011 — PT Client Restriction
```

> PT chỉ được tạo PT Booking cho Customer đang có PT Package ACTIVE và được gắn với chính PT đó.

Không cho phép:

```text
PT A đặt lịch cho khách của PT B ❌
```

Trừ khi sau này có nghiệp vụ chuyển PT.

---

# 6. PT SCHEDULE – THỜI KHÓA BIỂU TRUNG TÂM

Tôi đề xuất màn hình quan trọng nhất của PT là:

# 🗓️ LỊCH TẬP CỦA TÔI – MY SCHEDULE

Thiết kế theo phong cách:

* Microsoft Teams / Outlook Calendar.
* Google Calendar.
* Dễ nhìn trên màn hình lớn.
* Có thể sử dụng tốt trên mobile.

---

## 6.1 Các chế độ xem

PT có thể chuyển:

```text
[Ngày] [Tuần] [Tháng]
```

Khuyến nghị:

* **Ngày:** Quản lý chi tiết từng giờ.
* **Tuần:** Màn hình chính nên dùng thường xuyên nhất.
* **Tháng:** Xem tổng quan.

---

# 7. GIAO DIỆN THỜI KHÓA BIỂU GỢI Ý

Ví dụ Week View:

```text
                    TUẦN 25/08 - 31/08

        Thứ 2    Thứ 3    Thứ 4    Thứ 5    Thứ 6

07:00    Trống    Trống    Trống    Trống    Trống

08:00    [Trần A]          [Lê B]
         Confirmed         Confirmed

09:00             [Nguyễn C]
                  Completed

10:00    Trống    Trống    Trống    Trống    Trống

11:00    [Phạm D]
         Confirmed
```

Mỗi ô lịch đã đặt hiển thị:

```text
Tên khách hàng
Thời gian
Trạng thái
Số buổi còn lại
```

Ví dụ:

```text
09:00 - 10:00
Nguyễn Văn A
Gói PT: còn 12 buổi
● CONFIRMED
```

---

# 8. TRẠNG THÁI HIỂN THỊ TRÊN CALENDAR

Không nên chỉ hiển thị “Có lịch” hoặc “Trống”.

PT cần phân biệt:

```text
PENDING
CONFIRMED
COMPLETED
NO_SHOW
CANCELLED
```

Có thể hiển thị bằng:

* Badge.
* Icon.
* Nhãn trạng thái.

Không nhất thiết chỉ phụ thuộc vào màu sắc, vì màu sắc một mình có thể gây khó nhận biết.

---

# 9. LỊCH TRỐNG ĐƯỢC XÁC ĐỊNH NHƯ THẾ NÀO?

PT có:

```text
Available Working Hours
```

Ví dụ:

```text
Thứ 2 – Thứ 6

06:00 – 11:00
14:00 – 21:00
```

Hệ thống tạo các Slot.

Ví dụ duration:

```text
60 phút/buổi
```

Sẽ tạo:

```text
06:00 – 07:00
07:00 – 08:00
08:00 – 09:00
...
```

Slot được coi là **Available** khi:

```text
Thuộc Working Hours
AND không bị Block
AND không có PENDING Booking
AND không có CONFIRMED Booking
```

---

# 10. PT CÓ THỂ BLOCK LỊCH

Tôi rất khuyến nghị thêm chức năng này.

Ví dụ PT:

* Nghỉ phép.
* Đi công tác.
* Có việc riêng.

PT chọn:

```text
Block Time
```

Ví dụ:

```text
30/08
08:00 – 12:00

Reason:
Việc cá nhân
```

Calendar hiển thị:

```text
BLOCKED
```

Customer không thể đặt lịch vào khoảng này.

### Business Rule

```text
BR-PTB-012 — PT Availability
```

> PT không được phép tạo hoặc xác nhận Booking ngoài Working Hours hoặc trong khoảng thời gian đã Block, trừ khi Owner/Manager có quyền override trong tương lai.

---

# 11. PHÁT HIỆN TRÙNG LỊCH CỦA CUSTOMER

Tôi đề xuất thêm kiểm tra:

Ví dụ Customer A:

```text
PT A: 09:00 – 10:00
```

Không được đặt tiếp:

```text
PT B: 09:00 – 10:00
```

Điều kiện:

```text
Một Customer không thể có hai PT Booking
PENDING hoặc CONFIRMED
bị overlap.
```

Đây là một lớp bảo vệ quan trọng nếu sau này hệ thống cho phép khách có nhiều PT Package.

---

# 12. KHI PT KÉO THẢ LỊCH TRÊN CALENDAR

Đây là tính năng UX rất hay.

PT có thể:

```text
Booking 09:00
↓ kéo sang
10:00
```

Hệ thống phải kiểm tra lại:

```text
1. Khung giờ mới có trống?
2. Có nằm trong Working Hours?
3. Có bị Block?
4. Customer có bị trùng lịch?
```

Nếu hợp lệ:

```text
Update Booking
```

Nếu không:

```text
Không cho phép di chuyển.
Hiển thị lý do.
```

---

# 13. CÁC THAO TÁC TRỰC TIẾP TRÊN CALENDAR

Khi click một Booking:

```text
┌─────────────────────────┐
│ Nguyễn Văn A            │
│ 09:00 - 10:00           │
│ Còn 12 buổi PT          │
│                         │
│ [Xem chi tiết]          │
│ [Đổi lịch]              │
│ [Hủy lịch]              │
│ [Hoàn thành buổi]       │
└─────────────────────────┘
```

Tùy trạng thái mà hiển thị action phù hợp.

Ví dụ:

### PENDING

```text
[Xác nhận]
[Từ chối]
[Đổi lịch]
```

### CONFIRMED

```text
[Hoàn thành]
[Khách không đến]
[Đổi lịch]
[Hủy]
```

### COMPLETED

```text
[Xem Session]
```

Không được sửa trực tiếp.

---

# 14. RESCHEDULE – ĐỔI LỊCH

Đây là chức năng nên bổ sung ngay từ đầu.

Thay vì:

```text
Hủy Booking cũ
↓
Tạo Booking mới
```

Tôi đề xuất:

```text
Reschedule
```

Hệ thống lưu:

```text
original_start_time
original_end_time

new_start_time
new_end_time

rescheduled_by
reschedule_reason
rescheduled_at
```

Lợi ích:

* Có lịch sử thay đổi.
* Không làm mất lịch sử booking.
* Dễ xử lý tranh chấp.

---

# 15. THÔNG BÁO

## Khi Customer tự đặt

PT nhận:

```text
🔔 Bạn có một yêu cầu đặt lịch mới.
```

---

## Khi PT xác nhận

Customer nhận:

```text
🔔 Lịch tập của bạn đã được PT xác nhận.
```

---

## Khi PT tự tạo lịch

Customer nhận:

```text
🔔 PT đã đặt lịch tập cho bạn.
Thời gian: 09:00 ngày 30/08.
```

---

## Reminder

Tôi đề xuất:

```text
24 giờ trước lịch
1 giờ trước lịch
```

Nếu hệ thống chưa có Push Notification, MVP có thể hiển thị thông báo nội bộ trước.

---

# 16. BỔ SUNG DATA MODEL

Trong `pt_bookings`:

```text
booking_source ENUM(
  CUSTOMER,
  PT
)

created_by
```

Có thể bổ sung:

```text
rescheduled_at
rescheduled_by
reschedule_reason
```

Để hỗ trợ lịch:

## `pt_availability`

```text
id
pt_id

day_of_week

start_time
end_time

is_active
```

Ví dụ:

```text
Monday
06:00 – 11:00
14:00 – 21:00
```

## `pt_time_blocks`

```text
id

pt_id

start_time
end_time

reason

created_by
```

---

# 17. BUSINESS RULE BỔ SUNG

### BR-PTB-011 — PT Creates Booking

> PT được phép tạo Booking trực tiếp cho Customer thuộc danh sách học viên hợp lệ của mình.

Booking do PT tạo mặc định:

```text
CONFIRMED
```

---

### BR-PTB-012 — Working Hours

> Booking chỉ được tạo trong giờ làm việc của PT, trừ trường hợp có quyền override được cấu hình rõ.

---

### BR-PTB-013 — Time Block

> Thời gian PT Block không được phép tạo Booking.

---

### BR-PTB-014 — Customer Schedule Conflict

> Một Customer không được có hai PT Booking `PENDING` hoặc `CONFIRMED` có thời gian chồng chéo.

---

### BR-PTB-015 — Reschedule

> Mọi thay đổi thời gian Booking phải được kiểm tra lại toàn bộ quy tắc chống trùng lịch và lưu lịch sử thay đổi.

---

# 18. LUỒNG TỔNG THỂ SAU KHI BỔ SUNG

```text
                    PT SCHEDULE
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
 CUSTOMER TỰ ĐẶT                    PT ĐẶT CHO KHÁCH
         │                               │
         ▼                               ▼
      PENDING                        CONFIRMED
         │                               │
         ▼                               │
   PT CONFIRM                             │
         │                               │
         └───────────────┬───────────────┘
                         ▼
                    CONFIRMED
                         │
                         ▼
                  BUỔI TẬP DIỄN RA
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
        COMPLETED      NO_SHOW    CANCELLED
             │
             ▼
        PT SESSION
             │
             ▼
         TRỪ 1 BUỔI
```

---

## KẾT LUẬN

Sau khi bổ sung chức năng này, tôi đề xuất coi **PT Schedule/Calendar là trung tâm vận hành chính của PT**.

PT không nên phải vào nhiều màn hình để quản lý lịch. Chỉ cần mở **My Schedule**, PT có thể:

* Nhìn thấy toàn bộ lịch tập.
* Biết các slot còn trống.
* Chủ động đặt lịch cho học viên.
* Xác nhận yêu cầu của khách.
* Đổi lịch hoặc hủy lịch.
* Block thời gian bận.
* Xác nhận khách đã tập.
* Xử lý khách không đến.

Đây là mô hình khá sát với cách PT vận hành ngoài thực tế và cũng rất phù hợp với kiến trúc PT Booking mà chúng ta đã chốt trước đó.
