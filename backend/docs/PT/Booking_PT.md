## Dưới đây là **bản phân tích nghiệp vụ hoàn chỉnh cho module PT Booking & PT Session Management**. Tôi đã tổng hợp dựa trên toàn bộ các quyết định và đề xuất chúng ta đã phân tích, đồng thời viết theo hướng **có thể đưa trực tiếp cho AI/code** để triển khai Backend và Frontend.

---
## Ver1.0
# FITFLOW – PHÂN TÍCH NGHIỆP VỤ MODULE PT BOOKING & PT SESSION

## 1. Mục tiêu nghiệp vụ

Module **PT Booking** cho phép Member có gói PT hợp lệ chủ động đặt lịch tập với PT đã được chỉ định.

Hệ thống phải đảm bảo:

* Không xảy ra trùng lịch PT.
* Member không thể đặt nhiều buổi hơn số buổi PT đã mua.
* Chỉ trừ buổi PT khi có kết quả nghiệp vụ hợp lệ.
* Quản lý được khách hủy lịch hoặc không đến tập.
* Quản lý được trường hợp khách ngừng sử dụng gói PT.
* Lưu đầy đủ lịch sử để phục vụ vận hành và báo cáo.
* Phân quyền rõ ràng giữa Customer, PT và Branch Manager.

---

# 2. Các khái niệm nghiệp vụ

## 2.1 Membership

Là gói tập Gym chính của Member.

```text
Membership
├── Active
├── Expired
├── Cancelled
└── ...
```

Membership và PT Package là hai nghiệp vụ khác nhau.

---

## 2.2 PT Package

Là gói số buổi huấn luyện cá nhân mà Member mua.

Ví dụ:

```text
PT Package: 20 buổi
PT phụ trách: Nguyễn Văn A
Thời hạn: 90 ngày
```

Mỗi PT Package được gắn với **một PT cụ thể**.

```text
Customer
   ↓
Customer PT Package
   ↓
Assigned PT
```

---

## 2.3 PT Booking

Là lịch hẹn dự kiến giữa Member và PT.

Ví dụ:

```text
Member: Nguyễn Văn B
PT: Nguyễn Văn A

Ngày: 30/08/2026
Thời gian: 09:00 – 10:00

Status: CONFIRMED
```

PT Booking **không đồng nghĩa với một buổi PT đã hoàn thành**.

---

## 2.4 PT Session

Là buổi PT thực tế đã có kết quả nghiệp vụ.

Ví dụ:

```text
Booking #001
        ↓
Buổi tập diễn ra
        ↓
PT xác nhận COMPLETED
        ↓
1 PT Session được ghi nhận
        ↓
Trừ 1 buổi từ PT Package
```

### Nguyên tắc quan trọng

```text
Gym Attendance ≠ PT Session
```

Một Member có thể:

* Check-in Gym 20 lần.
* Nhưng chỉ tập PT 5 buổi.

Vì vậy **không được dùng Check-in Gym để đếm số buổi PT**.

---

# 3. Điều kiện Member được đặt lịch PT

Trước khi tạo Booking, hệ thống Backend phải kiểm tra:

### Điều kiện 1 – Có Membership Active

```text
Membership.status = ACTIVE
```

Nếu Membership hết hạn hoặc không còn hiệu lực:

```text
Không cho phép đặt lịch PT.
```

---

### Điều kiện 2 – Có PT Package hợp lệ

PT Package phải thỏa:

```text
status = ACTIVE
remaining_sessions > 0
current_date <= expires_at
```

---

### Điều kiện 3 – PT Package được gắn với PT

Member chỉ được đặt lịch với PT đã được gắn với PT Package.

```text
Customer PT Package
        ↓
PT A
        ↓
Customer chỉ đặt lịch với PT A
```

Không cho phép Customer tự chọn PT khác trong luồng Booking.

---

# 4. QUY TRÌNH ĐẶT LỊCH PT

## Bước 1 – Customer xem thông tin PT Package

Hiển thị:

```text
PT: Nguyễn Văn A

Tổng số buổi: 20
Đã tập: 5
Đã đặt lịch: 2
Có thể đặt thêm: 13
Hạn sử dụng: 30/11/2026
```

Công thức:

```text
available_to_book =
total_sessions
- completed_sessions
- reserved_sessions
```

Trong đó:

```text
reserved_sessions =
PENDING + CONFIRMED
```

---

## Bước 2 – Customer xem lịch PT

Customer chọn:

```text
Ngày
↓
Khung giờ
```

Hệ thống chỉ hiển thị những khung giờ:

* Thuộc giờ làm việc của PT.
* PT không có lịch khác.
* PT không Block thời gian.
* Không thuộc thời gian đã qua.

---

## Bước 3 – Customer gửi yêu cầu đặt lịch

Ví dụ:

```text
Ngày: 30/08/2026
Giờ: 09:00 – 10:00
Ghi chú: Tập phần thân trên
```

Backend kiểm tra lại toàn bộ điều kiện.

Nếu hợp lệ:

```text
Booking.status = PENDING
```

---

# 5. CƠ CHẾ CHỐNG OVERBOOKING

## 5.1 Chống trùng lịch PT

Các trạng thái được coi là **đang chiếm slot**:

```text
PENDING
CONFIRMED
```

Không được tạo Booking mới nếu thời gian bị overlap.

### Công thức kiểm tra overlap

```text
new_start < existing_end
AND
new_end > existing_start
```

Ví dụ lịch đã tồn tại:

```text
09:00 – 10:00
```

Không cho phép:

```text
08:30 – 09:30 ❌
09:00 – 10:00 ❌
09:30 – 10:30 ❌
```

Cho phép:

```text
08:00 – 09:00 ✅
10:00 – 11:00 ✅
```

### Rule bắt buộc

> Việc kiểm tra phải được thực hiện ở Backend, không được chỉ kiểm tra ở Frontend.

---

## 5.2 PENDING giữ chỗ tạm thời

Khi Customer tạo:

```text
Booking = PENDING
```

Slot đó được khóa tạm thời.

PT có thời gian để phản hồi.

Ví dụ:

```text
pending_response_duration = 12 giờ
```

Nếu hết thời gian:

```text
PENDING
   ↓
EXPIRED
```

Slot được giải phóng.

---

## 5.3 Chống Member đặt vượt quá số buổi

Ví dụ:

```text
Total: 10
Completed: 6
PENDING + CONFIRMED: 3
```

Khách chỉ còn:

```text
10 - 6 - 3 = 1 buổi
```

### Business Rule

```text
COMPLETED
+
PENDING
+
CONFIRMED
≤ TOTAL_SESSIONS
```

Các trạng thái `CANCELLED`, `DECLINED`, `EXPIRED` không chiếm buổi.

---

# 6. PT XỬ LÝ BOOKING

Khi có Booking mới, PT nhận Notification.

PT có thể:

### Xác nhận

```text
PENDING → CONFIRMED
```

### Từ chối

```text
PENDING → DECLINED
```

Khi từ chối nên yêu cầu:

```text
decline_reason
```

Sau khi `DECLINED`, slot và quyền đặt buổi được giải phóng.

---

# 7. HỦY LỊCH

Customer có thể hủy Booking trước giờ tập tùy theo chính sách.

## Ví dụ chính sách

```text
Free cancellation:
Trước giờ tập 4 tiếng.
```

Nếu hủy đúng thời hạn:

```text
CONFIRMED → CANCELLED
```

```text
Không trừ buổi.
Giải phóng slot.
```

Nếu hủy muộn:

Hệ thống áp dụng chính sách do Owner cấu hình.

Ví dụ:

```text
Late cancellation → Trừ 1 buổi
```

Hoặc:

```text
Late cancellation → Cần Manager xử lý
```

### Khuyến nghị MVP

Tôi đề xuất:

> Customer được hủy lịch theo thời hạn Owner cấu hình. Nếu quá thời hạn, Customer không thể tự hủy trên hệ thống mà cần liên hệ PT/Manager.

Điều này đơn giản và dễ kiểm soát.

---

# 8. BUỔI TẬP DIỄN RA

Booking đã xác nhận:

```text
CONFIRMED
```

Sau thời gian tập, PT cần xác nhận kết quả.

PT có các lựa chọn:

```text
1. COMPLETED
2. NO_SHOW
3. CANCELLED
```

---

# 9. HOÀN THÀNH BUỔI PT

Khi khách thực sự tập xong:

```text
CONFIRMED
    ↓
COMPLETED
```

Hệ thống thực hiện transaction:

```text
1. Update Booking = COMPLETED
2. Ghi nhận PT Session
3. Tăng completed_sessions
4. Giảm remaining_sessions
5. Ghi Audit Log
```

Ví dụ:

```text
Trước:
Completed = 5
Remaining = 15

Sau:
Completed = 6
Remaining = 14
```

---

# 10. CHỐNG TRỪ BUỔI 2 LẦN

Backend phải đảm bảo:

```text
Nếu Booking đã COMPLETED
→ Không cho phép COMPLETED lần nữa.
```

Khuyến nghị Database:

```text
UNIQUE(pt_booking_id)
```

cho PT Session.

---

# 11. KHÁCH ĐẶT LỊCH NHƯNG KHÔNG ĐẾN – NO SHOW

Đến thời điểm kết thúc lịch nhưng khách không đến.

PT có thể báo:

```text
Booking.status = NO_SHOW
```

PT bắt buộc nhập:

```text
reason / note
```

Ví dụ:

```text
Khách không đến và không thông báo.
```

Sau đó xử lý theo chính sách.

## Chính sách đề xuất

Owner có thể cấu hình:

```text
No-show Policy:

☑ Trừ buổi
☐ Không trừ buổi

Manager can override: YES
```

### Phân quyền

| Thao tác          | PT    | Manager |
| ----------------- | ----- | ------- |
| Báo No-show       | Có    | Có      |
| Ghi chú           | Có    | Có      |
| Xác nhận ngoại lệ | Không | Có      |
| Override kết quả  | Không | Có      |

### Khuyến nghị cho MVP

Nếu Owner đã cấu hình rõ:

```text
NO_SHOW → Tự động áp dụng chính sách
```

Manager chỉ can thiệp khi có tranh chấp hoặc ngoại lệ.

---

# 12. CUSTOMER KHÔNG MUỐN TẬP NỮA

Ví dụ:

```text
Mua: 20 buổi
Đã tập: 5
Còn: 15
```

Customer thông báo không muốn tiếp tục.

Do chính sách:

```text
Không hoàn tiền.
```

## Quy trình

### Bước 1 – PT ghi nhận yêu cầu

PT chọn:

> Request Package Closure

Nhập:

```text
Reason:
Customer không có nhu cầu tiếp tục tập.
```

Trạng thái:

```text
Closure Requested
```

---

### Bước 2 – Manager xử lý

Manager kiểm tra:

```text
Customer
PT Package
Số buổi đã dùng
Số buổi còn lại
Lý do
```

Manager có:

```text
[Giữ ACTIVE]
[Đóng gói]
[Đóng băng]
```

Nếu xác nhận đóng:

```text
PT Package.status = TERMINATED
```

Hệ thống:

```text
Không hoàn tiền.
Không xóa dữ liệu.
Không cho đặt lịch mới.
Không cho tạo Booking mới.
```

Các buổi còn lại được lưu lịch sử nhưng không còn sử dụng được.

---

# 13. ĐÓNG BĂNG PT PACKAGE (TÙY CHỌN)

Đây là nghiệp vụ mở rộng.

```text
ACTIVE
  ↓
ON_HOLD
```

Trong `ON_HOLD`:

* Không đặt lịch mới.
* Không thực hiện Session.
* Không mất dữ liệu.
* Không hoàn tiền.

Manager có thể:

```text
ON_HOLD → ACTIVE
```

Sau này có thể mở rộng chính sách:

```text
Pause có tính vào hạn gói hay không?
```

Đây là điểm chưa nên làm phức tạp trong MVP nếu chưa có yêu cầu thực tế.

---

# 14. VÒNG ĐỜI PT BOOKING

```text
                     ┌───────────┐
                     │  PENDING  │
                     └─────┬─────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
        CONFIRMED                    DECLINED
             │
      ┌──────┼─────────┐
      │      │         │
      ▼      ▼         ▼
COMPLETED  NO_SHOW  CANCELLED
```

Các trạng thái khác:

```text
PENDING → EXPIRED
PENDING → CANCELLED
CONFIRMED → CANCELLED
```

---

# 15. VÒNG ĐỜI PT PACKAGE

```text
ACTIVE
 │
 ├── ON_HOLD (optional)
 │       │
 │       └── ACTIVE
 │
 ├── EXPIRED
 │
 └── TERMINATED
```

Nguyên tắc:

> Không xóa PT Package đã phát sinh giao dịch.

---

# 16. BUSINESS RULES CHÍNH

## BR-PTB-001 — Active Membership

Member chỉ được đặt và thực hiện PT Booking khi Membership hợp lệ và `ACTIVE`.

---

## BR-PTB-002 — Active PT Package

PT Package phải:

```text
ACTIVE
Còn session
Chưa hết hạn
```

---

## BR-PTB-003 — PT Binding

Một PT Package được gắn với một PT cụ thể.

Customer không thể đặt lịch với PT khác.

---

## BR-PTB-004 — No PT Time Overlap

Một PT không được có hai Booking `PENDING` hoặc `CONFIRMED` bị chồng chéo thời gian.

---

## BR-PTB-005 — Pending Slot Reservation

Booking `PENDING` tạm thời chiếm slot cho đến khi:

```text
CONFIRMED
DECLINED
CANCELLED
EXPIRED
```

---

## BR-PTB-006 — Session Capacity

```text
COMPLETED + PENDING + CONFIRMED
≤ TOTAL_SESSIONS
```

---

## BR-PTB-007 — Session Deduction

`COMPLETED` mặc định trừ một buổi PT.

---

## BR-PTB-008 — No-show Policy

`NO_SHOW` được xử lý theo chính sách cấu hình.

Có thể trừ hoặc không trừ buổi.

---

## BR-PTB-009 — No Double Deduction

Một Booking chỉ được trừ Session tối đa một lần.

---

## BR-PTB-010 — Package Termination

PT Package bị `TERMINATED`:

* Không được hoàn tiền.
* Không được tạo Booking mới.
* Giữ nguyên toàn bộ lịch sử.
* Số buổi chưa sử dụng không được kích hoạt lại nếu không có nghiệp vụ đặc biệt.

---

# 17. PHÂN QUYỀN

## Customer

Có thể:

* Xem PT Package.
* Xem PT.
* Xem lịch PT.
* Đặt lịch.
* Hủy lịch trong thời gian cho phép.
* Xem lịch sử PT Session.

Không thể:

* Tự trừ/thêm Session.
* Xác nhận hoàn thành buổi tập.
* Đổi PT tùy ý.

---

## PT

Có thể:

* Xem lịch của mình.
* Xác nhận/từ chối Booking.
* Xác nhận hoàn thành Session.
* Báo Customer No-show.
* Gửi yêu cầu đóng PT Package khi Customer nghỉ.
* Xem lịch sử khách hàng thuộc PT của mình.

Không thể:

* Tự thay đổi số buổi PT.
* Tự ý hoàn tiền.
* Tự đóng PT Package mà không qua Manager.
* Xem dữ liệu PT Package của PT khác.

---

## Branch Manager

Có thể:

* Theo dõi Booking trong Branch.
* Xử lý ngoại lệ.
* Xử lý No-show tranh chấp.
* Override kết quả theo quyền.
* Phê duyệt đóng PT Package.
* Đóng băng/Mở lại PT Package.
* Xem thống kê hoạt động PT.

---

# 18. DATA MODEL GỢI Ý

## `customer_pt_packages`

```text
id
tenant_id
branch_id
customer_id
pt_id

package_id

total_sessions
completed_sessions
remaining_sessions

start_date
expires_at

status

created_at
updated_at
```

---

## `pt_bookings`

```text
id

tenant_id
branch_id

customer_pt_package_id

customer_id
pt_id

start_time
end_time

status

note

decline_reason
cancel_reason
no_show_reason

pending_expires_at

created_at
updated_at
```

---

## `pt_sessions`

```text
id

pt_booking_id
customer_pt_package_id

customer_id
pt_id

status

completed_at
completed_by

created_at
updated_at
```

### Ràng buộc:

```text
UNIQUE(pt_booking_id)
```

---

# 19. TRANSACTION KHI HOÀN THÀNH PT SESSION

AI/code cần đảm bảo toàn bộ thao tác được thực hiện trong một Database Transaction:

```text
BEGIN TRANSACTION

1. Lock PT Booking
2. Kiểm tra Booking chưa COMPLETED
3. Kiểm tra PT Package còn hiệu lực
4. Kiểm tra remaining_sessions > 0
5. Update Booking → COMPLETED
6. Create PT Session
7. completed_sessions + 1
8. remaining_sessions - 1
9. Create Audit Log

COMMIT
```

Nếu có lỗi:

```text
ROLLBACK
```

Điều này tránh lỗi:

* Trừ buổi nhưng không tạo Session.
* Tạo Session nhưng không trừ buổi.
* Hai request cùng lúc trừ hai lần.

---

# 20. KẾT LUẬN – LOGIC CỐT LÕI CHO AI IMPLEMENT

```text
CUSTOMER
    │
    ▼
Có Membership ACTIVE?
    │ YES
    ▼
Có PT Package ACTIVE?
    │ YES
    ▼
Còn Available Sessions?
    │ YES
    ▼
Chọn Slot của PT
    │
    ▼
Backend kiểm tra Overlap
    │ PASS
    ▼
CREATE BOOKING = PENDING
    │
    ▼
PT CONFIRM
    │
    ▼
CONFIRMED
    │
    ├───────────────┬──────────────────┐
    ▼               ▼                  ▼
COMPLETED        NO_SHOW           CANCELLED
    │               │                  │
Trừ 1 buổi     Theo Policy        Không trừ
    │               │
    ▼               ▼
PT SESSION       Trừ/Không trừ
```

### Quy tắc quan trọng nhất khi triển khai

> **Booking dùng để quản lý lịch. PT Session dùng để ghi nhận việc đã tập. PT Package dùng để quản lý quyền sử dụng số buổi. Attendance Gym không được dùng để đếm số buổi PT.**


