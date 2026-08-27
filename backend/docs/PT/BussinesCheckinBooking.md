Đây là một điểm **rất quan trọng trong thiết kế nghiệp vụ FitFlow**. Theo mô tả của bạn, hệ thống hiện tại đang có nguy cơ **trộn lẫn 3 khái niệm khác nhau**:

1. **Thời hạn sử dụng Membership (gói tập Gym)**.
2. **Số buổi/quyền sử dụng PT Package**.
3. **Lịch PT Booking và việc thực tế khách đến tập (Check-in).**

Nếu không tách rõ, sẽ dẫn đến lỗi như: **mua Gym 30 ngày + PT 20 buổi nhưng hệ thống tính thành 50 ngày**, hoặc **booking ngày mai nhưng PT hôm nay đã xác nhận COMPLETED**.

Dưới góc nhìn BA, tôi đề xuất thiết kế lại logic như sau.

---

# I. VẤN ĐỀ CỐT LÕI HIỆN TẠI

Ví dụ khách hàng mua:

### Membership

```text
Gói Gym: 30 ngày
Hiệu lực: 01/09 → 30/09
```

### PT Package

```text
PT: 20 buổi
Hiệu lực: theo thời hạn của PT Package
```

Hiện tại hệ thống đang hiểu:

```text
30 ngày Gym + 20 buổi PT = 50 ngày ❌
```

Logic này **không đúng về mặt nghiệp vụ**.

Vì:

> **Ngày tập Gym và số buổi PT là hai đơn vị quyền lợi hoàn toàn khác nhau.**

Một người có thể mua:

```text
Membership: 30 ngày
PT Package: 20 buổi
```

Nhưng không có nghĩa họ được tập Gym trong 50 ngày.

Ngược lại, khách có thể mua:

```text
Gym 30 ngày
PT 20 buổi
```

và hoàn thành 20 buổi PT trong 25 ngày. Khi Membership hết hạn ngày 30, quyền PT cần được xử lý theo chính sách riêng.

---

# II. PHÂN TÁCH 3 DOMAIN NGHIỆP VỤ

Tôi đề xuất coi đây là 3 nghiệp vụ độc lập nhưng có liên kết.

## 1. Membership – Quyền vào phòng tập

```text
Membership
├── start_date
├── end_date
├── status
└── branch_access
```

Trả lời câu hỏi:

> “Khách có quyền vào phòng Gym hay không?”

---

## 2. PT Package – Quyền sử dụng dịch vụ PT

```text
PT Package
├── total_sessions
├── remaining_sessions
├── pt_id
├── start_date
├── expiry_date
└── status
```

Trả lời câu hỏi:

> “Khách còn bao nhiêu buổi với PT này?”

---

## 3. PT Booking – Lịch hẹn cụ thể

```text
PT Booking
├── customer_id
├── pt_package_id
├── pt_id
├── scheduled_start
├── scheduled_end
└── status
```

Trả lời câu hỏi:

> “Khách và PT hẹn tập vào lúc nào?”

### Mối quan hệ chuẩn

```text
                 CUSTOMER
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      MEMBERSHIP            PT PACKAGE
          │                     │
          │                     ▼
          │                 PT BOOKING
          │                     │
          ▼                     ▼
       CHECK-IN         PT SESSION / COMPLETION
```

---

# III. PT PACKAGE KHÔNG ĐƯỢC CỘNG VÀO THỜI GIAN MEMBERSHIP

Đây là Business Rule rất quan trọng.

### BR-PT-REL-001 — Independent Entitlement

> Membership và PT Package phải được quản lý như hai quyền lợi độc lập. Số ngày Membership không được cộng dồn với số Session của PT Package.

Ví dụ:

| Dịch vụ     | Quyền lợi                |
| ----------- | ------------------------ |
| Gym 30 ngày | Tập Gym đến ngày hết hạn |
| PT 20 buổi  | Tối đa 20 Session với PT |

Không được tính:

```text
30 + 20 = 50 ngày ❌
```

---

# IV. MỐI LIÊN HỆ GIỮA PT BOOKING VÀ CHECK-IN

Đây là phần cần thiết kế kỹ nhất.

Giả sử:

```text
Booking:
Ngày mai 10:00 → 11:00

Customer: A
PT: B
```

Hôm nay PT vào hệ thống và bấm:

```text
Hoàn thành buổi tập
```

Hệ thống hiện tại cho phép:

```text
SCHEDULED → COMPLETED ❌
```

Đây là lỗi nghiệp vụ.

Vì `COMPLETED` có nghĩa:

> Buổi tập thực tế đã diễn ra và được xác nhận hoàn thành.

Nếu thời gian booking vẫn chưa đến thì không thể hoàn thành.

---

# V. TÁCH “LỊCH DỰ KIẾN” VÀ “THỰC TẾ”

Mỗi PT Booking nên có:

```text
scheduled_start_at
scheduled_end_at
```

Đây là:

> Thời gian dự kiến.

Khi thực tế diễn ra:

```text
actual_started_at
actual_completed_at
```

Đây là:

> Thời gian thực tế.

Ví dụ:

```text
Booking dự kiến:
10:00 → 11:00

Thực tế khách đến:
10:15

Thực tế hoàn thành:
11:10
```

Hệ thống vẫn có thể ghi nhận Session hợp lệ.

---

# VI. CHECK-IN CÓ PHẢI ĐIỀU KIỆN ĐỂ HOÀN THÀNH PT SESSION KHÔNG?

Ở đây tôi đề xuất **có liên kết, nhưng không đồng nhất tuyệt đối**.

## Gym Check-in trả lời:

> Khách có vào phòng Gym không?

## PT Completion trả lời:

> Khách có thực sự hoàn thành buổi tập với PT không?

Hai điều này liên quan nhưng không phải lúc nào cũng giống nhau.

Ví dụ:

### Case A – Khách check-in nhưng không tập PT

```text
08:00 Check-in Gym
09:00 PT Booking
Khách không gặp PT
```

Không thể tự động:

```text
PT Session = COMPLETED ❌
```

Check-in chỉ chứng minh khách có mặt ở phòng tập.

---

### Case B – Khách tập PT nhưng quên Check-in

Ví dụ:

```text
PT gặp khách
Khách đã tập đủ 1 giờ
Nhưng quên quét Face/QR
```

Nếu hệ thống bắt buộc Check-in thì PT không thể hoàn thành buổi tập, điều này có thể gây bất tiện.

Do đó, tôi **không đề xuất dùng Check-in như điều kiện tuyệt đối duy nhất**.

---

# VII. LOGIC TỐT NHẤT: CHECK-IN LÀ BẰNG CHỨNG HIỆN DIỆN

Tôi đề xuất 3 mức xác nhận.

## Level 1 – Booking Scheduled

```text
CONFIRMED
```

Chỉ là lịch hẹn.

Chưa trừ buổi.

---

## Level 2 – Customer Attendance Evidence

Khách đến Gym:

```text
CHECKED_IN
```

Hệ thống có thể liên kết:

```text
PT Booking
        ↓
Attendance Match
```

Nếu Check-in nằm gần thời gian Booking.

Ví dụ:

```text
Booking: 10:00

Check-in:
09:40
```

Hệ thống hiển thị:

```text
✓ Customer is present
```

Nhưng **chưa tự động hoàn thành PT Session**.

---

## Level 3 – PT xác nhận hoàn thành

Sau buổi tập:

```text
PT → Complete Session
```

Hệ thống:

```text
PT Booking → COMPLETED
PT Package → remaining_sessions - 1
```

Đây mới là thời điểm chính thức trừ buổi.

---

# VIII. NÊN KIỂM TRA CHECK-IN NHƯ THẾ NÀO?

Tôi đề xuất Backend kiểm tra thông tin khi PT bấm `Complete Session`.

Ví dụ:

```text
Booking:
10:00 → 11:00

Check-in:
09:30
```

Hệ thống hiển thị:

```text
✓ Customer checked in at 09:30
```

PT có thể hoàn thành bình thường.

---

Nếu khách chưa Check-in:

```text
⚠ Không tìm thấy Check-in hôm nay
```

Nhưng không nên khóa tuyệt đối ngay.

PT có thể chọn:

```text
[Xác nhận khách đã tập]
```

và bắt buộc nhập lý do:

```text
"Khách đã tập nhưng quên Check-in"
```

Lý do được lưu Audit Log.

Đây là cách cân bằng giữa:

* Kiểm soát nghiệp vụ.
* Tính thực tế vận hành.

---

# IX. QUY TẮC QUAN TRỌNG: KHÔNG ĐƯỢC HOÀN THÀNH TRƯỚC THỜI GIAN

Ví dụ hiện tại của bạn:

```text
Hôm nay: 01/09

Booking:
02/09 – 10:00

PT bấm COMPLETED ngày 01/09 ❌
```

Tôi đề xuất:

### BR-PT-REL-002 — Future Completion Restriction

> PT Booking không được chuyển sang `COMPLETED` trước thời điểm bắt đầu dự kiến của buổi tập.

Backend phải kiểm tra:

```text
now >= scheduled_start_at
```

Nếu chưa đến thời gian:

```text
Không thể xác nhận hoàn thành.
Buổi tập chưa đến thời gian diễn ra.
```

---

## Có nên cho phép xác nhận sớm một chút?

Thực tế khách và PT có thể tập sớm hơn lịch 10–15 phút.

Ví dụ:

```text
Booking: 10:00
Khách bắt đầu: 09:50
```

Tôi đề xuất Tenant có thể cấu hình:

```text
Early Check-in Window: 30 phút
```

Nhưng lưu ý:

> `Check-in` có thể sớm, còn `COMPLETED` vẫn chỉ nên được xác nhận khi buổi tập thực tế đã diễn ra.

Có thể cho phép PT nhập:

```text
actual_started_at = 09:50
actual_completed_at = 10:50
```

và kiểm tra tính hợp lý.

---

# X. PT BOOKING NÊN CÓ THÊM TRẠNG THÁI “IN_PROGRESS”

Tôi khuyến nghị thay lifecycle hiện tại thành:

```text
CONFIRMED
     │
     ▼
IN_PROGRESS
     │
     ▼
COMPLETED
```

Khi khách đến:

```text
Customer Check-in
      │
      ▼
Booking → READY / CHECK-IN DETECTED
```

PT bắt đầu buổi tập:

```text
PT → Start Session
      │
      ▼
IN_PROGRESS
```

Sau khi tập:

```text
PT → Complete Session
      │
      ▼
COMPLETED
      │
      ▼
Deduct 1 Session
```

Điều này giúp lịch sử rõ ràng hơn.

---

# XI. LUỒNG TÔI ĐỀ XUẤT CHO MỘT BUỔI PT HOÀN CHỈNH

```text
CUSTOMER / PT
      │
      ▼
CREATE BOOKING
      │
      ▼
CONFIRMED
      │
      │ đến ngày tập
      ▼
CUSTOMER CHECK-IN
      │
      ▼
ATTENDANCE DETECTED
      │
      ▼
PT START SESSION
      │
      ▼
IN_PROGRESS
      │
      ▼
PT CONFIRM COMPLETED
      │
      ▼
CREATE PT SESSION
      │
      ▼
DEDUCT 1 SESSION
```

---

# XII. TRƯỜNG HỢP KHÁCH KHÔNG CHECK-IN

Đây là Edge Case quan trọng.

```text
Booking: 10:00
Khách vào bằng cửa khác / quên Check-in
PT vẫn dạy khách
```

Luồng:

```text
PT → Complete Session
      │
      ▼
System: No Gym Check-in found
      │
      ▼
Require PT Confirmation + Reason
      │
      ▼
COMPLETED
      │
      ▼
Deduct Session
```

Ví dụ lý do:

```text
Khách quên quét QR
Lỗi Face Recognition
Staff đã xác nhận thủ công
Khách tập tại khu vực không yêu cầu Check-in
Khác
```

---

# XIII. MỐI LIÊN HỆ VỚI MEMBERSHIP HẾT HẠN

Đây là điểm bạn cần quyết định rõ trong Business Rule.

Ví dụ:

```text
Membership hết hạn: 30/09
PT Package còn: 5 buổi
PT Booking: 01/10
```

Theo phân tích trước đây, PT Session yêu cầu Membership ACTIVE. Nếu giữ rule này:

```text
01/10 → Không thể thực hiện PT Session
```

Khách phải gia hạn Gym.

Tôi cho rằng đây là logic phù hợp với mô hình Gym truyền thống, vì khách cần quyền sử dụng cơ sở vật chất để tập cùng PT.

### BR-PT-REL-003 — Membership Validity at Session Time

> Membership phải được kiểm tra tại thời điểm buổi PT thực tế diễn ra, không chỉ tại thời điểm tạo Booking.

Điều này rất quan trọng.

Ví dụ:

```text
Ngày 20: Membership ACTIVE
→ Đặt lịch ngày 05 tháng sau

Ngày 01 tháng sau:
Membership EXPIRED
```

Hệ thống phải:

```text
Chặn Start/Complete PT Session
```

Hoặc yêu cầu khách gia hạn Membership.

---

# XIV. BUSINESS RULE TỔNG HỢP TÔI ĐỀ XUẤT

### BR-PT-REL-001 — Independent Entitlement

Membership và PT Package là hai quyền lợi độc lập; không cộng số ngày và số Session với nhau.

---

### BR-PT-REL-002 — Valid Membership for PT Session

Membership phải còn hiệu lực tại thời điểm PT Session thực tế diễn ra.

---

### BR-PT-REL-003 — Booking Is Not Session

PT Booking chỉ là lịch hẹn, không phải bằng chứng khách đã tập và không tự động trừ Session.

---

### BR-PT-REL-004 — Check-in Is Attendance Evidence

Gym Check-in được xem là bằng chứng hỗ trợ xác nhận khách có mặt, nhưng không tự động làm PT Session hoàn thành.

---

### BR-PT-REL-005 — PT Completion Authority

Chỉ hành động xác nhận hợp lệ từ PT/người có quyền mới có thể chuyển PT Booking thành `COMPLETED`.

---

### BR-PT-REL-006 — No Future Completion

Không được xác nhận `COMPLETED` trước thời điểm buổi tập có thể diễn ra hợp lý theo lịch booking.

---

### BR-PT-REL-007 — Deduct on Completion Only

Chỉ khi PT Booking được xác nhận `COMPLETED`, hệ thống mới trừ một Session.

---

### BR-PT-REL-008 — Check-in Missing Exception

Nếu không có Gym Check-in, PT vẫn có thể xác nhận Session trong trường hợp ngoại lệ nhưng bắt buộc lưu lý do và Audit Log.

---

# KẾT LUẬN QUAN TRỌNG NHẤT

Tôi đề xuất bạn thay đổi tư duy hệ thống thành:

> **Membership quản lý quyền vào Gym. PT Package quản lý quyền mua số buổi với PT. PT Booking quản lý lịch hẹn. Check-in quản lý sự hiện diện tại Gym. PT Session quản lý việc buổi PT thực sự đã hoàn thành.**

```text
MEMBERSHIP
   ↓
Có quyền vào Gym

PT PACKAGE
   ↓
Có quyền sử dụng X buổi

PT BOOKING
   ↓
Hẹn lịch buổi tập

CHECK-IN
   ↓
Xác nhận/hỗ trợ chứng minh khách có mặt

PT CONFIRMATION
   ↓
Xác nhận buổi tập thực tế hoàn thành

PT SESSION
   ↓
Trừ 1 buổi
```

**Điểm cần sửa ngay trong hệ thống hiện tại** là: **không được tính tổng “30 ngày Membership + 20 buổi PT = 50 ngày”** và **không được cho phép PT hoàn thành một Booking khi buổi tập chưa đến thời gian diễn ra**. Đây là hai lỗi nghiệp vụ có thể làm sai số liệu quyền lợi và doanh thu/số buổi của khách hàng nếu đưa vào vận hành thực tế.
