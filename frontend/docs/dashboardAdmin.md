Bạn đang làm việc trên hệ thống SaaS có tên FITFLOW.

FITFLOW là nền tảng SaaS dùng để cho thuê phần mềm quản lý phòng Gym/Fitness Center cho nhiều Tenant.

Tôi cần thiết kế lại hoàn toàn trang Dashboard dành cho SUPER ADMIN.

QUAN TRỌNG:

- Đây KHÔNG phải dashboard dành cho chủ phòng Gym.
- Đây là dashboard dành cho người quản trị toàn bộ nền tảng FitFlow.
- Super Admin cần nhìn dashboard và trong khoảng 5–10 giây phải biết:
  1. Nền tảng đang có bao nhiêu Tenant
  2. Doanh thu hiện tại
  3. Tăng trưởng SaaS
  4. Subscription đang hoạt động
  5. Có vấn đề thanh toán nào không
  6. Hệ thống có đang hoạt động ổn định không
  7. Tenant nào đang có vấn đề
  8. Những hành động nào Super Admin cần xử lý ngay

Hãy sử dụng screenshot dashboard hiện tại làm baseline về layout, nhưng KHÔNG sao chép nguyên trạng.

Mục tiêu là biến dashboard hiện tại thành một "SaaS Control Center" chuyên nghiệp, hiện đại, tinh tế và có tính vận hành thực tế.

==================================================
1. DESIGN DIRECTION
==================================================

Phong cách tổng thể:

- Modern SaaS
- Premium
- Clean
- Minimal
- Professional
- Enterprise-ready
- Không sử dụng phong cách "AI dashboard"
- Không dùng quá nhiều gradient
- Không dùng glassmorphism quá mức
- Không sử dụng neon
- Không dùng quá nhiều icon
- Không sử dụng những icon 3D màu mè
- Không làm giao diện giống dashboard AI
- Không làm giao diện giống crypto dashboard

Hãy tham khảo tinh thần thiết kế của:

- Stripe Dashboard
- Linear
- Vercel
- Raycast
- Notion
- Modern Enterprise SaaS

NHƯNG không sao chép trực tiếp UI của bất kỳ sản phẩm nào.

FitFlow phải có nhận diện riêng.

==================================================
2. COLOR SYSTEM
==================================================

Primary brand color:

FitFlow Green.

Sử dụng xanh lá làm accent chính.

Màu sắc:

- Background: #FAFAFA hoặc gần trắng
- Card: #FFFFFF
- Border: rất nhẹ
- Text primary: gần đen
- Text secondary: xám
- Primary: FitFlow Green
- Success: xanh lá
- Warning: vàng/cam
- Error: đỏ
- Info: xanh dương

Không sử dụng quá nhiều màu.

Chỉ dùng màu mạnh khi cần biểu thị:

- success
- warning
- error
- active
- status

==================================================
3. TYPOGRAPHY
==================================================

Sử dụng font hiện đại, dễ đọc.

Ưu tiên:

Inter hoặc Geist.

Typography phải có hierarchy rõ:

Page title:
28–32px
font-weight 600–700

Section title:
16–18px
font-weight 600

KPI:
28–36px
font-weight 600–700

Body:
14–15px

Secondary:
13px

Không dùng font quá futuristic.

Không dùng typography mang cảm giác AI.

==================================================
4. GLOBAL LAYOUT
==================================================

Giữ sidebar bên trái nhưng tổ chức lại rõ ràng hơn.

Layout:

----------------------------------------
Sidebar | Topbar
        |-------------------------------
        | Main Dashboard
----------------------------------------

Sidebar:

width khoảng 250–280px desktop.

Có thể collapse xuống khoảng 72px.

Sidebar background:

#FFFFFF

Có border-right nhẹ.

Logo:

FitFlow

Có logo icon màu xanh.

==================================================
5. SIDEBAR STRUCTURE
==================================================

Thiết kế sidebar theo nhóm.

GROUP 1:

PLATFORM

- Tổng quan
- Tenants
- Analytics

GROUP 2:

BUSINESS

- Gói & Tính năng
- Add-ons
- Subscriptions
- Billing
- Hóa đơn SaaS

GROUP 3:

OPERATIONS

- System Health
- Usage & Limits
- Notifications

GROUP 4:

ADMINISTRATION

- Nhân sự nền tảng
- Roles & Permissions
- Audit Logs
- Settings

Sidebar phải có:

- active state
- hover state
- icon
- tooltip khi collapsed
- badge khi có cảnh báo

Ví dụ:

Subscriptions       [7]
System Health        [!]
Audit Logs

Badge chỉ xuất hiện khi thực sự có vấn đề.

==================================================
6. TOPBAR
==================================================

Topbar hiện đại và tối giản.

Bên trái:

Global Search.

Placeholder:

"Search tenants, subscriptions, invoices..."

Shortcut:

⌘ K

Search phải hỗ trợ:

- Tenant
- User
- Subscription
- Invoice
- Domain
- Email

Bên phải:

- System status
- Notification
- Theme toggle
- Super Admin profile

Ví dụ:

● All systems operational

Notification:

🔔 7

Avatar:

FA

FitFlow Super Admin
admin@fitflow.vn

Dropdown:

- Profile
- Preferences
- Security
- Logout

==================================================
7. DASHBOARD HEADER
==================================================

Phần đầu main content:

Good morning, Super Admin

hoặc:

Tổng quan nền tảng

Subtitle:

"The current health and performance of your FitFlow platform."

Bên phải:

Date range selector:

Today
7 days
30 days
3 months
12 months
Custom

Và nút:

+ Create Tenant

Quick Actions.

==================================================
8. PLATFORM STATUS BANNER
==================================================

Ngay dưới header.

Nếu hệ thống bình thường:

----------------------------------------
● All systems operational

API, Database, Redis and Storage
are operating normally.

Last checked 10 seconds ago
----------------------------------------

Màu nhẹ, không quá nổi.

Nếu có lỗi:

----------------------------------------
⚠ 2 services require attention

API latency is higher than usual.

View system health →
----------------------------------------

Nếu hệ thống bình thường không cần chiếm quá nhiều diện tích.

==================================================
9. KPI SECTION
==================================================

Thiết kế 6 KPI cards.

Không làm card quá cao.

Grid:

6 cards desktop

3 cards tablet

2 cards mobile

KPI 1:

MRR

99.000.000 ₫

+12.4%

vs last month

Icon:
Revenue

KPI 2:

Active Tenants

124

+8

this month

KPI 3:

Total Users

18,492

+14.2%

vs last month

KPI 4:

ARR

1.188.000.000 ₫

+11.8%

annualized

KPI 5:

Churn Rate

2.4%

-0.6%

vs last month

KPI 6:

Failed Payments

7

Needs attention

KPI cards phải có:

- label
- value
- comparison
- trend
- small icon
- subtle hover
- clickable

Không sử dụng biểu đồ mini quá phức tạp trong tất cả cards.

==================================================
10. KPI INTERACTION
==================================================

Khi hover:

card nâng nhẹ.

Khi click:

KPI dẫn đến module tương ứng.

Ví dụ:

MRR
→ Billing Analytics

Active Tenants
→ Tenant Management

Total Users
→ Platform Users / Usage

Churn
→ Subscription Analytics

Failed Payments
→ Billing / Failed Payments

==================================================
11. REVENUE ANALYTICS
==================================================

Tạo section lớn:

Revenue Overview

Card width khoảng 65%.

Header:

Revenue Overview

Tabs:

Revenue
MRR
ARR
New Subscriptions
Renewals

Date filter:

7D
30D
3M
6M
12M

Biểu đồ line/area tối giản.

Không dùng 3D chart.

Không dùng quá nhiều màu.

Tooltip khi hover:

September 8
MRR: 99.000.000 ₫
New subscriptions: 8
Renewals: 14

Có thể toggle:

Revenue
MRR
ARR

Phía trên chart:

Current:
99.000.000 ₫

Growth:
+12.4%

==================================================
12. TENANT GROWTH
==================================================

Bên cạnh Revenue Overview:

Tenant Growth

Hiển thị:

New Tenants
Churned Tenants
Net Growth

Biểu đồ:

bar chart hoặc line chart.

Ví dụ:

Jan
New: 12
Churned: 2

Feb
New: 18
Churned: 3

Mar
New: 25
Churned: 4

Có legend rõ ràng.

==================================================
13. TENANT STATUS
==================================================

Tạo section:

Tenant Overview

Hiển thị các trạng thái:

Active
Trial
Suspended
Past Due
Cancelled

Ví dụ:

Active       102
Trial          8
Past Due       7
Suspended      4
Cancelled      3

Có thể sử dụng:

horizontal progress
hoặc donut chart rất tối giản.

Không làm donut quá lớn.

Khi click vào status:

→ filter Tenant list.

==================================================
14. ACTION REQUIRED
==================================================

Đây là section rất quan trọng.

Tạo card:

Action Required

Hiển thị những vấn đề Super Admin cần xử lý.

Ví dụ:

⚠ 7 failed payments
   7 subscriptions could not be charged.

   Review payments →

⚠ 5 tenants expiring soon
   Subscription expires within 7 days.

   View subscriptions →

⚠ 2 suspended tenants

   Review tenants →

⚠ 1 tenant exceeded storage limit

   View usage →

Mỗi item:

- icon
- severity
- title
- description
- CTA

Không hiển thị nếu không có vấn đề.

==================================================
15. PLATFORM HEALTH
==================================================

Tạo card:

Platform Health

Services:

API
Database
Redis
Storage
Background Jobs
Face Recognition API

Ví dụ:

API
Operational
99.98%

Database
Operational
99.99%

Redis
Operational
99.95%

Storage
Operational
99.99%

Background Jobs
Operational

Face Recognition
Operational

Mỗi service có:

● status

latency hoặc uptime.

Ví dụ:

API
99.98% uptime
124ms

Database
99.99%
42ms

Nếu có lỗi:

● Degraded

Nếu nghiêm trọng:

● Down

Click:

View System Health →

==================================================
16. TOP TENANTS
==================================================

Tạo bảng:

Top Tenants

Columns:

Tenant
Plan
MRR
Users
Usage
Health
Status

Ví dụ:

Fitness 365
Pro
4.990.000 ₫
1,240 users
82%
92
Active

Gym ABC
Pro
4.990.000 ₫
920 users
76%
88
Active

Power Gym
Basic
1.990.000 ₫
520 users
91%
67
Active

FitZone
Pro
4.990.000 ₫
480 users
43%
42
At Risk

Table phải:

- sortable
- searchable
- clickable
- pagination

Click Tenant:

→ Tenant Detail.

==================================================
17. TENANT HEALTH SCORE
==================================================

Mỗi Tenant có Health Score.

Ví dụ:

92
88
67
42

Màu:

80–100:
Healthy

60–79:
Needs attention

<60:
At risk

Health Score được tính dựa trên:

Usage
Engagement
Subscription
Payment
Feature adoption

Hiển thị dạng:

92 Healthy

hoặc progress ring nhỏ.

Không cần AI ở giai đoạn đầu.

==================================================
18. PLATFORM USAGE
==================================================

Tạo section:

Platform Usage

Metrics:

Active Users Today
8,421

Check-ins Today
12,482

Face Recognition
9,821

API Requests
1.2M

Storage Used
328 GB

Notifications Sent
4,291

Có comparison:

+14.2%
+18.3%
+23.1%

Date range:

Today
7 days
30 days

==================================================
19. RECENT ACTIVITY
==================================================

Tạo timeline:

Recent Activity

09:42
Fitness 365 upgraded to Pro

09:35
New Tenant created
Power Gym

09:21
Payment received
2.990.000 ₫

09:05
Subscription changed
Gym ABC

08:51
Tenant suspended
Gym Premium

Mỗi event:

- timestamp
- actor
- action
- target
- status

CTA:

View all activity →

Dẫn đến Audit Logs.

==================================================
20. QUICK ACTIONS
==================================================

Tạo Quick Actions menu.

Các action:

Create Tenant
Create Plan
Create Add-on
Create Subscription
View Failed Payments
Search Tenant
View Audit Logs

Có thể mở bằng:

⌘ K

hoặc nút:

Quick Actions

==================================================
21. NOTIFICATION CENTER
==================================================

Notification dropdown:

Notifications

7 unread

Categories:

Billing
Tenant
System
Security

Ví dụ:

Billing:
Payment failed for Gym ABC

System:
API latency increased

Tenant:
New tenant created

Security:
New admin login

Có:

Mark as read
Mark all as read

==================================================
22. EMPTY STATES
==================================================

Phải thiết kế empty state cho tất cả module.

Ví dụ:

Không có failed payment:

✓

No payment issues

All subscriptions are up to date.

Không có alert:

✓ Everything looks good

Không có Tenant:

No tenants yet.

Create your first tenant.

Không được để UI trống hoặc chỉ hiện "No data".

==================================================
23. LOADING STATES
==================================================

Sử dụng skeleton loading.

Không sử dụng spinner toàn màn hình.

Mỗi KPI:

skeleton rectangle.

Chart:

skeleton chart area.

Table:

skeleton rows.

==================================================
24. ERROR STATES
==================================================

Nếu API lỗi:

Không làm toàn bộ dashboard trắng.

Hiển thị:

Unable to load revenue data.

Retry

Các section độc lập với nhau.

Nếu Revenue API lỗi:

Revenue card lỗi.

Tenant card vẫn hoạt động.

Platform Health vẫn hoạt động.

==================================================
25. RESPONSIVE
==================================================

Desktop:

>= 1440px

Dashboard rộng.

KPI:

6 columns.

Analytics:

2 columns.

Tablet:

3 KPI columns.

Mobile:

2 hoặc 1 column.

Sidebar:

collapse.

Charts:

responsive.

Tables:

horizontal scroll hoặc chuyển sang card.

Không để layout vỡ trên:

1366px
1280px
1024px
768px
390px

==================================================
26. MICRO INTERACTIONS
==================================================

Animation rất nhẹ.

Không làm animation quá nhiều.

Sử dụng:

- fade
- slide
- scale 1–2%
- number counter
- chart transition
- hover elevation

Duration:

150–250ms.

Page transition:

200–300ms.

Không sử dụng animation gây khó chịu.

==================================================
27. ICON SYSTEM
==================================================

Sử dụng một icon library thống nhất.

Ví dụ:

Lucide React.

Không trộn nhiều icon library.

Icon:

16–20px.

Không sử dụng icon quá lớn.

Không dùng emoji trong production UI.

Emoji chỉ dùng nếu thật sự cần.

==================================================
28. DATA VISUALIZATION
==================================================

Có thể sử dụng:

Recharts

hoặc thư viện chart hiện tại của project.

Charts cần:

- responsive
- tooltip
- legend
- hover
- animation
- accessible

Không dùng 3D chart.

Không dùng pie chart nếu không cần thiết.

==================================================
29. DATA MOCK
==================================================

Nếu backend chưa có API:

Tạo mock data service.

Không hard-code trực tiếp vào JSX.

Ví dụ:

dashboard.service.ts

hoặc:

mockDashboardData.ts

Structure:

dashboardStats
revenueData
tenantGrowth
tenantStatus
platformHealth
topTenants
recentActivities
alerts
usageMetrics

Khi backend hoàn thiện có thể thay API mà không cần thay UI.

==================================================
30. API ARCHITECTURE
==================================================

Dashboard nên chuẩn bị architecture để lấy:

GET /superadmin/dashboard/overview

GET /superadmin/dashboard/revenue

GET /superadmin/dashboard/tenant-growth

GET /superadmin/dashboard/platform-health

GET /superadmin/dashboard/usage

GET /superadmin/dashboard/activity

GET /superadmin/dashboard/alerts

Không gọi quá nhiều API riêng lẻ nếu có thể tạo:

GET /superadmin/dashboard

trả về aggregate data.

Có thể cache các metric không realtime.

Platform Health có thể refresh realtime.

==================================================
31. REALTIME
==================================================

Các dữ liệu sau nên có khả năng realtime:

Platform Health
Failed Payments
System Alerts
Recent Activity

Có thể sử dụng:

WebSocket
SSE
hoặc polling.

Không cần realtime cho:

ARR
Historical revenue
Tenant growth

==================================================
32. TENANT SEARCH
==================================================

Global search phải có thể tìm:

Tenant name
Tenant slug
Domain
Owner email
Subscription
Plan

Ví dụ user nhập:

"fitness"

Kết quả:

Fitness 365
fitness365.fitflow.vn
Owner: admin@fitness365.vn
Plan: Pro
Status: Active

==================================================
33. SECURITY
==================================================

Super Admin dashboard phải thể hiện security awareness.

Có thể thêm:

Last admin login

Suspicious activities

Failed admin login attempts

Recent role changes

API key activity

Nhưng không làm dashboard quá nặng.

Các dữ liệu nhạy cảm không được hiển thị trực tiếp nếu không cần thiết.

==================================================
34. DARK MODE
==================================================

Nếu hệ thống hiện tại đã hỗ trợ dark mode:

Thiết kế dark mode hoàn chỉnh.

Không chỉ đảo màu.

Dark mode phải có:

- background hierarchy
- border hierarchy
- text hierarchy
- chart colors
- status colors

Nếu chưa hỗ trợ dark mode:

Không cần implement ngay.

==================================================
35. PAGE HIERARCHY
==================================================

Thứ tự chính xác của Dashboard:

1. Header
2. Platform status
3. KPI
4. Revenue + Tenant Growth
5. Action Required + Platform Health
6. Tenant Overview
7. Platform Usage
8. Top Tenants
9. Recent Activity

Không làm tất cả thành các card giống nhau.

Phải có visual hierarchy.

==================================================
36. IMPORTANT UX PRINCIPLE
==================================================

Dashboard phải trả lời 4 câu hỏi:

WHAT?

FitFlow đang có gì?

→ KPI

WHY?

Tại sao các metric tăng/giảm?

→ Analytics

WHAT'S WRONG?

Có vấn đề gì?

→ Action Required + Platform Health

WHAT SHOULD I DO?

Tôi cần xử lý gì?

→ Quick Actions + CTA

==================================================
37. VISUAL HIERARCHY
==================================================

Không biến dashboard thành "wall of cards".

Ưu tiên:

KPI
↓
Charts
↓
Alerts
↓
Tables
↓
Activity

KPI nhỏ.

Chart lớn.

Alert rõ.

Table gọn.

Activity nhẹ.

==================================================
38. SUPER ADMIN MENTAL MODEL
==================================================

Hãy thiết kế dashboard theo mental model:

BUSINESS
Revenue
MRR
ARR
Churn
Subscriptions

CUSTOMERS
Tenants
Users
Growth
Health

USAGE
API
Storage
Face Recognition
Check-ins

OPERATIONS
System Health
Errors
Background Jobs

SECURITY
Admin activity
Audit logs
Suspicious activity

==================================================
39. FINAL VISUAL TARGET
==================================================

Dashboard cuối cùng phải tạo cảm giác:

"Đây là dashboard điều hành một SaaS platform thực sự."

Không phải:

"Đây là dashboard quản lý phòng Gym."

Không phải:

"Đây là dashboard AI."

Không phải:

"Đây là template admin dashboard."

FitFlow phải có cảm giác:

Premium
Trustworthy
Operational
Scalable
Modern
Professional

==================================================
40. DO NOT BREAK EXISTING SYSTEM
==================================================

Đây là yêu cầu cực kỳ quan trọng.

Trước khi code:

1. Inspect toàn bộ project.
2. Xác định framework.
3. Xác định routing.
4. Xác định component system.
5. Xác định UI library.
6. Xác định API/service hiện tại.
7. Xác định authentication.
8. Xác định role Super Admin.
9. Xác định các component đang được sử dụng.
10. Xác định data model.

KHÔNG được:

- Xóa backend.
- Thay đổi database schema nếu không cần.
- Xóa authentication.
- Xóa authorization.
- Xóa API hiện tại.
- Xóa các route hiện tại.
- Hard-code dữ liệu production.
- Thay đổi business logic chỉ để phục vụ UI.

Nếu backend chưa có dữ liệu:

→ dùng mock service abstraction.

Nếu component hiện tại đã tốt:

→ reuse.

Nếu có UI component library:

→ ưu tiên reuse.

==================================================
41. CODE QUALITY
==================================================

Code phải:

- componentized
- reusable
- typed
- maintainable
- responsive
- accessible

Không tạo một file JSX/TSX khổng lồ.

Tách:

DashboardPage
DashboardHeader
PlatformStatus
KpiGrid
KpiCard
RevenueChart
TenantGrowthChart
ActionRequired
PlatformHealth
TenantOverview
UsageOverview
TopTenants
RecentActivity

Ví dụ:

/components/superadmin/dashboard/

DashboardHeader.tsx
PlatformStatus.tsx
KpiGrid.tsx
KpiCard.tsx
RevenueOverview.tsx
TenantGrowth.tsx
ActionRequired.tsx
PlatformHealth.tsx
TenantOverview.tsx
PlatformUsage.tsx
TopTenants.tsx
RecentActivity.tsx

==================================================
42. ACCESSIBILITY
==================================================

Phải hỗ trợ:

keyboard navigation

focus states

ARIA labels

sufficient contrast

button states

loading states

error states

Không chỉ dựa vào màu để biểu thị status.

Ví dụ:

Không chỉ:

● màu đỏ

Mà:

● Error
Service unavailable

==================================================
43. PERFORMANCE
==================================================

Không load toàn bộ dashboard nặng một lần nếu không cần.

Charts có thể lazy load.

Images không cần thiết.

Không dùng animation quá nặng.

Không render lại toàn bộ dashboard khi một metric thay đổi.

==================================================
44. IMPORTANT: VISUAL POLISH
==================================================

Tập trung vào:

spacing

alignment

consistent border radius

consistent shadows

consistent typography

consistent icon size

consistent card height

consistent table row height

Không sử dụng:

- quá nhiều shadow
- gradient background
- glass effect
- giant icon
- giant heading
- excessive rounded cards

Border radius khoảng:

10–14px.

Shadow rất nhẹ.

==================================================
45. EXPECTED RESULT
==================================================

Tôi muốn kết quả cuối cùng là một Super Admin SaaS Dashboard hoàn chỉnh.

Desktop phải rất đẹp ở:

1440x900
1920x1080

Tablet:

1024x768

Mobile:

390x844

Dashboard phải có cảm giác như một sản phẩm SaaS thương mại thực sự, không phải prototype.

==================================================
46. IMPLEMENTATION PROCESS
==================================================

Không được lập tức viết code.

Thực hiện theo thứ tự:

STEP 1
Analyze existing project.

STEP 2
Analyze current dashboard.

STEP 3
Identify reusable components.

STEP 4
Create dashboard information architecture.

STEP 5
Create reusable components.

STEP 6
Implement layout.

STEP 7
Implement responsive behavior.

STEP 8
Connect existing APIs if available.

STEP 9
Create mock service only where APIs are unavailable.

STEP 10
Add loading/error/empty states.

STEP 11
Add micro interactions.

STEP 12
Review visual consistency.

STEP 13
Check desktop/tablet/mobile.

STEP 14
Check that existing functionality is not broken.

==================================================
47. FINAL ACCEPTANCE CRITERIA
==================================================

Dashboard chỉ được coi là hoàn thành khi:

[ ] KPI hoạt động

[ ] Revenue chart hoạt động

[ ] Tenant growth hoạt động

[ ] Tenant status hoạt động

[ ] Action Required hoạt động

[ ] Platform Health hoạt động

[ ] Top Tenants hoạt động

[ ] Recent Activity hoạt động

[ ] Global Search hoạt động

[ ] Notification hoạt động

[ ] Quick Actions hoạt động

[ ] Loading state

[ ] Empty state

[ ] Error state

[ ] Responsive

[ ] Hover state

[ ] Keyboard navigation

[ ] Không có console error

[ ] Không phá vỡ routing

[ ] Không phá vỡ authentication

[ ] Không phá vỡ API hiện tại

[ ] Không tạo duplicate component không cần thiết

[ ] Không hard-code production data

==================================================
48. MOST IMPORTANT DESIGN RULE
==================================================

Hãy ưu tiên:

CLARITY > DECORATION

INFORMATION HIERARCHY > NUMBER OF CARDS

OPERABILITY > VISUAL EFFECTS

CONSISTENCY > COMPLEXITY

REAL SaaS UX > TEMPLATE ADMIN UX

Dashboard phải giúp Super Admin đưa ra quyết định nhanh.

Không thiết kế chỉ để "trông đẹp".
Thiết kế để "vận hành FitFlow".