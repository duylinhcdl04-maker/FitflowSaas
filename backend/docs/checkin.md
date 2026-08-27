chức năng này sẽ được hiển thị và thay đổi logic áp dụng cho những dashboard có hiển thị các chức năng này
Chính xác. Dưới đây là **bản phân tích Attendance & Check-in Statistics hoàn chỉnh đã được cập nhật**, thay thế bản trước và **bổ sung đầy đủ logic Auto Checkout theo giờ đóng cửa của Branch**. Bạn có thể đưa nguyên văn cho AI để review và triển khai theo kiến trúc hiện tại.

---

# FITFLOW — ATTENDANCE, CHECK-IN STATISTICS & AUTO CHECK-OUT SPECIFICATION

## 1. Mục tiêu

Hệ thống FitFlow cần quản lý chính xác việc khách vào/ra phòng tập và cung cấp các số liệu thống kê rõ ràng cho Dashboard.

Hệ thống phải phân biệt giữa:

1. **Số khách thực tế đã đến phòng tập**.
2. **Tổng số lượt Check-in**.
3. **Số khách đang có mặt trong phòng tập**.
4. **Lượt Check-out thủ công/tự động**.
5. **Check-out tự động theo thời lượng và giờ đóng cửa Branch**.

Không được dùng một chỉ số duy nhất `Check-in Count` để biểu diễn cả số người và số lượt.

---

# 2. Các KPI chính

## 2.1. Daily Unique Visitors — Khách đã đến hôm nay

### Định nghĩa

Đếm số **Member và Guest duy nhất** có ít nhất một Check-in hợp lệ trong ngày.

Ví dụ:

```text
Member A:
08:00 → Check-in
10:00 → Check-out
15:00 → Check-in

Member B:
09:00 → Check-in

Daily Unique Visitors = 2 người
```

A chỉ được tính một lần trong ngày mặc dù có 2 lượt vào.

### Logic

```text
COUNT(DISTINCT visitor_id)
WHERE check_in_at thuộc ngày đang xem
AND attendance là Check-in hợp lệ
```

---

## 2.2. Total Check-in Events — Tổng lượt vào

### Định nghĩa

Đếm tất cả các lượt Check-in hợp lệ.

```text
Member A → 2 lượt
Member B → 1 lượt

Total Check-in Events = 3 lượt
```

### Logic

```text
COUNT(attendance records)
WHERE check_in_at thuộc ngày đang xem
AND attendance là Check-in hợp lệ
```

---

## 2.3. Current In-Gym Count — Đang có mặt trong phòng tập

### Định nghĩa

Đếm số khách hiện tại đang ở trong trạng thái:

```text
IN_GYM
```

Ví dụ:

```text
A → IN_GYM
B → CHECKED_OUT
C → IN_GYM

Current In-Gym Count = 2 người
```

### Logic

```text
COUNT(DISTINCT visitor_id)
WHERE status = IN_GYM
```

Chỉ số này phục vụ quản lý tình trạng đông/vắng của Branch theo thời gian thực.

---

# 3. Các loại khách

Attendance phải hỗ trợ:

```text
MEMBER
GUEST
```

Cả hai loại khách đều có thể:

* Check-in.
* Check-out.
* Được tính vào Daily Unique Visitors.
* Được tính vào Total Check-in Events.
* Được tính vào Current In-Gym Count.

Hệ thống cần đảm bảo Guest và Member không bị đếm trùng.

---

# 4. Luồng Check-in

## 4.1. Kiểm tra khách

Khi khách thực hiện Check-in bằng:

* Face Recognition.
* QR Code.
* Staff Manual Check-in.

Hệ thống cần:

```text
1. Xác định khách hàng.
2. Xác định loại khách: MEMBER hoặc GUEST.
3. Kiểm tra quyền sử dụng.
4. Kiểm tra Branch.
5. Kiểm tra Attendance hiện tại.
```

---

## 4.2. Kiểm tra quyền Check-in

### Member

```text
Membership.status = ACTIVE
AND
Branch được phép sử dụng
```

### Guest

```text
Guest Visit.status = PAID / ACTIVE
```

Các trạng thái thực tế cần được AI map theo Database hiện tại.

---

## 4.3. Duplicate Check-in Prevention

Trước khi tạo Attendance mới:

```text
Có Attendance.status = IN_GYM?
```

### Nếu Có

```text
Không tạo Attendance mới.
```

Hiển thị:

> ⚠️ Khách hàng đang ở trong phòng tập.

### Nếu Không

```text
Tạo Attendance mới với:
status = IN_GYM
check_in_at = NOW()
```

---

# 5. Luồng Check-out

Khách có thể Check-out theo phương thức được Owner cấu hình.

Ví dụ:

```text
QR_CODE
FACE_RECOGNITION
MANUAL
```

Khi Check-out thành công:

```text
Attendance.status = CHECKED_OUT
check_out_at = NOW()
```

Mỗi lần Check-out kết thúc một Attendance Session.

Sau đó khách có thể Check-in lại và tạo một Attendance Session mới.

---

# 6. AUTO CHECK-OUT — LOGIC CHÍNH THỨC

Đây là phần được cập nhật so với bản phân tích trước.

Hệ thống hỗ trợ **hai cơ chế Auto Checkout**:

## 6.1. Auto Checkout theo thời lượng

Owner cấu hình:

```text
auto_checkout_duration = 4 hours
```

Ví dụ:

```text
Member A Check-in: 08:00
→ Dự kiến Auto Checkout: 12:00
```

Công thức:

```text
timeoutCheckoutAt =
checkInAt + autoCheckoutDuration
```

---

## 6.2. Auto Checkout theo giờ đóng cửa Branch

Mỗi Branch có cấu hình giờ hoạt động:

```text
opening_time
closing_time
```

Ví dụ:

```text
Branch A
Opening: 05:00
Closing: 22:00
```

Khi đến giờ đóng cửa, tất cả khách vẫn đang:

```text
IN_GYM
```

phải được tự động Check-out.

Ví dụ:

```text
Khách B Check-in: 19:00
Auto Timeout: 23:00
Branch Closing: 22:00

→ Actual Checkout = 22:00
```

---

## 6.3. Công thức thời gian Auto Checkout

```text
actualAutoCheckoutAt =
MIN(
    checkInAt + configuredAutoCheckoutDuration,
    branchClosingTime
)
```

Hệ thống phải thực hiện Check-out tại thời điểm đến trước.

Ví dụ:

| Khách | Check-in | Auto Duration | Timeout dự kiến | Branch đóng cửa | Checkout thực tế |
| ----- | -------- | ------------: | --------------- | --------------- | ---------------- |
| A     | 08:00    |            4h | 12:00           | 22:00           | **12:00**        |
| B     | 19:00    |            4h | 23:00           | 22:00           | **22:00**        |
| C     | 21:30    |            4h | 01:30           | 22:00           | **22:00**        |

---

# 7. Branch Closing Auto Checkout

## BR-ATTENDANCE-006 — Branch Closing Auto Checkout

```text
Khi Branch đến giờ đóng cửa, hệ thống phải tự động Check-out
tất cả khách vẫn có Attendance.status = IN_GYM tại Branch đó.
```

Thông tin Check-out phải được lưu:

```text
check_out_at
check_out_method = AUTO_BRANCH_CLOSING
```

Điều này giúp Audit và báo cáo phân biệt:

```text
QR
FACE
MANUAL
AUTO_TIMEOUT
AUTO_BRANCH_CLOSING
```

---

# 8. Trường hợp Branch đóng cửa khác nhau

FitFlow là SaaS đa Tenant và đa Branch nên giờ hoạt động không được hard-code.

Ví dụ:

```text
Branch A: 05:00 → 22:00
Branch B: 06:00 → 23:00
Branch C: 24/7
```

Mỗi Branch phải có cấu hình:

```text
opening_time
closing_time
timezone
```

Đề xuất lưu `timezone` để đảm bảo Cron Job xử lý chính xác khi hệ thống có khả năng mở rộng ra nhiều khu vực.

---

# 9. Trường hợp Branch 24/7

Đối với Branch có cấu hình:

```text
is_24_hours = true
```

Không áp dụng Auto Checkout theo giờ đóng cửa.

Chỉ áp dụng:

```text
checkInAt + autoCheckoutDuration
```

Ví dụ:

```text
Check-in: 22:00
Duration: 4h
→ Auto Checkout: 02:00 ngày hôm sau
```

Do đó, hệ thống **vẫn phải hỗ trợ Attendance qua ngày trong Database**, dù phần lớn Branch thông thường sẽ Auto Checkout trước khi qua ngày.

---

# 10. Check-in qua ngày — CASE 3 ĐÃ ĐƯỢC CẬP NHẬT

## Trường hợp Branch hoạt động bình thường

Ví dụ:

```text
Closing time = 22:00
Check-in = 21:00
Auto timeout = 01:00 ngày hôm sau
```

Kết quả:

```text
Actual Checkout = 22:00 cùng ngày.
```

Không tồn tại trạng thái `IN_GYM` qua ngày.

---

## Trường hợp Branch 24/7

```text
Check-in = 23:00
Auto Checkout = 03:00 hôm sau
```

Kết quả:

```text
Attendance có thể kéo dài sang ngày hôm sau.
```

---

## Business Rule

```text
BR-ATTENDANCE-007 — Overnight Attendance

Attendance được phép kéo dài sang ngày tiếp theo nếu và chỉ nếu
Branch có lịch hoạt động cho phép thời điểm Checkout dự kiến
vượt qua mốc ngày hiện tại.
```

Với Branch đóng cửa trước nửa đêm, Auto Checkout tại giờ đóng cửa phải có ưu tiên cao hơn.

---

# 11. Thứ tự ưu tiên khi Check-out

Nếu một Attendance Session vẫn `IN_GYM`, hệ thống xác định Check-out theo thứ tự thời gian xảy ra.

```text
1. Khách tự Check-out
2. Staff Manual Check-out
3. Auto Timeout
4. Branch Closing
```

Tuy nhiên, về mặt kỹ thuật và nghiệp vụ, **sự kiện nào xảy ra trước sẽ thắng**.

Ví dụ:

```text
Check-in: 18:00
Manual Checkout: 20:00
Auto Timeout: 22:00

→ Checkout = Manual lúc 20:00
→ Auto Job không thực hiện thêm lần nào.
```

---

# 12. Undo Check-in

Theo nghiệp vụ đã chốt:

```text
Undo Check-in không được xóa vật lý Attendance.
```

Khi Undo:

```text
Attendance.status = CANCELLED

cancelled_at
cancelled_by
cancel_reason
```

Attendance `CANCELLED`:

* Không tính vào Total Check-in Events.
* Không tính vào Daily Unique Visitors.
* Không tính Current In-Gym Count.
* Không được dùng làm Last Valid Activity của Member.

---

# 13. Business Rules thống kê

## BR-STAT-001 — Daily Unique Visitors

```text
Một Member/Guest chỉ được tính một lần duy nhất trong một ngày
nếu có ít nhất một Attendance Check-in hợp lệ.
```

---

## BR-STAT-002 — Total Check-in Events

```text
Mỗi Attendance Check-in hợp lệ được tính là một lượt vào.
```

Khách có thể được tính nhiều lượt nếu:

```text
Check-in
→ Check-out
→ Check-in lại
```

---

## BR-STAT-003 — Current In-Gym Count

```text
Một khách được tính đang có mặt nếu Attendance hiện tại
có status = IN_GYM.
```

---

# 14. Thống kê ngày và Attendance qua ngày

Thống kê phải dựa trên:

```text
check_in_at
```

Không dựa vào `check_out_at` hoặc `updated_at`.

Ví dụ Branch 24/7:

```text
23:00 ngày 27/08 → Check-in
02:00 ngày 28/08 → Check-out
```

Kết quả:

```text
Daily Unique Visitors ngày 27/08 = +1
Daily Unique Visitors ngày 28/08 = không tăng từ lượt này
```

Lượt Check-in thuộc về ngày 27/08.

---

# 15. Cập nhật Dashboard

## Branch Manager Dashboard

```text
👥 KHÁCH ĐÃ ĐẾN HÔM NAY
124 người

🚪 TỔNG LƯỢT VÀO
156 lượt

🏋️ ĐANG CÓ MẶT
42 người
```

Có thể bổ sung:

```text
Members: 110
Guests: 14
```

Không gọi `Total Check-in Events` là “Số khách đến”, vì sẽ gây hiểu nhầm.

---

# 16. API Response đề xuất

```http
GET /attendance/statistics/summary
```

Response:

```json
{
  "date": "2026-08-27",
  "branchId": "branch_001",
  "dailyUniqueVisitors": 124,
  "totalCheckInEvents": 156,
  "currentInGymCount": 42,
  "memberVisitors": 110,
  "guestVisitors": 14
}
```

---

# 17. Backend Pseudocode — Auto Checkout

```ts
async function calculateAutoCheckoutAt(
  checkInAt: Date,
  branch: Branch,
  autoCheckoutDuration: number,
) {
  const timeoutAt = addHours(
    checkInAt,
    autoCheckoutDuration,
  );

  if (branch.is24Hours) {
    return timeoutAt;
  }

  const closingAt = getBranchClosingDateTime(
    checkInAt,
    branch.closingTime,
    branch.timezone,
  );

  return timeoutAt < closingAt
    ? timeoutAt
    : closingAt;
}
```

Khi Attendance được tạo:

```ts
const scheduledCheckoutAt =
  await calculateAutoCheckoutAt(
    checkInAt,
    branch,
    autoCheckoutDuration,
  );

await attendanceRepository.create({
  visitorId,
  branchId,
  status: 'IN_GYM',
  checkInAt,
  scheduledAutoCheckoutAt: scheduledCheckoutAt,
});
```

Auto Checkout Job:

```ts
async function processAutoCheckout() {
  const now = new Date();

  const attendances = await attendanceRepository.find({
    status: 'IN_GYM',
    scheduledAutoCheckoutAt: {
      lte: now,
    },
  });

  for (const attendance of attendances) {
    if (attendance.status !== 'IN_GYM') continue;

    const checkoutMethod =
      attendance.scheduledAutoCheckoutReason === 'BRANCH_CLOSING'
        ? 'AUTO_BRANCH_CLOSING'
        : 'AUTO_TIMEOUT';

    await attendanceRepository.checkout({
      id: attendance.id,
      checkOutAt: now,
      status: 'CHECKED_OUT',
      checkOutMethod: checkoutMethod,
    });
  }
}
```

---

# 18. Prompt hoàn chỉnh để đưa cho AI Code

Bạn có thể copy toàn bộ prompt dưới đây:

```text
Please review the existing FitFlow Gym SaaS attendance module and update it according to the following business specification. Do not blindly replace existing schema or enums. First inspect the current Attendance entity, attendance statuses, check-in/check-out flows, branch configuration, authorization logic, and existing dashboard statistics. Adapt the implementation without unnecessary breaking changes.

SYSTEM OBJECTIVE

The system must distinguish between:
1. Daily Unique Visitors: number of unique people who visited a branch on a given day.
2. Total Check-in Events: total valid entries into the gym.
3. Current In-Gym Count: number of unique visitors currently inside the gym.

A single "check-in count" must not be used to represent both people and visit events.

VISITOR TYPES

The system supports MEMBER and GUEST visitors.

CHECK-IN RULES

A valid check-in must:
- Identify the visitor.
- Validate access rights and branch permissions.
- Create an attendance session with status IN_GYM.

Before creating a new attendance:
- Check whether the visitor already has an active IN_GYM attendance.
- If yes, do not create another attendance.
- Return a clear response such as "Visitor is already inside the gym."

A new check-in is allowed after the previous attendance has been checked out.

STATISTICS

Daily Unique Visitors:
- Count distinct valid MEMBER/GUEST visitors with at least one valid check-in.
- The same visitor must only count once per selected calendar day.
- Statistics are based on check_in_at.

Total Check-in Events:
- Count every valid attendance check-in.
- A visitor can generate multiple events in one day if they check out and later check in again.

Current In-Gym Count:
- Count distinct visitors with current attendance status IN_GYM.

Invalid/cancelled/undone attendances must not be included in any statistics.

UNDO CHECK-IN

Undo must not physically delete attendance records.
Use the existing soft cancellation/status mechanism and preserve audit information.
Cancelled/undone attendance must not count as a valid check-in.

CHECK-OUT METHODS

Support existing/manual methods and distinguish automatic checkout reasons when the current schema allows it:
- QR
- FACE
- MANUAL
- AUTO_TIMEOUT
- AUTO_BRANCH_CLOSING

AUTO CHECK-OUT

The system supports two automatic checkout mechanisms:

1. Duration-based auto checkout:
Owner/configuration defines an auto checkout duration, for example 4 hours.
timeoutAt = checkInAt + autoCheckoutDuration

2. Branch closing auto checkout:
Each branch can define its own opening/closing schedule.
If the branch reaches its closing time, visitors still IN_GYM must be automatically checked out.

For normal branches:
actualAutoCheckoutAt = the earlier of:
- timeoutAt
- applicable branch closing datetime

Example:
Check-in: 19:00
Auto duration: 4 hours
TimeoutAt: 23:00
Branch closes: 22:00
Actual checkout: 22:00 with reason AUTO_BRANCH_CLOSING.

The system must calculate this per attendance session.

IMPORTANT:
- Do not hard-code the same opening/closing time for all branches.
- Support branch-specific operating hours.
- If the branch is 24/7 or its operating schedule allows attendance to cross midnight, the database and statistics must support cross-day attendance.
- For normal branches that close before midnight, branch closing checkout should prevent IN_GYM sessions from remaining open into the next day.

CHECK-IN ACROSS MIDNIGHT

Daily statistics must always use check_in_at.

Example:
23:00 Aug 27 -> Check-in
02:00 Aug 28 -> Check-out

The visit counts toward Aug 27 Daily Unique Visitors and Total Check-in Events, not Aug 28.

AUTO CHECKOUT PROCESSING

Prefer storing a scheduled auto checkout timestamp/reason when an attendance session is created or recalculated.

The background job should:
- Find IN_GYM attendances where scheduledAutoCheckoutAt <= current time.
- Re-check that the attendance is still IN_GYM before checkout.
- Perform checkout exactly once.
- Set the correct automatic checkout reason.
- Be idempotent and safe if the job runs multiple times.

DASHBOARD API

Return clear KPI names:
{
  dailyUniqueVisitors,
  totalCheckInEvents,
  currentInGymCount,
  memberVisitors,
  guestVisitors
}

UI labels:
- "Khách đã đến hôm nay" = Daily Unique Visitors
- "Tổng lượt vào" = Total Check-in Events
- "Đang có mặt trong phòng tập" = Current In-Gym Count

AUTHORIZATION

All attendance queries and mutations must respect:
- Tenant isolation.
- Branch isolation.
- Existing role permissions.

Branch Manager and Staff must not access attendance data outside their authorized branch scope.
Owner can access branches belonging to their tenant according to existing permissions.

PERFORMANCE

Use appropriate indexes for attendance queries involving:
- tenantId
- branchId
- visitor/member/guest identifiers
- status
- checkInAt
- scheduledAutoCheckoutAt

Do not create unnecessary aggregation tables for MVP unless the existing dataset or performance requires it.
```

---

## Khuyến nghị quan trọng trước khi AI bắt đầu code

Tôi đề xuất bạn yêu cầu AI thực hiện theo thứ tự:

```text
Bước 1: Phân tích Attendance Schema hiện tại
        ↓
Bước 2: Kiểm tra enum Status và Check-in/Check-out Flow
        ↓
Bước 3: Kiểm tra cấu hình Operating Hours của Branch
        ↓
Bước 4: Đề xuất thay đổi Database nếu thực sự cần
        ↓
Bước 5: Implement Backend
        ↓
Bước 6: Cập nhật API Dashboard
        ↓
Bước 7: Test các Edge Cases
```

### Các Edge Cases bắt buộc test

* Một khách quét Check-in nhiều lần khi vẫn `IN_GYM`.
* Check-in → Check-out → Check-in lại cùng ngày.
* Manual Check-out trước thời gian Auto Checkout.
* Auto Timeout xảy ra trước giờ đóng cửa.
* Branch đóng cửa xảy ra trước Auto Timeout.
* Attendance bị Undo.
* Guest và Member.
* Branch có giờ đóng cửa khác nhau.
* Branch 24/7.
* Check-in qua ngày.
* Cron/Job chạy nhiều lần nhưng không Check-out trùng.


