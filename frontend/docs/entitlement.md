Bạn đang xây dựng giao diện Super Admin cho nền tảng SaaS quản lý phòng Gym có tên FitFlow.

Hãy thiết kế và implement lại hoàn chỉnh module:

"Plans & Features"
Tên tiếng Việt trên UI:
"Gói & Tính năng"

Đây là khu vực dành riêng cho FitFlow Super Admin để quản lý:
- Các gói SaaS
- Pricing
- Features
- Usage Limits
- Add-ons
- Feature Matrix
- Trial
- Plan Version
- Tenant đang sử dụng gói
- Lịch sử thay đổi cấu hình

==================================================
1. MỤC TIÊU
==================================================

Không xây dựng màn hình đơn giản kiểu:

Package -> Feature -> ON/OFF

Mà xây dựng theo mô hình SaaS chuyên nghiệp:

PLAN
  ↓
PLAN VERSION
  ↓
FEATURE ENTITLEMENTS
  ↓
USAGE LIMITS
  ↓
PRICING
  ↓
ADD-ONS
  ↓
SUBSCRIPTIONS
  ↓
TENANTS

Feature và Limit phải được tách biệt.

Ví dụ:

Feature:
- QR Check-in
- Face Recognition
- PT Management
- API Access
- Advanced Analytics

Limit:
- Maximum Members
- Maximum Staff
- Maximum Branches
- Maximum PT
- Storage
- Check-ins/month
- Emails/month

Không thiết kế database hoặc UI theo kiểu mỗi feature là một column boolean cố định.

Hệ thống phải có khả năng mở rộng thêm feature mà không phải thay đổi cấu trúc UI/database.

==================================================
2. STYLE GUIDE
==================================================

Thiết kế theo phong cách SaaS dashboard hiện đại, cao cấp, tối giản.

Brand:
FitFlow

Primary color:
Green FitFlow.

Phong cách:
- White background
- Soft gray borders
- Green accent
- Rounded corners 12-16px
- Subtle shadow
- Clean typography
- Dense nhưng dễ đọc
- Không quá nhiều gradient
- Không dùng glassmorphism quá mức
- Không sử dụng icon AI-looking
- Không dùng emoji trong dashboard
- Icon dùng Lucide hoặc icon system đồng nhất
- Typography chuyên nghiệp
- Không quá nhiều màu

UI phải tạo cảm giác:

"Stripe Dashboard + Linear + modern SaaS admin"

nhưng vẫn giữ identity FitFlow.

==================================================
3. SIDEBAR
==================================================

Giữ sidebar giống hệ thống hiện tại.

Header:

FitFlow
SAAS CONTROL CENTER

Menu:

PLATFORM

- Tổng quan
- Tenants
- Analytics

BUSINESS

- Gói & Tính năng
- Add-ons
- Subscriptions
- Hóa đơn SaaS

OPERATIONS

- System Health
- Usage & Limits
- Notifications

ADMINISTRATION

- Nhân sự nền tảng
- Audit Logs
- Platform Settings

"Gói & Tính năng" đang active.

Active state:
- Background xanh rất nhạt
- Text xanh
- Left indicator màu xanh
- Icon xanh

==================================================
4. TOP HEADER
==================================================

Top header giống dashboard hiện tại.

Bao gồm:

Search:

"Tìm tenant, gói cước, hóa đơn, user..."

Shortcut:

⌘K

Right side:

System status:
"All systems operational"

Notification icon

Dark mode toggle

Divider

Super Admin profile:

Avatar:
FA

FitFlow Super Admin
admin@fitflow.vn

Dropdown arrow

==================================================
5. PAGE HEADER
==================================================

Title:

Gói & Tính năng

Subtitle:

"Quản lý các gói SaaS, tính năng, giới hạn sử dụng và pricing."

Right side:

Button:
"+ Feature mới"

Button:
"+ Gói mới"

Primary button:
"+ Gói mới"

Secondary:
"+ Feature mới"

==================================================
6. TAB NAVIGATION
==================================================

Ngay dưới Page Header tạo tab navigation:

[ Gói ] [ Tính năng ] [ Giới hạn ] [ So sánh gói ]

Không cần đưa Add-ons vào tab này vì Add-ons đã có module riêng.

Tab active:
Gói

==================================================
7. TAB 1 — GÓI
==================================================

Layout desktop:

2 columns.

Left:
320px

Right:
flex 1

Left column là danh sách Plans.

Right column là chi tiết Plan đang chọn.

--------------------------------------------------
7.1 PLAN LIST
--------------------------------------------------

Header:

"Gói"

Có search:

"Tìm gói..."

Filter:

[ Tất cả ▼ ]

Các plan mẫu:

1. Gói Cơ Bản
Code:
BASIC

490.000 ₫ / tháng

● Đang bán

2. Gói Chuyên Nghiệp
PRO

990.000 ₫ / tháng

● Đang bán

3. Gói Doanh Nghiệp
ENTERPRISE

2.490.000 ₫ / tháng

● Đang bán

4. Gói Dùng Thử
TRIAL

14 ngày

● Đang hoạt động

Mỗi plan card hiển thị:

Tên
Price
Status
Số tenant đang sử dụng

Ví dụ:

Gói Cơ Bản
490.000 ₫ / tháng

12 tenants

● Đang bán

--------------------------------------------------
7.2 ACTIVE PLAN
--------------------------------------------------

Plan đang active phải có:

- Background green tint
- Left green indicator
- Border green nhẹ

Không dùng màu xanh quá đậm.

--------------------------------------------------
7.3 PLAN DETAIL
--------------------------------------------------

Khi chọn:

"Gói Cơ Bản"

hiển thị:

Header:

Gói Cơ Bản

Badge:
● Đang bán

Code:
BASIC

Description:

"Giải pháp quản lý cơ bản dành cho phòng gym nhỏ."

Actions:

[ ... ]

Dropdown:

- Chỉnh sửa
- Nhân bản
- Xem tenants
- Tạo version mới
- Ngừng bán
- Archive

--------------------------------------------------
8. PLAN SUMMARY
--------------------------------------------------

Ngay dưới header:

4 summary cards nhỏ:

Price

490.000 ₫
/ tháng

Tenants

12
đang sử dụng

Features

8
features enabled

Limits

6
limits configured

Không cần card quá lớn.

==================================================
9. PLAN CONFIGURATION
==================================================

Chia thành các section:

1. Overview
2. Pricing
3. Features
4. Limits
5. Trial
6. Subscription behavior

Có thể sử dụng vertical tabs hoặc section navigation.

==================================================
10. OVERVIEW
==================================================

Fields:

Plan name

[Gói Cơ Bản]

Plan code

[BASIC]

Description

[Giải pháp quản lý phòng gym nhỏ...]

Status

[● Đang bán ▼]

Display order

[1]

Visibility

[Public ▼]

Có:

Created:
08/09/2026

Last modified:
08/09/2026

Modified by:
FitFlow Super Admin

==================================================
11. PRICING
==================================================

Plan phải hỗ trợ nhiều billing cycle.

Billing options:

Monthly
Yearly
Custom

UI:

--------------------------------

Monthly

490.000 ₫
/ tháng

Status:
● Active

--------------------------------

Yearly

4.900.000 ₫
/ năm

Discount:
16.6%

● Active

--------------------------------

Có nút:

"+ Thêm pricing"

Pricing fields:

Amount
Currency
Billing cycle
Trial period
Setup fee
Discount
Tax behavior
Active status

Currency mặc định:

VND

==================================================
12. FEATURES
==================================================

Không hiển thị tất cả feature thành một danh sách dài.

Chia theo category.

Category:

CHECK-IN & ATTENDANCE

MEMBERSHIP

TRAINING & PT

COMMUNICATION

ANALYTICS

AUTOMATION

INTEGRATION

SECURITY

--------------------------------------------------
12.1 FEATURE ITEM
--------------------------------------------------

Ví dụ:

Check-in bằng QR

QR_CHECKIN

"Cho phép hội viên check-in bằng QR."

Toggle:

ON

Feature item phải có:

Feature name
Feature key
Description
Status
Type

--------------------------------------------------
12.2 FEATURE TYPE
--------------------------------------------------

Feature có thể có:

Boolean
Limit
Usage-based
Tier

Boolean:

ON/OFF

Limit:

Có giá trị giới hạn.

Usage-based:

Giới hạn theo số lần sử dụng.

Tier:

Basic / Advanced / Enterprise

UI phải render khác nhau tùy type.

==================================================
13. FEATURES SAMPLE
==================================================

CHECK-IN & ATTENDANCE

QR Check-in
QR_CHECKIN
Boolean

Face Recognition
FACE_RECOGNITION
Boolean

Attendance Analytics
ATTENDANCE_ANALYTICS
Boolean


MEMBERSHIP

Membership Management
MEMBERSHIP_MANAGEMENT

Auto Renewal
AUTO_RENEWAL

Membership Expiration Alerts
MEMBERSHIP_EXPIRATION_ALERT


TRAINING & PT

PT Management
PT_MANAGEMENT

PT Booking
PT_BOOKING

Workout Plans
WORKOUT_PLANS


ANALYTICS

Basic Analytics
BASIC_ANALYTICS

Advanced Analytics
ADVANCED_ANALYTICS


COMMUNICATION

Email Notification
EMAIL_NOTIFICATION

SMS Notification
SMS_NOTIFICATION


INTEGRATION

API Access
API_ACCESS

Webhook
WEBHOOK


SECURITY

2FA
TWO_FACTOR_AUTH

Audit Logs
AUDIT_LOGS

==================================================
14. LIMITS
==================================================

Đây là module riêng.

Tab:

"Giới hạn"

Header:

"Giới hạn sử dụng"

Subtitle:

"Thiết lập tài nguyên tối đa mà tenant có thể sử dụng trong gói này."

Search:

"Tìm giới hạn..."

Categories:

ACCOUNT

MEMBERS

OPERATIONS

STORAGE

COMMUNICATION

--------------------------------------------------
14.1 LIMIT ITEM
--------------------------------------------------

Ví dụ:

Maximum Members

MAX_MEMBERS

Số hội viên tối đa

Value:

500

Unit:

members

Input:

[ 500 ]

Checkbox:

[ ] Unlimited

--------------------------------------------------

14.2 LIMITS SAMPLE
--------------------------------------------------

ACCOUNT

Maximum Staff
MAX_STAFF

10 users


Maximum Branches
MAX_BRANCHES

1 branch


MEMBERS

Maximum Members
MAX_MEMBERS

500 members


Maximum Active Members
MAX_ACTIVE_MEMBERS

500 members


TRAINING

Maximum PT
MAX_PT

5 PTs


Maximum PT Bookings / month
MAX_PT_BOOKINGS

500 bookings


OPERATIONS

Maximum Check-ins / month
MAX_CHECKINS_MONTH

10,000 check-ins


STORAGE

Storage
MAX_STORAGE

10 GB


COMMUNICATION

Emails / month
MAX_EMAILS_MONTH

10,000 emails


SMS / month
MAX_SMS_MONTH

1,000 SMS

==================================================
15. UNLIMITED
==================================================

Nếu unlimited:

Hiển thị:

∞ Unlimited

Backend:

NULL

Không dùng số cực lớn như:

999999999.

==================================================
16. FEATURE MATRIX
==================================================

Tab:

"So sánh gói"

Đây là màn hình cực kỳ quan trọng.

Hiển thị tất cả package theo columns.

Ví dụ:

                    Basic       Pro       Enterprise

QR Check-in          ✓           ✓            ✓

Face Recognition     —           ✓            ✓

PT Management        —           ✓            ✓

Advanced Analytics   —           ✓            ✓

API Access            —           ✓            ✓

Maximum Members      500        2,000       Unlimited

Maximum Staff        5           20          Unlimited

Branches              1            3          Unlimited

Storage               10GB        50GB       200GB

--------------------------------------------------

Có filter:

[ Features ]

[ Limits ]

[ All ]

Có search.

Feature enabled:
Green check.

Feature disabled:
Gray dash.

Unlimited:
∞

Matrix phải horizontally scroll được.

Header package sticky.

First column sticky.

==================================================
17. TRIAL
==================================================

Gói Trial phải hỗ trợ configuration riêng.

Trial configuration:

Trial duration

[14] days

Auto convert

[ ON ]

Convert to plan

[Gói Cơ Bản ▼]

Payment required

[ OFF ]

Allow multiple trial

[ OFF ]

Grace period

[3] days

Trial expiration behavior:

- Convert to paid plan
- Suspend tenant
- Read-only
- Delete after retention period

==================================================
18. SUBSCRIPTION BEHAVIOR
==================================================

Section:

"Subscription behavior"

Các option:

[✓] Áp dụng cho tenant đăng ký mới

[ ] Áp dụng cho tenant hiện tại

[✓] Giữ giá cũ cho tenant hiện tại

[✓] Giữ feature cũ cho tenant hiện tại

[ ] Migrate tenant sang version mới

Phải có explanation nhỏ bên dưới mỗi option.

==================================================
19. PLAN VERSIONING
==================================================

Đây là yêu cầu bắt buộc.

Không overwrite trực tiếp plan đang được tenant sử dụng.

Ví dụ:

Gói Cơ Bản

v1
490.000 ₫
500 members

v2
590.000 ₫
1,000 members

Tenant cũ có thể vẫn dùng:

v1

Tenant mới dùng:

v2

UI:

Current version

v2

Previous versions:

v1
Archived

Actions:

[View]

[Duplicate]

[Create new version]

==================================================
20. CREATE NEW VERSION
==================================================

Khi click:

"Tạo version mới"

Mở drawer/modal lớn.

Title:

Tạo phiên bản mới

Warning:

"Phiên bản mới sẽ không tự động thay đổi quyền lợi của tenant hiện tại."

Fields:

Version name

v3

Effective date

[date]

Pricing

...

Features

...

Limits

...

Migration behavior

○ Chỉ tenant mới

○ Cho phép tenant hiện tại nâng cấp

○ Migrate tất cả

Button:

[Hủy]

[Tạo version]

==================================================
21. TENANT USAGE
==================================================

Trong Plan Detail:

Card:

"Tenant đang sử dụng"

12 tenants

Usage:

24%

Nếu có capacity:

12 / 50 tenants

Button:

"Xem tất cả"

Click mở:

Tenant list.

Columns:

Tenant
Owner
Plan
Version
Status
Started
Renewal
Usage

==================================================
22. TENANT DETAIL
==================================================

Khi click tenant:

Hiển thị:

Tenant:

ABC Gym

Plan:

Gói Cơ Bản

Version:

v2

Started:

01/09/2026

Renewal:

01/10/2026

Features:

QR Check-in ✓
Face Recognition ✕
PT Management ✕

Limits:

Members
423 / 500

Staff
4 / 10

Branches
1 / 1

Storage
6.4 / 10 GB

Usage bars.

==================================================
23. WARNING SYSTEM
==================================================

Khi chỉnh sửa plan:

Hiển thị warning rõ ràng.

Ví dụ:

⚠ Thay đổi này chỉ áp dụng cho thuê bao mới.

"12 tenant hiện tại đang sử dụng cấu hình của phiên bản v1."

Actions:

[Xem tenant bị ảnh hưởng]

[Tạo version mới]

Nếu muốn áp dụng tenant hiện tại:

confirmation.

==================================================
24. DANGEROUS CHANGE CONFIRMATION
==================================================

Nếu thay đổi:

Price

Feature

Limit

Subscription behavior

hiển thị confirmation nếu ảnh hưởng tenant hiện tại.

Ví dụ:

"Bạn đang thay đổi giới hạn hội viên."

Current:

500 members

New:

300 members

Affected tenants:

12

Potential impact:

3 tenants đang vượt giới hạn mới.

Buttons:

[Hủy]

[Xác nhận thay đổi]

Nếu giảm limit khiến tenant hiện tại vượt giới hạn:

KHÔNG tự động xóa dữ liệu.

Chỉ:

- block creation mới
- show warning
- giữ dữ liệu hiện tại

==================================================
25. AUDIT LOG
==================================================

Mọi thay đổi package phải ghi audit log.

Ví dụ:

08/09/2026 11:20

FitFlow Super Admin

Enabled:

FACE_RECOGNITION

08/09/2026 11:15

FitFlow Super Admin

Changed:

MAX_MEMBERS

500 → 1,000

08/09/2026 11:10

FitFlow Super Admin

Changed price:

490,000 → 590,000

Audit record:

actor
action
entity
entity_id
before
after
timestamp
reason

==================================================
26. CREATE FEATURE
==================================================

Button:

"+ Feature mới"

Mở drawer.

Fields:

Feature name

[Face Recognition]

Feature key

[FACE_RECOGNITION]

Category

[Security ▼]

Description

[Nhận diện khuôn mặt...]

Type:

○ Boolean

○ Limit

○ Usage-based

○ Tier

Status:

Active

Có preview:

Feature sẽ hiển thị như:

Face Recognition

FACE_RECOGNITION

Nhận diện khuôn mặt khi check-in

[ ON ]

Button:

[Hủy]

[Tạo feature]

Feature key phải unique.

Không cho sửa key sau khi đã được sử dụng.

==================================================
27. CREATE PLAN
==================================================

Button:

"+ Gói mới"

Drawer/full page.

Step-based configuration:

STEP 1

Basic Information

STEP 2

Pricing

STEP 3

Features

STEP 4

Limits

STEP 5

Review

Review:

Plan:

Gói Chuyên Nghiệp

Price:

990.000 ₫ / tháng

Features:

12 enabled

Limits:

8 configured

Button:

[Tạo gói]

==================================================
28. DUPLICATE PLAN
==================================================

Có action:

"Nhân bản"

Ví dụ:

Duplicate:

Gói Cơ Bản

→

Gói Cơ Bản Copy

Không copy:

Tenant subscriptions.

Chỉ copy:

- Features
- Limits
- Pricing configuration

==================================================
29. STOP SELLING PLAN
==================================================

Action:

"Ngừng bán"

Không được delete plan nếu đang có tenant sử dụng.

Khi stop selling:

Status:

● Không còn bán

Existing tenants:

Không bị ảnh hưởng.

New tenant:

Không thể subscribe.

UI:

"12 tenant hiện tại vẫn đang sử dụng gói này."

==================================================
30. DELETE PLAN
==================================================

Không cho delete nếu:

plan đang có subscription.

Chỉ cho:

Archive.

Plan không còn subscription:

Có thể archive.

Không hard delete trong UI.

==================================================
31. ADD-ON INTEGRATION
==================================================

Plan có thể sử dụng Add-on.

Ví dụ:

Professional:

990.000 ₫

Optional Add-ons:

Face Recognition
+299.000 ₫ / tháng

Extra Branch
+199.000 ₫ / tháng

SMS Pack
+99.000 ₫

Không đưa toàn bộ Add-on vào plan feature.

Add-on là entitlement bổ sung.

==================================================
32. ENTITLEMENT LOGIC
==================================================

Final entitlement của tenant:

Base Plan
+
Plan Version
+
Add-ons
+
Overrides nếu có

Ví dụ:

Tenant ABC:

Plan:
Professional v2

Features:

QR_CHECKIN = true
FACE_RECOGNITION = true
PT_MANAGEMENT = true

Limits:

MAX_MEMBERS = 2,000
MAX_STAFF = 20
MAX_BRANCHES = 3

Add-on:

Extra Branch

Final:

MAX_BRANCHES = 4

==================================================
33. OVERRIDE
==================================================

Super Admin có thể override entitlement của một tenant nếu cần.

Ví dụ:

Plan:

500 members

Override:

1,000 members

UI phải hiển thị:

Plan limit:
500

Override:
1,000

Effective:
01/09/2026

Expires:
01/12/2026

Reason:
Enterprise custom agreement

Status:

● Active

Override phải có Audit Log.

==================================================
34. RESPONSIVE
==================================================

Desktop:

Sidebar:
280px

Main content:
responsive

Plan list:
300-320px

Detail:
flex

Tablet:

Plan list có thể trở thành drawer.

Mobile:

Không cố ép 2-column.

Dùng:

Plan selector

↓ 

Plan detail

Tabs horizontal scroll.

Feature matrix:

horizontal scroll.

==================================================
35. LOADING STATES
==================================================

Không dùng blank screen.

Dùng skeleton:

Plan list skeleton.

Plan detail skeleton.

Feature skeleton.

Matrix skeleton.

==================================================
36. EMPTY STATES
==================================================

Nếu chưa có plan:

Icon

"Chưa có gói nào"

"Bạn chưa tạo gói SaaS nào."

Button:

"+ Tạo gói đầu tiên"

Nếu chưa có feature:

"Chưa có tính năng"

"+ Tạo feature"

==================================================
37. ERROR STATES
==================================================

API error:

"Không thể tải dữ liệu."

Button:

"Thử lại"

Save error:

"Không thể lưu thay đổi. Vui lòng thử lại."

Không dùng alert browser.

Dùng toast.

==================================================
38. SUCCESS TOAST
==================================================

Ví dụ:

"Đã cập nhật Gói Cơ Bản."

"Đã tạo feature FACE_RECOGNITION."

"Đã tạo version v3."

==================================================
39. UNSAVED CHANGES
==================================================

Nếu user chỉnh sửa nhưng chưa save:

Hiển thị:

"Bạn có thay đổi chưa được lưu."

Actions:

[Lưu thay đổi]

[Bỏ thay đổi]

Nếu user rời page:

Confirmation:

"Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời trang?"

==================================================
40. SEARCH
==================================================

Search toàn module.

Có thể search:

Plan name
Plan code
Feature name
Feature key
Limit name

Ví dụ:

"Tìm: FACE"

→

Face Recognition

FACE_RECOGNITION

==================================================
41. FILTER
==================================================

Plan filter:

All
Active
Draft
Archived
Not for sale

Feature filter:

All
Enabled
Disabled
Boolean
Limit
Usage-based

==================================================
42. SORT
==================================================

Plan:

Name
Price
Tenants
Created date

Features:

Name
Category
Usage
Created date

==================================================
43. DATA MODEL
==================================================

Thiết kế backend/database theo mô hình:

plans

id
name
code
description
status
visibility
display_order
created_at
updated_at

plan_versions

id
plan_id
version
status
effective_at
created_at
created_by

plan_prices

id
plan_version_id
billing_cycle
amount
currency
trial_days
setup_fee
discount
is_active

features

id
name
key
description
category
type
status
created_at
updated_at

plan_features

id
plan_version_id
feature_id
enabled
configuration

limits

id
name
key
description
unit
type
status

plan_limits

id
plan_version_id
limit_id
value
is_unlimited

addons

id
name
code
description
pricing
status

addon_features

id
addon_id
feature_id

addon_limits

id
addon_id
limit_id
value

subscriptions

id
tenant_id
plan_id
plan_version_id
status
started_at
renewal_at
ended_at

subscription_addons

id
subscription_id
addon_id
quantity
price

tenant_entitlement_overrides

id
tenant_id
feature_id
limit_id
value
enabled
effective_at
expires_at
reason
created_by

audit_logs

id
actor_id
action
entity_type
entity_id
before_data
after_data
reason
created_at

==================================================
44. IMPORTANT DATABASE RULE
==================================================

KHÔNG thiết kế:

plans:

qr_checkin BOOLEAN
face_recognition BOOLEAN
pt_management BOOLEAN
max_members INTEGER
max_staff INTEGER

vì hệ thống sẽ khó mở rộng.

Phải dùng:

plans
plan_versions
features
plan_features
limits
plan_limits

==================================================
45. API DESIGN
==================================================

API dự kiến:

GET /admin/plans

GET /admin/plans/:id

POST /admin/plans

PATCH /admin/plans/:id

POST /admin/plans/:id/versions

GET /admin/plans/:id/versions

GET /admin/features

POST /admin/features

PATCH /admin/features/:id

GET /admin/limits

POST /admin/limits

PATCH /admin/limits/:id

GET /admin/plans/:id/features

PUT /admin/plans/:id/features

GET /admin/plans/:id/limits

PUT /admin/plans/:id/limits

GET /admin/plans/matrix

GET /admin/plans/:id/tenants

GET /admin/plans/:id/audit-logs

==================================================
46. IMPORTANT BUSINESS RULES
==================================================

RULE 1:

Không được delete plan đang được subscription.

RULE 2:

Không được delete feature đang được plan sử dụng.

RULE 3:

Không được sửa feature key sau khi đã được sử dụng.

RULE 4:

Plan đang được tenant sử dụng phải có version.

RULE 5:

Thay đổi plan không được tự động thay đổi tenant hiện tại nếu chưa xác nhận.

RULE 6:

Tenant cũ có thể tiếp tục dùng plan version cũ.

RULE 7:

Tenant mới sử dụng current version.

RULE 8:

Giảm limit không được xóa dữ liệu tenant.

RULE 9:

Nếu current usage > new limit:

Không cho tạo thêm dữ liệu.

RULE 10:

Mọi thay đổi pricing/feature/limit phải audit.

RULE 11:

Stop selling không ảnh hưởng tenant hiện tại.

RULE 12:

Archive khác Delete.

RULE 13:

Unlimited được lưu bằng NULL.

==================================================
47. UX DETAIL
==================================================

Không mở quá nhiều modal nhỏ.

Ưu tiên:

Drawer lớn

hoặc

Full-page configuration.

Các thao tác nguy hiểm dùng confirmation modal.

Các thao tác đơn giản dùng inline editing.

Ví dụ:

Feature ON/OFF:

inline.

Limit:

inline numeric input.

Pricing:

drawer.

Create Plan:

full-page hoặc large drawer.

Create Feature:

drawer.

Create Version:

large drawer.

==================================================
48. ANIMATION
==================================================

Animation phải nhẹ và chuyên nghiệp.

Không dùng animation quá nhiều.

Khi chuyển tab:

fade/slide nhẹ.

Khi chọn plan:

detail panel transition 150-200ms.

Toggle:

smooth.

Drawer:

slide-in 200-250ms.

Toast:

fade + slide.

Card hover:

subtle elevation.

Không dùng:

bouncing animation

neon glow

excessive floating elements

==================================================
49. ACCESSIBILITY
==================================================

Tất cả:

button
input
toggle
tabs

phải keyboard accessible.

Focus state rõ ràng.

Tooltip cho icon-only button.

Không dùng màu sắc duy nhất để biểu thị status.

Ví dụ status phải có:

● Đang bán

không chỉ chấm xanh.

==================================================
50. FINAL VISUAL STRUCTURE
==================================================

Trang chính:

FitFlow Super Admin

        ↓

Gói & Tính năng

Quản lý các gói SaaS, tính năng, giới hạn sử dụng và pricing.

                         + Feature mới
                         + Gói mới

------------------------------------------------

[ Gói ] [ Tính năng ] [ Giới hạn ] [ So sánh gói ]

------------------------------------------------

LEFT

Gói

Search

Gói Cơ Bản
490.000 ₫
12 tenants
● Đang bán

Gói Chuyên Nghiệp
990.000 ₫
8 tenants
● Đang bán

Gói Doanh Nghiệp
2.490.000 ₫
3 tenants
● Đang bán

Gói Dùng Thử
14 ngày
24 tenants
● Active

------------------------------------------------

RIGHT

Gói Cơ Bản

● Đang bán

490.000 ₫ / tháng

12 tenants đang sử dụng

------------------------------------------------

[ Tổng quan ]

Plan information

------------------------------------------------

[ Pricing ]

490.000 ₫ / month
4.900.000 ₫ / year

------------------------------------------------

[ Features ]

CHECK-IN & ATTENDANCE

QR Check-in                    ON
Face Recognition               OFF

MEMBERSHIP

Membership Management         ON
Auto Renewal                   ON

TRAINING & PT

PT Management                 OFF

------------------------------------------------

[ Limits ]

Members                       500
Staff                           5
Branches                        1
Storage                        10 GB

------------------------------------------------

[ Subscription behavior ]

Apply to new tenants          ✓
Keep existing tenants         ✓

------------------------------------------------

⚠ Thay đổi này chỉ áp dụng cho thuê bao mới.
12 tenant hiện tại đang sử dụng version cũ.

                       [Tạo version mới]
                       [Lưu thay đổi]

==================================================
51. DESIGN QUALITY
==================================================

Giao diện phải trông giống một sản phẩm SaaS thực tế đã production-ready.

Không tạo cảm giác:

- Demo
- Template AI
- Dashboard sinh tự động
- Quá nhiều card
- Quá nhiều màu
- Quá nhiều icon

Ưu tiên:

Hierarchy
Whitespace
Typography
Consistency
Information density
Clear actions

Mỗi màn hình phải có:

Clear title
Clear subtitle
Primary action
Secondary action
Search/filter nếu cần
Empty state
Loading state
Error state
Success state

==================================================
52. TECHNOLOGY
==================================================

Frontend:

React / Next.js

TypeScript

Tailwind CSS

shadcn/ui hoặc component system tương đương

Lucide icons

Backend:

NestJS

Prisma

PostgreSQL

Architecture:

Modular

Reusable components

Strong typing

API-driven

Không hard-code plan/feature data trong component.

Mock data chỉ được dùng để preview UI.

Tất cả data phải được thiết kế để sau này kết nối API thật.

==================================================
53. COMPONENT ARCHITECTURE
==================================================

Tách component:

PlansPage

PlanList

PlanListItem

PlanDetail

PlanHeader

PlanSummary

PlanOverview

PlanPricing

PlanFeatures

PlanLimits

PlanTrial

PlanSubscriptionBehavior

FeatureList

FeatureListItem

FeatureCategory

LimitList

LimitListItem

FeatureMatrix

CreatePlanDrawer

CreateFeatureDrawer

CreateVersionDrawer

PlanDangerConfirmation

TenantUsageDrawer

AuditLogDrawer

UnsavedChangesDialog

==================================================
54. FINAL REQUIREMENT
==================================================

Hãy implement toàn bộ UI theo đặc tả trên.

Ưu tiên đầu tiên:

1. Visual quality
2. UX
3. Component architecture
4. State management
5. Data model readiness
6. API readiness
7. Responsive
8. Accessibility

Không bỏ qua loading/error/empty states.

Không đơn giản hóa Feature thành danh sách toggle.

Không hard-code entitlement logic vào UI.

Thiết kế phải sẵn sàng để FitFlow mở rộng từ:

3-5 plans

10-20 features

đến:

20+ plans
100+ features
hàng nghìn tenants

mà không phải redesign architecture.

Hãy sử dụng dữ liệu mẫu thực tế của FitFlow để giao diện ngay khi chạy đã giống một SaaS production dashboard.