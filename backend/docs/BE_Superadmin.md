Dựa trên toàn bộ nghiệp vụ FitFlow mà chúng ta đã phân tích, nếu tôi đóng vai **BA chuyên nghiệp**, tôi sẽ xác định **Super Admin Backend không phải là một Owner có quyền cao hơn**.

Super Admin quản lý **toàn bộ nền tảng SaaS FitFlow**, còn Owner chỉ quản lý **một Tenant/Business**.

Vì vậy, backend của Super Admin cần được thiết kế theo tư duy:

> **Platform Management → SaaS Product Configuration → Tenant Lifecycle → Subscription & Billing → System Governance**

Dưới đây là bản phân tích nghiệp vụ backend tôi đề xuất.

---

# 1. Phạm vi và vai trò của Super Admin

Mô hình tổng thể:

```text
FITFLOW PLATFORM
│
├── SUPER ADMIN
│
├── TENANT A - ABC GYM
│   ├── Owner
│   ├── Branch Manager
│   ├── Staff
│   ├── PT
│   └── Customer
│
├── TENANT B - XYZ FITNESS
│   └── ...
│
└── TENANT C - ...
```

## Nguyên tắc quan trọng

```text
SUPER ADMIN
     ↓
Quản lý PLATFORM

OWNER
     ↓
Quản lý BUSINESS / TENANT

BRANCH MANAGER
     ↓
Quản lý BRANCH
```

Do đó Super Admin **không nên sử dụng chung hoàn toàn các API của Owner**.

Ví dụ:

```text
/api/owner/customers
```

và:

```text
/api/admin/tenants
```

nên là hai domain API khác nhau.

---

# 2. Các nhóm nghiệp vụ chính của Super Admin Backend

Tôi đề xuất chia thành 7 domain:

```text
SUPER ADMIN BACKEND
│
├── 1. Platform Dashboard
├── 2. Tenant Management
├── 3. SaaS Product Configuration
├── 4. Subscription Management
├── 5. Billing & Payment
├── 6. Platform Governance
└── 7. Audit & Monitoring
```

Đây là cấu trúc phù hợp để bạn tổ chức module trong NestJS.

---

# 3. Domain 1 — Platform Dashboard

Dashboard không chỉ là frontend hiển thị số liệu. Backend phải có nghiệp vụ tổng hợp dữ liệu.

## API Dashboard

```http
GET /admin/dashboard
```

Có thể trả về:

```json
{
  "tenants": {
    "total": 120,
    "active": 105,
    "suspended": 5,
    "expired": 10
  },
  "subscriptions": {
    "active": 98,
    "trial": 12,
    "expiringSoon": 8
  },
  "revenue": {
    "monthlyRevenue": 50000000,
    "totalRevenue": 600000000
  },
  "usage": {
    "totalBranches": 250,
    "totalMembers": 50000
  }
}
```

## Business Rules

### BR-SA-01 — Dashboard chỉ hiển thị dữ liệu Platform

Không được lấy dữ liệu của một Tenant cụ thể làm mặc định.

### BR-SA-02 — Revenue phải dựa trên Payment hợp lệ

Ví dụ chỉ tính:

```text
PAID
SUCCESS
```

Không tính:

```text
PENDING
FAILED
CANCELLED
```

### BR-SA-03 — Dashboard nên có Date Range

Ví dụ:

```http
GET /admin/dashboard?from=2026-08-01&to=2026-08-31
```

---

# 4. Domain 2 — Tenant Management

Đây là một domain rất quan trọng.

Super Admin quản lý vòng đời của doanh nghiệp sử dụng FitFlow.

## Tenant Lifecycle

Tôi đề xuất:

```text
PENDING
   ↓
ACTIVE
   ↓
SUSPENDED
   ↓
CLOSED / ARCHIVED
```

Ngoài ra Subscription có trạng thái riêng.

**Không nên gộp Tenant Status và Subscription Status làm một.**

Ví dụ:

```text
Tenant: ACTIVE

Subscription: EXPIRED
```

Tenant vẫn tồn tại nhưng quyền vận hành bị giới hạn.

---

## Chức năng Tenant Management

### Xem danh sách Tenant

```http
GET /admin/tenants
```

Filter:

```text
Status
Plan
Subscription Status
Created Date
Keyword
```

---

### Xem chi tiết Tenant

```http
GET /admin/tenants/:tenantId
```

Thông tin:

```text
Business Information
Owner
Branches
Current Subscription
Add-ons
Usage
Payment History
Activity Summary
```

---

### Suspend Tenant

```http
POST /admin/tenants/:tenantId/suspend
```

Tôi khuyên Suspend phải yêu cầu:

```text
Reason
Suspended By
Suspended At
```

Ví dụ:

```json
{
  "reason": "Violation of service terms"
}
```

## Business Rule

### BR-TENANT-01

Không được hard delete Tenant đã có dữ liệu nghiệp vụ.

Chỉ:

```text
ACTIVE
SUSPENDED
ARCHIVED
```

---

### BR-TENANT-02

Khi Tenant bị Suspended:

```text
Không được tạo dữ liệu mới
Không Check-in
Không nhận thanh toán
Không tạo Membership
```

Tuy nhiên Super Admin cần quyết định chính sách:

```text
READ_ONLY
```

hoặc:

```text
FULL_BLOCK
```

Tôi đề xuất mặc định **READ_ONLY** nếu không có vi phạm nghiêm trọng.

---

# 5. Domain 3 — SaaS Product Configuration

Đây là nơi Super Admin cấu hình “sản phẩm SaaS”.

Cấu trúc:

```text
SaaS Product Configuration
│
├── Plans
├── Features
├── Limits
├── Add-ons
└── Prices
```

---

# 6. Plan Management

## API

```http
GET    /admin/saas/plans
POST   /admin/saas/plans
GET    /admin/saas/plans/:id
PATCH  /admin/saas/plans/:id
POST   /admin/saas/plans/:id/publish
POST   /admin/saas/plans/:id/archive
```

## Plan Status

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

### Ý nghĩa

| Status   | Ý nghĩa         |
| -------- | --------------- |
| DRAFT    | Đang cấu hình   |
| ACTIVE   | Được phép bán   |
| INACTIVE | Ngừng bán mới   |
| ARCHIVED | Ngừng hoàn toàn |

### Business Rule quan trọng

**BR-PLAN-01:** Không được Hard Delete Plan đã có Subscription.

**BR-PLAN-02:** Plan INACTIVE không cho Tenant mới đăng ký, nhưng Tenant cũ vẫn có thể tiếp tục sử dụng theo chính sách.

**BR-PLAN-03:** Một Plan phải có ít nhất một mức giá trước khi Publish.

**BR-PLAN-04:** Một Plan Publish phải có Feature và Limit hợp lệ.

---

# 7. Feature Catalog Management

Super Admin quản lý danh sách các tính năng mà FitFlow hỗ trợ.

Ví dụ:

```text
CUSTOMER_MANAGEMENT
MEMBERSHIP_MANAGEMENT
PAYMENT_MANAGEMENT
CHECKIN_QR
CHECKIN_MANUAL
CHECKIN_FACE
PT_MANAGEMENT
PT_BOOKING
MULTI_BRANCH
ADVANCED_REPORT
```

## API

```http
GET   /admin/features
POST  /admin/features
PATCH /admin/features/:id
```

## Business Rule

### BR-FEATURE-01

`Feature Code` là định danh kỹ thuật và không được thay đổi sau khi đã được sử dụng.

Ví dụ:

```text
CHECKIN_FACE
```

Backend sẽ sử dụng code này để kiểm tra quyền truy cập.

### BR-FEATURE-02

Không xóa Feature đang được gán cho Plan.

Có thể:

```text
INACTIVE
```

---

# 8. Usage Limit Configuration

Super Admin cấu hình giới hạn.

Ví dụ:

```text
MAX_BRANCH
MAX_STAFF
MAX_PT
MAX_MEMBER
MAX_STORAGE
```

Cấu hình:

```json
{
  "limitCode": "MAX_BRANCH",
  "value": 5
}
```

Unlimited:

```json
{
  "limitCode": "MAX_MEMBER",
  "value": null
}
```

Tôi đề xuất không hardcode:

```text
plan.maxBranch
plan.maxStaff
plan.maxPT
```

mà dùng một cấu trúc linh hoạt.

## Business Rule

### BR-LIMIT-01

Khi Owner tạo dữ liệu mới, backend phải kiểm tra Limit.

Ví dụ:

```text
Current Branch = 5
Max Branch = 5

Create Branch
        ↓
BLOCK
```

Trả về:

```text
PLAN_LIMIT_EXCEEDED
```

Frontend sau đó có thể hiển thị CTA nâng cấp.

---

# 9. Add-on Management

Add-on là sản phẩm mở rộng độc lập.

Ví dụ:

```text
FACE_RECOGNITION
EXTRA_BRANCH
EXTRA_USER
ADVANCED_ANALYTICS
```

## API

```http
GET    /admin/addons
POST   /admin/addons
PATCH  /admin/addons/:id
```

Một Add-on cần cấu hình:

```text
Name
Code
Description
Pricing Model
Price
Compatible Plans
Status
```

Pricing Model:

```text
FIXED
PER_BRANCH
PER_USER
PER_USAGE
```

---

# 10. Domain 4 — Subscription Management

Đây là trung tâm nghiệp vụ giữa:

```text
Tenant
   ↓
Plan
   ↓
Subscription
   ↓
Entitlements
```

## Subscription Status

Tôi đề xuất:

```text
PENDING_PAYMENT
TRIAL
ACTIVE
PAST_DUE
EXPIRED
SUSPENDED
CANCELLED
```

## Lưu ý

```text
Tenant Status ≠ Subscription Status
```

Ví dụ:

```text
Tenant = ACTIVE

Subscription = EXPIRED
```

Hệ thống vẫn giữ doanh nghiệp, nhưng hạn chế quyền sử dụng.

---

## Các chức năng Super Admin

### Xem Subscription

```http
GET /admin/subscriptions
```

### Xem chi tiết

```http
GET /admin/subscriptions/:id
```

### Gia hạn thủ công

```http
POST /admin/subscriptions/:id/extend
```

Ví dụ:

```json
{
  "days": 30,
  "reason": "Manual promotion"
}
```

### Gán Plan đặc biệt

Ví dụ khách Enterprise có hợp đồng riêng:

```http
POST /admin/tenants/:tenantId/subscription
```

Super Admin có thể tạo Subscription tùy chỉnh.

---

# 11. Tenant Entitlement — thành phần tôi khuyên nên có

Đây là điểm quan trọng nhất trong kiến trúc backend.

Thay vì mỗi request kiểm tra:

```text
Tenant dùng Plan nào?
Plan có Feature gì?
Plan có Add-on gì?
Subscription còn hạn không?
```

Ta xây dựng:

```text
TENANT ENTITLEMENT
```

Ví dụ:

```json
{
  "tenantId": "tenant-001",
  "features": [
    "CHECKIN_QR",
    "CHECKIN_FACE",
    "PT_MANAGEMENT"
  ],
  "limits": {
    "MAX_BRANCH": 6,
    "MAX_STAFF": 20
  }
}
```

Số 6 có thể là:

```text
Plan: 5 Branch
+
Add-on: 1 Extra Branch
```

---

## Cơ chế tạo Entitlement

```text
Base Plan
      │
      ▼
Plan Features + Plan Limits
      │
      ▼
Add-ons
      │
      ▼
Subscription Custom Rules
      │
      ▼
TENANT ENTITLEMENT
```

Backend khi xử lý:

```text
Create Branch
      ↓
Check Entitlement
      ↓
MAX_BRANCH = 6
      ↓
Check Current Usage
```

Đây là kiến trúc rất phù hợp với SaaS.

---

# 12. Domain 5 — Billing & Payment Management

Super Admin không nhất thiết phải tạo Payment thủ công trong mọi trường hợp.

Hệ thống cần quản lý:

```text
Invoices
Payments
Refunds
Failed Payments
```

## Payment Status

```text
PENDING
PROCESSING
SUCCESS
FAILED
EXPIRED
CANCELLED
REFUNDED
```

### Business Rule

**BR-PAYMENT-01:** Payment SUCCESS không được thay đổi trực tiếp thành PENDING.

**BR-PAYMENT-02:** Payment phải lưu Snapshot số tiền tại thời điểm tạo.

Ví dụ:

```text
Plan hôm nay: 499,000

Invoice tạo hôm nay: 499,000

Ngày mai Plan đổi: 599,000
```

Invoice cũ vẫn phải:

```text
499,000
```

---

# 13. Domain 6 — Super Admin Governance

Đây là phần dễ bị bỏ quên.

Super Admin có quyền cao nhất nên phải kiểm soát hành động.

Tôi đề xuất:

```text
Super Admin
Platform Admin
Support Admin
Billing Admin
```

Ngay cả khi MVP hiện tại chỉ có một Super Admin, backend nên chuẩn bị cấu trúc mở rộng.

Ví dụ:

```text
SUPER_ADMIN
```

sau này:

```text
SUPER_ADMIN
PLATFORM_ADMIN
SUPPORT_ADMIN
BILLING_ADMIN
```

---

# 14. Audit Log — bắt buộc đối với hành động quan trọng

Các hành động phải lưu log:

```text
Create Plan
Update Price
Publish Plan
Suspend Tenant
Change Subscription
Manual Extension
Refund
Override Limit
```

Audit Log:

```text
actor_id
actor_type
action
resource_type
resource_id
before_data
after_data
reason
ip_address
created_at
```

Ví dụ:

```text
Actor: Super Admin A

Action:
SUSPEND_TENANT

Target:
ABC GYM

Reason:
Payment violation

Time:
24/08/2026 08:30
```

---

# 15. Override Tenant — nghiệp vụ cần có nhưng phải kiểm soát

Thực tế SaaS sẽ có trường hợp:

```text
Plan: Growth
MAX_BRANCH = 5
```

Nhưng một khách hàng VIP được phép:

```text
MAX_BRANCH = 7
```

Không nên sửa Plan Growth chỉ vì một khách.

Nên có:

```text
Tenant Override
```

Ví dụ:

```json
{
  "tenantId": "abc",
  "limitOverrides": {
    "MAX_BRANCH": 7
  }
}
```

## Business Rule

Override phải có:

```text
Reason
Created By
Effective Date
Expiration Date (optional)
```

Và phải được Audit Log.

---

# 16. Kiến trúc module NestJS tôi đề xuất

```text
src/
│
├── modules/
│
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── tenants/
│   │   ├── saas-plans/
│   │   ├── features/
│   │   ├── limits/
│   │   ├── addons/
│   │   ├── subscriptions/
│   │   ├── billing/
│   │   └── audit/
│   │
│   ├── tenant/
│   ├── branches/
│   ├── users/
│   ├── memberships/
│   ├── payments/
│   ├── checkin/
│   └── notifications/
│
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── interceptors/
│   └── exceptions/
```

Tuy nhiên về domain logic, tôi không khuyên tất cả nằm trong `admin`.

Ví dụ:

```text
SubscriptionService
EntitlementService
PlanService
```

có thể là module dùng chung, trong khi:

```text
AdminSubscriptionController
```

là API dành riêng cho Super Admin.

Điều này giúp tránh tình trạng:

```text
AdminModule quá lớn
```

---

# 17. Luồng nghiệp vụ Super Admin tổng thể

```text
SUPER ADMIN

       │

       ▼

Configure SaaS Product

       │

       ├── Create Features
       │
       ├── Create Add-ons
       │
       └── Create Plan
              │
              ├── Pricing
              ├── Features
              └── Limits

       ▼

Publish Plan

       │

       ▼

Tenant purchases Plan

       │

       ▼

Create Subscription

       │

       ▼

Generate Tenant Entitlement

       │

       ▼

Tenant can use Features
```

---

# 18. Bảng Business Rules quan trọng

| ID       | Business Rule                                                |
| -------- | ------------------------------------------------------------ |
| BR-SA-01 | Super Admin quản lý Platform, không thuộc Tenant             |
| BR-SA-02 | Không hard delete Tenant đã phát sinh dữ liệu                |
| BR-SA-03 | Tenant Status và Subscription Status độc lập                 |
| BR-SA-04 | Không hard delete Plan đang có Subscription                  |
| BR-SA-05 | Plan phải có Price trước khi Publish                         |
| BR-SA-06 | Feature Code không được thay đổi sau khi sử dụng             |
| BR-SA-07 | Subscription phải lưu Snapshot                               |
| BR-SA-08 | Thay đổi Plan mới không tự động ảnh hưởng Subscription cũ    |
| BR-SA-09 | Backend phải kiểm tra Entitlement trước khi cho phép Feature |
| BR-SA-10 | Backend phải kiểm tra Usage Limit trước khi tạo tài nguyên   |
| BR-SA-11 | Không Downgrade nếu Tenant đang vượt giới hạn                |
| BR-SA-12 | Add-on có thể làm thay đổi Entitlement                       |
| BR-SA-13 | Payment thành công mới kích hoạt quyền trả phí               |
| BR-SA-14 | Các hành động quản trị quan trọng phải có Audit Log          |
| BR-SA-15 | Tenant Override phải có lý do và lịch sử                     |

---

# Kết luận kiến trúc nghiệp vụ

Nếu tôi là BA phụ trách dự án FitFlow, tôi sẽ định nghĩa backend Super Admin theo chuỗi:

```text
PLATFORM
   │
   ▼
PRODUCT CONFIGURATION
   │
   ▼
PLAN + FEATURE + LIMIT + ADD-ON
   │
   ▼
SUBSCRIPTION
   │
   ▼
ENTITLEMENT
   │
   ▼
TENANT ACCESS
```

Điểm quan trọng nhất là **Entitlement**. Đây nên là “lớp kiểm soát quyền sử dụng sản phẩm” của toàn bộ hệ thống SaaS.

Nhờ đó, sau này bạn có thể thêm một tính năng mới, ví dụ:

```text
FACE_RECOGNITION_ADVANCED
```

Super Admin chỉ cần:

```text
1. Tạo Feature
2. Gán vào Plan hoặc Add-on
3. Tenant mua
4. Entitlement được cập nhật
```

và các API nghiệp vụ chỉ cần kiểm tra:

```text
Tenant có entitlement này không?
```

