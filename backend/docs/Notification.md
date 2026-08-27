Rất tốt. Dưới đây là **bản logic hoàn chỉnh có thể đưa trực tiếp cho AI coding** để xây dựng tính năng **Member Inactivity Monitoring & Retention Alert** cho hệ thống FitFlow.

Tôi viết theo hướng **Business Requirement → Business Rules → Data Model → Backend Flow → API → UI Behavior → Edge Cases**, để AI code không bị hiểu sai.

---

# FITFLOW — MEMBER INACTIVITY MONITORING & RETENTION ALERT

## 1. Mục tiêu chức năng

Hệ thống tự động phát hiện những **Member đang có Membership còn hiệu lực nhưng không đi tập trong thời gian dài**, từ đó thông báo cho **Branch Manager** để có thể theo dõi và chủ động liên hệ với khách hàng.

### Ngưỡng mặc định cho MVP

```text
15 ngày không có Check-in hợp lệ
```

Đây không phải là trạng thái Membership.

Ví dụ:

```text
Membership Status: ACTIVE
Engagement Status: INACTIVE
```

Member vẫn có quyền tập bình thường nếu Membership chưa hết hạn.

---

# 2. Phạm vi áp dụng

Chỉ áp dụng cho:

```text
Membership.status = ACTIVE
```

Không áp dụng cho:

```text
EXPIRED
CANCELLED
SUSPENDED
PENDING
```

---

# 3. Khái niệm và trạng thái

## 3.1. Engagement Status

Đề xuất tạo trạng thái theo dõi mức độ hoạt động riêng:

```ts
enum EngagementStatus {
  ACTIVE,
  INACTIVE,
}
```

### ACTIVE

Member có Check-in hợp lệ trong vòng dưới 15 ngày.

### INACTIVE

Member không có Check-in hợp lệ trong tối thiểu 15 ngày liên tiếp.

> Không được dùng `Membership.status = INACTIVE`, vì `ACTIVE Membership` và `Inactive Engagement` là hai khái niệm khác nhau.

---

# 4. Xác định ngày hoạt động gần nhất

Hệ thống cần xác định:

```text
lastActivityAt
```

Logic:

### Trường hợp 1: Member đã từng Check-in

```text
lastActivityAt = thời điểm Check-in hợp lệ gần nhất
```

### Trường hợp 2: Member chưa từng Check-in

```text
lastActivityAt = Membership.startDate
```

Ví dụ:

```text
Membership Start Date: 01/08
Không Check-in lần nào

Ngày hiện tại: 16/08

→ Inactive Days = 15
→ Member trở thành INACTIVE
```

### Công thức

```text
inactiveDays = CurrentDate - LastActivityAt
```

Nếu:

```text
inactiveDays >= 15
```

→ Member được đánh dấu `INACTIVE`.

---

# 5. Check-in nào được tính là hoạt động hợp lệ?

Chỉ tính những Attendance hợp lệ:

```text
CHECKED_IN
IN_GYM
COMPLETED
CHECKED_OUT
```

Không tính:

```text
CANCELLED
UNDO
REJECTED
```

Nếu hệ thống hiện tại sử dụng enum Attendance khác, **AI phải map logic này theo trạng thái Attendance thực tế, nhưng nguyên tắc là chỉ Check-in đã được xác nhận hợp lệ mới được tính**.

---

# 6. Business Rules

## BR-RETENTION-001 — Inactivity Detection

```text
Một Member có Membership ACTIVE được đánh dấu INACTIVE
khi không có Check-in hợp lệ trong ít nhất 15 ngày liên tiếp.
```

---

## BR-RETENTION-002 — First Inactivity Alert

Khi Member lần đầu đạt:

```text
15 ngày không hoạt động
```

Hệ thống phải:

1. Chuyển Engagement Status thành `INACTIVE`.
2. Tạo Inactivity Alert.
3. Gửi Notification cho Branch Manager phụ trách.

---

## BR-RETENTION-003 — Duplicate Alert Prevention

Không được tạo Notification mới mỗi ngày.

Ví dụ:

```text
Day 15 → Tạo Alert
Day 16 → Không tạo Alert
Day 17 → Không tạo Alert
Day 18 → Không tạo Alert
```

Mỗi Member chỉ có **một Alert đang mở cho một chu kỳ không hoạt động**.

---

## BR-RETENTION-004 — Milestone Reminder

Đề xuất các mốc:

```text
15 ngày → FIRST_ALERT
30 ngày → REMINDER
45 ngày → REMINDER
```

Tại MVP có thể cấu hình:

```ts
const INACTIVITY_MILESTONES = [15, 30, 45];
```

Tuy nhiên, để tránh AI hard-code, nên đặt các giá trị này trong configuration.

---

## BR-RETENTION-005 — Recovery

Khi Member Check-in thành công trở lại:

```text
Engagement Status = ACTIVE
```

Tất cả Alert đang mở của chu kỳ không hoạt động hiện tại phải chuyển:

```text
RECOVERED
```

Và lưu:

```text
recoveredAt
```

Hệ thống không cần gửi thông báo cho Manager mỗi lần Recovery ở MVP, nhưng nên lưu để phục vụ báo cáo sau này.

---

## BR-RETENTION-006 — Membership Expiration

Nếu Membership hết hạn trước khi Member quay lại:

```text
Membership.status = EXPIRED
```

→ Không tạo thêm Alert mới.

Các Alert đang mở có thể chuyển thành:

```text
CLOSED_EXPIRED
```

---

## BR-RETENTION-007 — Manager Scope

Thông báo chỉ được gửi cho Manager có quyền quản lý Branch phụ trách Member.

### Membership thông thường

```text
Member.homeBranchId
        ↓
Branch Manager của Branch đó
```

### Multi-Branch / VIP Membership

Member vẫn phải có:

```text
homeBranchId
```

Thông báo inactivity gửi cho:

```text
Manager của Home Branch
```

Không gửi đồng thời cho tất cả Branch mà Member được phép Check-in.

---

# 7. Luồng xử lý Backend hoàn chỉnh

## 7.1. Scheduled Job

Hệ thống chạy Job định kỳ mỗi ngày.

Đề xuất:

```text
01:00 mỗi ngày
```

Luồng:

```text
CRON JOB START
       ↓
Lấy tất cả Membership ACTIVE
       ↓
Xác định Last Valid Check-in
       ↓
Nếu chưa từng Check-in
       ↓
Dùng Membership.startDate
       ↓
Tính inactiveDays
       ↓
inactiveDays >= 15?
       │
       ├── NO
       │    ↓
       │ Update Engagement = ACTIVE
       │
       └── YES
            ↓
       Update Engagement = INACTIVE
            ↓
       Kiểm tra Milestone
            ↓
       15 / 30 / 45?
            │
            ├── NO → END
            │
            └── YES
                  ↓
            Kiểm tra Alert cùng milestone
                  │
                  ├── Exists → Không tạo
                  │
                  └── Not Exists
                        ↓
                    Create Alert
                        ↓
                    Create Notification
                        ↓
                    END
```

---

# 8. Trigger ngay sau Check-in

Không nên chờ Cron Job.

Ngay khi Check-in hợp lệ:

```text
Valid Check-in Created
        ↓
Update lastActivityAt
        ↓
Update engagementStatus = ACTIVE
        ↓
Find Open Inactivity Alerts
        ↓
Update Alerts → RECOVERED
        ↓
Save recoveredAt
```

Điều này giúp Dashboard cập nhật ngay lập tức.

---

# 9. Database Design đề xuất

## 9.1. Engagement Summary

Tôi đề xuất không nhất thiết tạo bảng riêng trong MVP nếu có thể lưu trực tiếp trên `Membership`.

```text
Membership
--------------------------------

id
member_id
branch_id

status

start_date
end_date

last_activity_at
engagement_status

created_at
updated_at
```

Ví dụ:

```text
last_activity_at = 2026-08-01
engagement_status = INACTIVE
```

---

## 9.2. Inactivity Alert

Tạo bảng:

```text
MemberInactivityAlert
```

Các trường:

```text
id

tenant_id
branch_id
member_id
membership_id

inactive_days
milestone

status

created_at

resolved_at
recovered_at

handled_by
handled_at
handle_note
```

### Alert Status

```ts
enum InactivityAlertStatus {
  OPEN,
  IN_PROGRESS,
  HANDLED,
  RECOVERED,
  CLOSED_EXPIRED,
}
```

---

## 9.3. Notification

Nếu hệ thống đã có module Notification thì tái sử dụng:

```text
Notification
--------------------------------

id
tenant_id
recipient_user_id

type
title
message

reference_type
reference_id

is_read

created_at
```

Ví dụ:

```text
type = MEMBER_INACTIVITY
reference_type = INACTIVITY_ALERT
reference_id = alert_id
```

---

# 10. API đề xuất

## 10.1. Lấy danh sách Member Inactive

```http
GET /branch-manager/inactivity-alerts
```

Query:

```text
?status=OPEN
&minInactiveDays=15
&page=1
&limit=20
```

Response:

```json
{
  "data": [
    {
      "id": "alert_001",
      "member": {
        "id": "member_001",
        "name": "Nguyễn Văn A",
        "phone": "090xxxxxxx"
      },
      "inactiveDays": 18,
      "lastActivityAt": "2026-08-09",
      "membershipRemainingDays": 42,
      "status": "OPEN"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 24
  }
}
```

---

## 10.2. Lấy thống kê Dashboard

```http
GET /branch-manager/dashboard/inactivity-summary
```

Response:

```json
{
  "inactiveMembers": 24,
  "newInactiveToday": 3,
  "handledAlerts": 8,
  "recoveredMembers": 4
}
```

---

## 10.3. Manager bắt đầu xử lý

```http
PATCH /branch-manager/inactivity-alerts/:id/start-processing
```

Kết quả:

```text
OPEN → IN_PROGRESS
```

---

## 10.4. Đánh dấu đã xử lý

```http
PATCH /branch-manager/inactivity-alerts/:id/handle
```

Body:

```json
{
  "handleResult": "CONTACTED",
  "note": "Khách bận công việc, dự kiến quay lại tuần sau"
}
```

---

# 11. UI Dashboard Branch Manager

Đề xuất Widget:

```text
┌─────────────────────────────────────────────┐
│ ⚠️ HỘI VIÊN CÓ NGUY CƠ RỜI BỎ                │
│                                             │
│  🔴 24 khách không tập ≥ 15 ngày            │
│  ↑ 3 khách mới hôm nay                      │
│                                             │
│              [ Xem danh sách → ]            │
└─────────────────────────────────────────────┘
```

---

# 12. Trang chi tiết Inactivity Management

```text
HỘI VIÊN KHÔNG HOẠT ĐỘNG

[ Tất cả ] [ Mới ] [ Đang xử lý ] [ Đã xử lý ]

──────────────────────────────────────────

🔴 Nguyễn Văn A

Không tập: 18 ngày
Gói còn hạn: 42 ngày
Lần tập gần nhất: 09/08/2026

[ Xem Member ] [ Bắt đầu xử lý ]
```

---

# 13. Ưu tiên khách cần xử lý

Tôi đề xuất Backend tính `priority`.

## HIGH

```text
Inactive ≥ 30 ngày
OR
Membership sắp hết hạn
```

## MEDIUM

```text
Inactive từ 15–29 ngày
```

Sau này có thể mở rộng thuật toán ưu tiên:

```text
Priority Score =
Inactive Days
+
Risk Of Expiration
+
Previous Attendance Trend
```

Nhưng **MVP chưa cần AI Prediction**.

---

# 14. Edge Cases bắt buộc xử lý

## Case 1 — Member Check-in đúng ngày thứ 15

Nếu:

```text
Ngày 15 → Check-in thành công
```

→ Không tạo Alert.

Do đó hệ thống nên dựa vào thời điểm chính xác (`datetime`), không chỉ so sánh ngày một cách máy móc.

---

## Case 2 — Check-in bị Undo

Nếu Check-in mới nhất bị Undo:

```text
Attendance = CANCELLED
```

→ Không tính là hoạt động.

Cần tìm lại:

```text
Last Valid Check-in trước đó.
```

---

## Case 3 — Member có nhiều Membership

Theo Business Rule hiện tại của FitFlow:

> Không cho phép Member mua Membership mới khi Membership cũ vẫn Active.

Do đó tại một thời điểm chỉ có một Membership Active, giúp logic inactivity đơn giản hơn.

---

## Case 4 — Member có Multi-Branch Membership

Một Check-in hợp lệ ở bất kỳ Branch được phép nào cũng được tính là hoạt động.

Nhưng Alert gửi về:

```text
Home Branch Manager
```

---

## Case 5 — Member Check-in trở lại

```text
INACTIVE
   ↓
Valid Check-in
   ↓
ACTIVE
   ↓
Alert = RECOVERED
```

Nếu sau đó Member lại không tập thêm 15 ngày:

```text
Tạo một chu kỳ Alert mới
```

---

# 15. Pseudocode để AI dễ triển khai

## Cron Job

```ts
async function checkMemberInactivity() {
  const activeMemberships = await membershipRepository.findActive();

  for (const membership of activeMemberships) {
    const lastActivityAt =
      membership.lastActivityAt ?? membership.startDate;

    const inactiveDays = calculateInactiveDays(
      lastActivityAt,
      new Date(),
    );

    if (inactiveDays < 15) {
      await updateEngagement(membership.id, 'ACTIVE');
      continue;
    }

    await updateEngagement(membership.id, 'INACTIVE');

    const milestones = [15, 30, 45];

    if (!milestones.includes(inactiveDays)) {
      continue;
    }

    const exists = await alertRepository.exists({
      membershipId: membership.id,
      milestone: inactiveDays,
    });

    if (exists) {
      continue;
    }

    const alert = await alertRepository.create({
      tenantId: membership.tenantId,
      branchId: membership.homeBranchId,
      memberId: membership.memberId,
      membershipId: membership.id,
      inactiveDays,
      milestone: inactiveDays,
      status: 'OPEN',
    });

    await notificationService.notifyBranchManager({
      branchId: membership.homeBranchId,
      type: 'MEMBER_INACTIVITY',
      referenceId: alert.id,
    });
  }
}
```

## Khi Member Check-in

```ts
async function handleSuccessfulCheckIn(memberId) {
  const membership = await membershipRepository
    .findActiveByMember(memberId);

  if (!membership) return;

  await membershipRepository.update(membership.id, {
    lastActivityAt: new Date(),
    engagementStatus: 'ACTIVE',
  });

  await inactivityAlertRepository.markRecovered({
    membershipId: membership.id,
    recoveredAt: new Date(),
  });
}
```

---

# 16. Prompt ngắn gọn để bạn đưa cho AI Code

Bạn có thể copy phần dưới đây:

```text
Implement a Member Inactivity Monitoring module for a multi-tenant Gym SaaS system.

Business objective:
Detect members with ACTIVE memberships who have not had a valid check-in for 15 consecutive days and notify the responsible Branch Manager.

Core rules:
1. Membership status and engagement status must be separate concepts.
2. Only ACTIVE memberships are monitored.
3. lastActivityAt is the latest valid check-in. If no valid check-in exists, use membership.startDate.
4. If inactiveDays >= 15, set engagementStatus = INACTIVE.
5. Create inactivity alerts only at configurable milestones: [15, 30, 45].
6. Prevent duplicate alerts for the same membership and milestone.
7. When the member performs a valid check-in again:
   - Update lastActivityAt.
   - Set engagementStatus = ACTIVE.
   - Mark all open/in-progress inactivity alerts for the current membership as RECOVERED.
8. Cancelled or undone check-ins must not count as valid activity.
9. For multi-branch memberships, check-ins from any allowed branch count as activity, but inactivity alerts are assigned to the member's home branch.
10. Do not monitor EXPIRED, CANCELLED, SUSPENDED or PENDING memberships.

Implement:
- Scheduled daily job for inactivity detection.
- InactivityAlert entity/table.
- Integration with existing Notification module.
- Branch Manager APIs for dashboard summary and alert management.
- Tenant and branch authorization checks on every query.
- Idempotent job logic to prevent duplicate alerts.
- Database indexes for membership status, lastActivityAt, tenantId, branchId, and alert status.
```

---

## Khuyến nghị cuối cùng của tôi

Tôi đề xuất bạn triển khai **phiên bản MVP trước** gồm:

```text
✓ 15 ngày không tập
✓ Dashboard Widget
✓ Danh sách khách inactive
✓ Notification cho Branch Manager
✓ Check-in trở lại → Auto Recovery
✓ Follow-up đơn giản
```

Còn các phần như **30/45 ngày, Priority Score và phân tích nguy cơ rời bỏ** có thể xây dựng ở Phase 2. Cách này giúp dự án FitFlow không bị quá phức tạp ngay từ đầu nhưng kiến trúc vẫn đủ tốt để mở rộng sau này.
