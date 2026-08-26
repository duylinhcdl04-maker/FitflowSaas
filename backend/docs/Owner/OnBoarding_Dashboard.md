Hoàn toàn đồng ý. Đây chính là bước tiếp theo hợp lý nhất. Chúng ta sẽ bắt đầu **phân tích Owner Dashboard theo chuẩn tài liệu BA**, bám sát toàn bộ nghiệp vụ FitFlow đã thống nhất, đặc biệt là mô hình **Multi-Tenant → Multi-Branch → Trial/Subscription → Membership → Check-in → PT → Payment**.

# PHÂN TÍCH NGHIỆP VỤ — OWNER DASHBOARD

## 1. Mục tiêu của màn hình

### Tên màn hình

**Owner Dashboard / Business Overview**

### Mục tiêu nghiệp vụ

Owner Dashboard là màn hình trung tâm giúp Owner trả lời nhanh:

1. **Doanh nghiệp hôm nay hoạt động như thế nào?**
2. **Có bao nhiêu khách hàng đang hoạt động và đang có mặt tại phòng tập?**
3. **Doanh thu đang ở mức nào?**
4. **Chi nhánh nào đang hoạt động tốt hoặc có vấn đề?**
5. **Có vấn đề nào Owner cần xử lý ngay không?**
6. **Gói SaaS hiện tại còn đủ tài nguyên để vận hành không?**

> Dashboard không nên trở thành một trang chứa tất cả dữ liệu. Nó phải là **màn hình hỗ trợ ra quyết định và điều hướng đến các vấn đề cần xử lý**.

---

# 2. Actor

## Primary Actor: Owner

Owner có quyền xem dữ liệu của toàn bộ Tenant mà mình sở hữu.

Phạm vi dữ liệu:

```text
Tenant
   │
   ├── Tất cả Branch
   ├── Tất cả Staff
   ├── Tất cả Member
   ├── Guest
   ├── Membership
   ├── PT
   ├── Check-in
   └── Payment
```

### Quy tắc phân quyền

Owner chỉ được xem dữ liệu thuộc Tenant của mình.

Ví dụ:

```text
Owner A → Tenant A → Chỉ xem Tenant A
Owner B → Tenant B → Chỉ xem Tenant B
```

Dù biết `tenantId` của doanh nghiệp khác, API cũng không được trả dữ liệu.

---

# 3. User Stories

### US-OD-01 — Xem tình hình tổng quan

> **Là một Owner, tôi muốn xem nhanh tình hình hoạt động của doanh nghiệp để biết phòng tập đang vận hành như thế nào.**

---

### US-OD-02 — Lọc theo thời gian

> **Là một Owner, tôi muốn chọn khoảng thời gian để xem số liệu phù hợp với nhu cầu phân tích.**

Ví dụ:

```text
Hôm nay
Hôm qua
7 ngày qua
Tháng này
Khoảng thời gian tùy chỉnh
```

---

### US-OD-03 — Lọc theo Branch

> **Là một Owner, tôi muốn xem dữ liệu của toàn bộ doanh nghiệp hoặc một chi nhánh cụ thể để so sánh hiệu quả hoạt động.**

```text
[Tất cả chi nhánh ▼]
```

---

### US-OD-04 — Phát hiện vấn đề

> **Là một Owner, tôi muốn nhận biết các vấn đề cần chú ý để có thể xử lý kịp thời.**

Ví dụ:

* Membership sắp hết hạn.
* Subscription sắp hết hạn.
* Chi nhánh có lượng Check-in bất thường.
* Nhiều khách đang ở trạng thái chưa Check-out quá lâu.
* Sắp đạt giới hạn Branch/Staff của gói SaaS.

---

# 4. Cấu trúc giao diện tổng thể

Tôi đề xuất bố cục:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Chào buổi sáng, Owner 👋                                          │
│ Theo dõi tình hình hoạt động doanh nghiệp của bạn                 │
│                                                                    │
│ [Tất cả chi nhánh ▼] [Hôm nay ▼]                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [Doanh thu] [Check-in] [Khách đang tập] [Member Active]          │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Biểu đồ doanh thu              Hoạt động Check-in                │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Hiệu suất chi nhánh            Việc cần chú ý                    │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Hoạt động gần đây              Subscription & Usage              │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

Tôi khuyên Dashboard chia thành **6 khu vực nghiệp vụ**.

---

# 5. Khu vực A — Context & Filter

## UI Components

### A1. Tenant/Business Context

Hiển thị:

```text
FITFLOW FITNESS
```

Owner phải luôn biết mình đang quản lý doanh nghiệp nào.

---

### A2. Branch Filter

```text
[Tất cả chi nhánh ▼]
```

Danh sách:

```text
✓ Tất cả chi nhánh
  Branch Cầu Giấy
  Branch Mỹ Đình
  Branch Hà Đông
```

### Business Rule — BR-OD-01

Filter Branch chỉ hiển thị Branch:

```text
tenant_id = currentOwner.tenant_id
```

Không cho phép Owner truyền Branch của Tenant khác.

---

### A3. Date Range

Mặc định:

```text
Hôm nay
```

Có thể chọn:

```text
Today
Yesterday
Last 7 Days
This Month
Custom Range
```

### Khuyến nghị BA

Các KPI vận hành như **Khách đang ở trong phòng tập** luôn tính theo thời điểm hiện tại, không hoàn toàn phụ thuộc Date Range.

Ví dụ:

```text
Date Range = Tháng này
```

thì:

* Revenue → Tháng này.
* Check-in → Tháng này.
* Current In Gym → Thời điểm hiện tại.

UI nên ghi rõ để tránh hiểu nhầm:

> **42 khách đang ở phòng tập ngay lúc này**

---

# 6. Khu vực B — KPI Cards

Tôi đề xuất MVP gồm 4 KPI chính.

## B1. Doanh thu

```text
💰 DOANH THU

12.500.000 VNĐ

↑ 15% so với kỳ trước
```

### API Data

```text
Total Revenue
Previous Period Revenue
Growth Percentage
```

### Business Rule — BR-OD-02

Chỉ tính Payment:

```text
SUCCESS
PAID
```

Không tính:

```text
PENDING
FAILED
CANCELLED
REFUNDED
```

---

## B2. Tổng Check-in

```text
📍 CHECK-IN

125 lượt

↑ 8% so với kỳ trước
```

Có thể tách:

```text
Member: 110
Guest: 15
```

### Business Rule — BR-OD-03

Một lượt Check-in hợp lệ chỉ được tính khi:

```text
Check-in Status = CHECKED_IN
```

Undo Check-in phải được loại khỏi số liệu.

---

## B3. Khách đang ở phòng tập

```text
🏋 ĐANG TẬP

42 khách
```

Công thức:

```text
CHECKED_IN
AND
NOT CHECKED_OUT
```

Bao gồm:

```text
Member
Guest
```

Nếu có Auto Checkout:

```text
Auto Checkout
→ khách không còn được tính là đang ở phòng tập.
```

---

## B4. Member đang hoạt động

```text
👥 ACTIVE MEMBERS

1,245
```

Tôi đề xuất đây là số lượng **Member có ít nhất một Membership hợp lệ tại thời điểm hiện tại**.

### Business Rule — BR-OD-04

Member không được đếm nhiều lần nếu có nhiều Membership.

Ví dụ:

```text
Customer A
 ├── Membership 1
 └── Membership 2
```

Vẫn chỉ tính:

```text
1 Active Member
```

---

# 7. Khu vực C — Biểu đồ doanh thu

## User Story

> **Là Owner, tôi muốn xem xu hướng doanh thu để đánh giá hiệu quả kinh doanh theo thời gian.**

### UI

```text
DOANH THU

[Ngày] [Tuần] [Tháng]

│                         ●
│                  ●
│           ●
│     ●
└────────────────────────────
```

## API

```http
GET /owner/dashboard/revenue
```

Ví dụ:

```http
GET /owner/dashboard/revenue?branchId=xxx&from=...&to=...&groupBy=day
```

Response:

```json
{
  "total": 12500000,
  "data": [
    {
      "date": "2026-08-20",
      "revenue": 2500000
    }
  ]
}
```

### Business Rule — BR-OD-05

Revenue phải dựa trên **thời điểm Payment thành công**, không phải ngày tạo Membership.

---

# 8. Khu vực D — Branch Performance

Chỉ hiển thị khi Tenant có từ 2 Branch trở lên.

```text
HIỆU SUẤT CHI NHÁNH

Branch             Revenue      Check-in

Cầu Giấy           12.5M        125
Mỹ Đình            8.2M         94
Hà Đông            5.6M         60

[Xem chi tiết]
```

### Mục tiêu

Owner có thể nhận biết:

* Branch nào tạo doanh thu cao.
* Branch nào có lượng khách thấp.
* Branch nào cần được quan tâm.

### Business Rule — BR-OD-06

Khi Owner chọn một Branch cụ thể:

```text
Branch Performance Widget
```

có thể ẩn hoặc chuyển thành:

```text
Branch Summary
```

---

# 9. Khu vực E — Attention Center

Theo tôi, đây nên là phần quan trọng nhất của Dashboard.

```text
⚠️ CẦN CHÚ Ý

🔴 5 Membership hết hạn hôm nay

🟠 12 Membership hết hạn trong 7 ngày

🟡 3 khách chưa Check-out quá thời gian bình thường

🔵 Bạn đã sử dụng 90% giới hạn Staff

[Xem tất cả]
```

## Business Rule

Thông báo được chia theo Priority:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Không nên hiển thị quá nhiều.

MVP:

```text
Top 5–10 Alerts
```

---

# 10. Khu vực F — Recent Activities

Hiển thị các hoạt động quan trọng gần đây:

```text
HOẠT ĐỘNG GẦN ĐÂY

10:30 — Nguyễn Văn A Check-in tại Branch Cầu Giấy

10:15 — Membership mới được tạo cho Trần B

10:00 — Thanh toán thành công 1.200.000 VNĐ

09:45 — PT Booking được tạo
```

### Business Rule — BR-OD-07

Không nên hiển thị các hoạt động kỹ thuật:

```text
User login
Token refresh
API request
```

Chỉ hiển thị Business Events.

---

# 11. Khu vực G — SaaS Subscription & Usage

Vì đây là Owner của một SaaS Tenant, tôi cho rằng Dashboard nên có một khu vực nhỏ:

```text
GÓI SỬ DỤNG

FITFLOW GROWTH
● Trial còn 5 ngày

Branch
████░ 1 / 5

Staff
██░░░ 3 / 20

[Nâng cấp gói]
```

Nếu Owner đang Trial:

```text
Trial còn 5 ngày
```

Nếu Subscription Active:

```text
Gia hạn sau 28 ngày
```

Nếu sắp hết hạn:

```text
⚠️ Gói của bạn sẽ hết hạn sau 3 ngày
```

### Business Rule — BR-OD-08

Widget Subscription phải dựa trên:

```text
Current Subscription
+
Tenant Entitlement
+
Current Usage
```

Không nên lấy trực tiếp giới hạn từ Plan vì có thể Tenant có Add-on hoặc Override.

---

# 12. API Design đề xuất

Tôi không khuyên Dashboard gọi 10 API riêng khi mới vào trang.

Với MVP:

```http
GET /owner/dashboard/overview
```

Response:

```json
{
  "context": {
    "tenantId": "tenant_001",
    "branchId": null,
    "dateRange": {
      "from": "2026-08-24",
      "to": "2026-08-24"
    }
  },
  "kpis": {
    "revenue": {},
    "checkins": {},
    "currentlyInGym": 42,
    "activeMembers": 1245
  },
  "revenueChart": [],
  "branchPerformance": [],
  "alerts": [],
  "recentActivities": [],
  "subscription": {}
}
```

Sau này khi Dashboard phức tạp hơn có thể tách API theo Widget để tối ưu hiệu suất.

---

# 13. Các Edge Cases quan trọng

## EC-OD-01 — Tenant chưa hoàn thành Onboarding

Ví dụ:

```text
Branch = 0
Member = 0
```

Không nên hiển thị:

```text
Doanh thu = 0
Check-in = 0
```

một cách khô khan.

Nên có Empty State:

> Bạn chưa có chi nhánh nào. Hãy tạo chi nhánh đầu tiên để bắt đầu vận hành.

---

## EC-OD-02 — Trial hết hạn

Dashboard vẫn hiển thị dữ liệu, nhưng:

```text
READ_ONLY
```

Các CTA tạo dữ liệu phải bị khóa.

---

## EC-OD-03 — Owner chọn Branch đã bị Archive

Không nên trả lỗi.

Hệ thống nên:

```text
Reset về All Branches
```

và thông báo phù hợp.

---

## EC-OD-04 — Auto Checkout

Customer đã Check-in:

```text
08:00
```

Auto Checkout:

```text
12:00
```

Sau 12:00:

```text
Current In Gym = false
```

Dù không có thao tác của Staff.

---

## EC-OD-05 — Undo Check-in

Nếu Staff Undo một Check-in:

* Không tính vào Total Check-in.
* Nếu đang tính Current In Gym → phải loại ra.
* Activity Log nên thể hiện thao tác Undo nếu đó là sự kiện quan trọng.

---

# 14. Danh sách Business Rules tổng hợp

| ID       | Business Rule                                               |
| -------- | ----------------------------------------------------------- |
| BR-OD-01 | Owner chỉ xem dữ liệu thuộc Tenant của mình                 |
| BR-OD-02 | Revenue chỉ tính Payment thành công                         |
| BR-OD-03 | Undo Check-in không được tính vào KPI                       |
| BR-OD-04 | Một Customer chỉ tính một lần trong Active Members          |
| BR-OD-05 | Revenue tính theo thời điểm Payment thành công              |
| BR-OD-06 | Branch Performance chỉ hiển thị khi phù hợp                 |
| BR-OD-07 | Recent Activity chỉ hiển thị Business Events                |
| BR-OD-08 | Subscription Usage dựa trên Entitlement thực tế             |
| BR-OD-09 | Current In Gym tính theo trạng thái Check-in/Check-out      |
| BR-OD-10 | Auto Checkout phải cập nhật Dashboard                       |
| BR-OD-11 | Trial Expired chỉ cho phép Read Only                        |
| BR-OD-12 | Dashboard phải xử lý Empty State khi Tenant chưa có dữ liệu |

---

# Đánh giá BA: Owner Dashboard nên ưu tiên gì?

Tôi đề xuất thứ tự ưu tiên:

### 🔥 P0 — Bắt buộc cho MVP

* Branch Filter
* Date Range
* Revenue KPI
* Check-in KPI
* Current In Gym
* Active Members
* Revenue Chart
* Alerts
* Empty States

### ⭐ P1 — Nên có

* Branch Performance
* Recent Activities
* Subscription Usage Widget

### 🚀 P2 — Phát triển sau

* So sánh nhiều kỳ
* Dự báo doanh thu
* AI Insight
* Benchmark giữa các Branch
* Phát hiện bất thường tự động

---


