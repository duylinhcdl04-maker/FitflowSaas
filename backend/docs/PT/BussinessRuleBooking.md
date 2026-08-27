Dưới đây là **bộ Business Rules (BR) được tổng hợp và chuẩn hóa riêng cho module PT Booking**, rút ra từ toàn bộ phân tích và các quyết định chúng ta đã thống nhất. Tôi sắp xếp theo nhóm để bạn có thể đưa trực tiếp cho AI triển khai.

# FITFLOW – BUSINESS RULES: PT BOOKING & PT SESSION

## A. Điều kiện tạo PT Booking

### BR-PTB-001 — Active Membership Required

Member chỉ được phép đặt hoặc thực hiện PT Booking khi có **Membership đang ACTIVE** theo điều kiện sử dụng dịch vụ của phòng gym.

Nếu Membership không còn hiệu lực, hệ thống không cho phép tạo Booking mới.

---

### BR-PTB-002 — Active PT Package Required

PT Package phải đáp ứng đồng thời:

* `status = ACTIVE`
* Còn quyền sử dụng Session.
* Chưa hết hạn sử dụng.

Nếu PT Package `EXPIRED`, `TERMINATED` hoặc `ON_HOLD` thì không thể tạo Booking mới.

---

### BR-PTB-003 — PT Binding

Mỗi Customer PT Package được gắn với **một PT cụ thể**.

Member chỉ được đặt lịch với PT đã được gán cho PT Package đó.

Không cho phép:

```text
Customer PT Package → PT A
Booking → PT B ❌
```

---

### BR-PTB-004 — Valid Client Relationship

PT chỉ được phép tạo Booking cho Member đang có **PT Package hợp lệ được gắn với chính PT đó**.

PT không được tạo lịch cho khách hàng thuộc PT khác.

---

# B. Quy tắc tạo Booking và nguồn tạo

### BR-PTB-005 — Booking Source

Hệ thống phải lưu nguồn tạo Booking:

```text
CUSTOMER
PT
```

Khuyến nghị lưu thêm:

```text
created_by
```

để phục vụ Audit Log.

---

### BR-PTB-006 — Customer Creates Booking

Khi Customer tự tạo Booking, trạng thái ban đầu là:

```text
PENDING
```

Booking sẽ chờ PT xử lý.

---

### BR-PTB-007 — PT Creates Booking

Khi PT trực tiếp tạo Booking cho khách hàng của mình, Booking được xem là PT đã xác nhận lịch.

Trạng thái mặc định:

```text
CONFIRMED
```

Customer nhận được thông báo về lịch tập mới.

---

# C. Quy tắc chống Overbooking

### BR-PTB-008 — PT Time Conflict

Một PT không được có nhiều Booking ở trạng thái chiếm lịch có thời gian bị chồng chéo.

Các trạng thái chiếm lịch:

```text
PENDING
CONFIRMED
```

Điều kiện overlap:

```text
new_start_time < existing_end_time
AND
new_end_time > existing_start_time
```

Ví dụ:

```text
Existing: 09:00 – 10:00

08:30 – 09:30 ❌
09:00 – 10:00 ❌
09:30 – 10:30 ❌
08:00 – 09:00 ✅
10:00 – 11:00 ✅
```

Quy tắc này **bắt buộc kiểm tra ở Backend**, không chỉ ở Frontend.

---

### BR-PTB-009 — Customer Time Conflict

Một Customer không được có nhiều PT Booking `PENDING` hoặc `CONFIRMED` bị chồng chéo thời gian.

Điều này giúp tránh trường hợp một khách đồng thời được xếp lịch với hai PT khác nhau.

---

### BR-PTB-010 — Package Session Capacity

Tổng số Session đã sử dụng và số Booking đang giữ chỗ không được vượt quá số Session của PT Package.

Công thức:

```text
COMPLETED
+
PENDING
+
CONFIRMED
≤ TOTAL_SESSIONS
```

Booking ở trạng thái `CANCELLED`, `DECLINED`, `EXPIRED` không giữ quyền sử dụng Session.

---

### BR-PTB-011 — Available Sessions

Số buổi khách còn có thể tiếp tục đặt được tính:

```text
Available To Book =
Total Sessions
- Completed Sessions
- Reserved Sessions
```

Trong đó:

```text
Reserved Sessions =
PENDING + CONFIRMED
```

---

# D. Quản lý lịch và Calendar

### BR-PTB-012 — PT Working Hours

PT Booking chỉ được tạo trong khung giờ làm việc (`PT Availability`) đã được PT hoặc hệ thống thiết lập.

---

### BR-PTB-013 — Blocked Time

Không được tạo Booking trong khoảng thời gian PT đã `BLOCKED`.

Ví dụ:

```text
PT Block: 08:00 – 12:00
→ Customer/PT không thể tạo Booking trong khoảng này.
```

---

### BR-PTB-014 — Calendar Source of Truth

Calendar chỉ hiển thị trạng thái lịch dựa trên dữ liệu Booking và Availability thực tế.

* `PENDING` → Đang chờ xác nhận, nhưng vẫn giữ chỗ.
* `CONFIRMED` → Lịch đã xác nhận.
* `COMPLETED` → Buổi đã hoàn thành.
* `NO_SHOW` → Khách không đến.
* `CANCELLED` → Lịch đã hủy.
* `DECLINED` → PT từ chối.
* `EXPIRED` → Hết thời gian chờ xác nhận.

---

# E. Xử lý Pending Booking

### BR-PTB-015 — Pending Slot Reservation

Booking ở trạng thái `PENDING` được xem là đang giữ slot của PT và giữ quyền sử dụng Session của khách.

---

### BR-PTB-016 — Pending Expiration

`PENDING` phải có thời hạn phản hồi:

```text
pending_expires_at
```

Nếu PT không xử lý trước thời hạn:

```text
PENDING → EXPIRED
```

Sau đó:

* Slot của PT được giải phóng.
* Session Reservation được giải phóng.

---

### BR-PTB-017 — PT Response

PT có thể xử lý `PENDING` bằng:

```text
CONFIRMED
DECLINED
```

Nếu `DECLINED`, nên lưu:

```text
decline_reason
```

---

# F. Hủy và đổi lịch

### BR-PTB-018 — Customer Cancellation

Customer chỉ được tự hủy Booking trong thời hạn cho phép theo chính sách do Owner/Tenant cấu hình.

Ví dụ:

```text
Được hủy miễn phí trước 4 giờ.
```

Nếu quá thời hạn:

* Customer không thể tự hủy.
* Có thể liên hệ PT hoặc Manager xử lý ngoại lệ.

---

### BR-PTB-019 — Cancellation Release

Khi Booking chuyển sang:

```text
CANCELLED
DECLINED
EXPIRED
```

Hệ thống phải:

* Giải phóng slot của PT.
* Giải phóng Session Reservation.
* Không tính là buổi đã tập.

---

### BR-PTB-020 — Reschedule

Khi đổi lịch, Booking phải được kiểm tra lại:

* PT có trống không.
* Customer có bị trùng lịch không.
* Có thuộc Working Hours không.
* Có nằm trong Blocked Time không.

Mọi lần đổi lịch nên lưu Audit Information:

```text
original_start_time
original_end_time

new_start_time
new_end_time

rescheduled_by
reschedule_reason
rescheduled_at
```

---

# G. Hoàn thành buổi tập và trừ Session

### BR-PTB-021 — Session Completion

Một buổi PT chỉ được tính là đã tập khi Booking được xác nhận:

```text
COMPLETED
```

Không sử dụng số lượt Gym Check-in để đếm số buổi PT.

```text
Gym Attendance ≠ PT Session
```

---

### BR-PTB-022 — Deduction on Completion

Khi Booking chuyển sang `COMPLETED`, hệ thống:

1. Tạo hoặc xác nhận PT Session.
2. Tăng `completed_sessions`.
3. Giảm `remaining_sessions`.
4. Ghi Audit Log.

Việc này phải được thực hiện trong một Database Transaction.

---

### BR-PTB-023 — No Double Deduction

Mỗi PT Booking chỉ được trừ tối đa một Session.

Một Booking đã `COMPLETED` không được phép hoàn thành lại.

Khuyến nghị Database Constraint:

```text
UNIQUE(pt_booking_id)
```

trong bảng PT Session.

---

# H. Khách không đến tập – No-show

### BR-PTB-024 — No-show Recording

PT hoặc người có thẩm quyền có thể ghi nhận Booking là:

```text
NO_SHOW
```

Khi thực hiện, cần lưu:

```text
no_show_reason
recorded_by
recorded_at
```

---

### BR-PTB-025 — No-show Policy

Việc `NO_SHOW` có bị trừ Session hay không phụ thuộc vào chính sách của Tenant/Owner.

Ví dụ:

```text
NO_SHOW → Deduct Session
```

hoặc:

```text
NO_SHOW → Do Not Deduct
```

Nếu cần xử lý tranh chấp, Branch Manager có quyền xử lý ngoại lệ theo phân quyền.

---

### BR-PTB-026 — No-show Override

PT có thể báo No-show nhưng không nên tự ý thay đổi chính sách hoặc tự quyết định các trường hợp ngoại lệ.

Branch Manager có quyền:

* Miễn trừ Session.
* Áp dụng chính sách No-show.
* Xử lý tranh chấp theo quyền được phân công.

---

# I. Quyền quản lý PT Package khi khách nghỉ

### BR-PTB-027 — PT Package Closure Request

Khi Customer không còn nhu cầu tập PT, PT có thể ghi nhận và gửi yêu cầu đóng PT Package.

PT không được tự ý xóa PT Package.

---

### BR-PTB-028 — PT Package Termination

Branch Manager hoặc người có quyền có thể chuyển PT Package sang:

```text
TERMINATED
```

Khi đó:

* Không hoàn tiền.
* Không được tạo Booking mới.
* Không được sử dụng Session còn lại.
* Toàn bộ lịch sử vẫn được giữ lại.
* PT Package không bị xóa vật lý khỏi hệ thống.

---

### BR-PTB-029 — PT Package On Hold

Nếu Tenant hỗ trợ chức năng đóng băng:

```text
ACTIVE → ON_HOLD
```

Trong trạng thái `ON_HOLD`:

* Không được đặt lịch mới.
* Không được thực hiện PT Session mới.
* Dữ liệu và số Session còn lại vẫn được giữ nguyên.

Việc mở lại:

```text
ON_HOLD → ACTIVE
```

phải được thực hiện bởi người có quyền.

---

# J. Trạng thái và chuyển đổi trạng thái

## Booking Lifecycle

```text
PENDING
├── CONFIRMED
├── DECLINED
├── CANCELLED
└── EXPIRED

CONFIRMED
├── COMPLETED
├── NO_SHOW
└── CANCELLED
```

### Không cho phép chuyển ngược trạng thái cuối cùng nếu không có nghiệp vụ Override đặc biệt.

Các trạng thái cuối:

```text
COMPLETED
NO_SHOW
CANCELLED
DECLINED
EXPIRED
```

---

# K. Quy tắc về dữ liệu và đồng thời

### BR-PTB-030 — Backend Validation

Mọi Business Rule liên quan đến:

* Overlap.
* Session Capacity.
* Package Status.
* PT Ownership.

bắt buộc phải được kiểm tra ở Backend.

Frontend chỉ hỗ trợ UX, không được coi là nguồn kiểm tra nghiệp vụ chính.

---

### BR-PTB-031 — Concurrent Booking Protection

Nếu hai yêu cầu đặt lịch được gửi gần như cùng lúc cho cùng một PT hoặc cùng một Session cuối cùng, hệ thống phải đảm bảo chỉ một giao dịch hợp lệ được tạo.

Khuyến nghị:

* Database Transaction.
* Row Lock/Optimistic Lock phù hợp.
* Kiểm tra lại điều kiện trước khi Commit.

---

# TÓM TẮT QUY TẮC CỐT LÕI

```text
1. Member phải có quyền PT hợp lệ.
2. PT Package luôn gắn với một PT.
3. Customer và PT đều có thể tạo Booking.
4. Customer tạo → PENDING.
5. PT tạo → CONFIRMED.
6. PENDING và CONFIRMED đều giữ Slot và giữ Session.
7. Không được trùng lịch PT.
8. Không được trùng lịch Customer.
9. Không được đặt vượt số buổi đã mua.
10. COMPLETED mới là buổi tập chính thức.
11. Mỗi Booking chỉ trừ tối đa một Session.
12. NO_SHOW xử lý theo chính sách Tenant.
13. Khách nghỉ hẳn → TERMINATED, không hoàn tiền và không xóa dữ liệu.
14. Calendar là công cụ trực quan hóa toàn bộ Availability và Booking.
```

