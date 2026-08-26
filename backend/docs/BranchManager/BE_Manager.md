
Rất hợp lý. Sau **Owner Dashboard**, màn hình tiếp theo nên là **Branch Management (Quản lý chi nhánh)**, vì Branch là thực thể trung tâm của mô hình nghiệp vụ FitFlow:

```text
Tenant / Business
        │
        ├── Branch A
        │     ├── Branch Manager
        │     ├── Staff
        │     ├── PT
        │     ├── Member
        │     └── Check-in / Payment
        │
        ├── Branch B
        │
        └── Branch C
```

> Tôi sẽ phân tích ở đây là **trang Owner quản lý Branch**, chưa phải Dashboard dành riêng cho role **Branch Manager**. Sau màn này, chúng ta có thể tiếp tục phân tích riêng portal/dashboard của Branch Manager.

# PHÂN TÍCH NGHIỆP VỤ — BRANCH MANAGEMENT

## 1. Mục tiêu màn hình

### Tên màn hình

**Branch Management / Quản lý chi nhánh**

### Actor chính

**Owner**

### Mục tiêu nghiệp vụ

Owner cần có khả năng:

* Xem tất cả chi nhánh thuộc doanh nghiệp.
* Tạo chi nhánh mới.
* Xem tình trạng hoạt động của từng chi nhánh.
* Cập nhật thông tin chi nhánh.
* Phân công Branch Manager.
* Tạm ngưng hoặc đóng một chi nhánh.
* Theo dõi giới hạn số Branch theo gói SaaS.

Điểm quan trọng:

> **Branch không chỉ là một địa chỉ. Branch là một đơn vị vận hành độc lập bên trong Tenant.**

---

# 2. User Stories

## US-BR-01 — Xem danh sách Branch

> Là Owner, tôi muốn xem tất cả các chi nhánh của doanh nghiệp để quản lý tình trạng hoạt động.

---

## US-BR-02 — Tạo Branch mới

> Là Owner, tôi muốn tạo chi nhánh mới để mở rộng hoạt động kinh doanh.

---

## US-BR-03 — Chỉnh sửa Branch

> Là Owner, tôi muốn cập nhật thông tin chi nhánh khi có thay đổi.

---

## US-BR-04 — Xem tổng quan Branch

> Là Owner, tôi muốn xem nhanh số liệu hoạt động của từng chi nhánh để đánh giá hiệu quả.

---

## US-BR-05 — Phân công Branch Manager

> Là Owner, tôi muốn chỉ định người quản lý chi nhánh để phân quyền vận hành.

---

## US-BR-06 — Tạm ngưng Branch

> Là Owner, tôi muốn tạm ngưng một chi nhánh khi chi nhánh đó không hoạt động trong một khoảng thời gian.

---

## US-BR-07 — Archive/đóng Branch

> Là Owner, tôi muốn đóng một chi nhánh nhưng vẫn bảo toàn dữ liệu lịch sử.

---

# 3. UI — Branch List

## Layout đề xuất

```text
QUẢN LÝ CHI NHÁNH

Quản lý các cơ sở thuộc doanh nghiệp của bạn.

[🔍 Tìm kiếm] [Status ▼] [ + Thêm chi nhánh ]

───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ Branch Cầu Giấy                    ● Hoạt động  │
│ Hà Nội, Việt Nam                                │
│                                                 │
│ 👥 450 Members     👤 8 Staff                   │
│ 📍 86 lượt check-in hôm nay                     │
│                                                 │
│ [Xem chi tiết]                    [•••]         │
└─────────────────────────────────────────────────┘
```

Có thể hiển thị theo **Card View** ở màn hình nhỏ và **Table View** trên Desktop.

---

# 4. UI Components

## 4.1 Search

Cho phép tìm theo:

* Tên Branch
* Mã Branch
* Địa chỉ

Ví dụ:

```text
🔍 Tìm "Cầu Giấy"
```

### Business Rule

Search chỉ tìm trong:

```text
currentTenant.branches
```

Không được tìm kiếm xuyên Tenant.

---

## 4.2 Status Filter

Các trạng thái tôi đề xuất:

```text
ACTIVE
INACTIVE
SUSPENDED
ARCHIVED
```

Tuy nhiên, để MVP không quá phức tạp, có thể bắt đầu với:

```text
ACTIVE
INACTIVE
ARCHIVED
```

### Ý nghĩa

| Status   | Ý nghĩa             |
| -------- | ------------------- |
| ACTIVE   | Đang hoạt động      |
| INACTIVE | Tạm ngưng vận hành  |
| ARCHIVED | Đóng và lưu lịch sử |

---

# 5. Chức năng tạo Branch

## Luồng

```text
Owner
   ↓
Click "Thêm chi nhánh"
   ↓
Kiểm tra Entitlement
   ↓
Nhập thông tin
   ↓
Validation
   ↓
Create Branch
   ↓
Branch Status = ACTIVE
```

---

## Form tạo Branch

### Thông tin cơ bản

```text
Tên chi nhánh *
Mã chi nhánh *
Số điện thoại
Email
```

### Địa chỉ

```text
Tỉnh / Thành phố *
Quận / Huyện
Địa chỉ chi tiết *
```

### Thông tin vận hành

```text
Giờ mở cửa
Giờ đóng cửa
```

### Branch Manager

```text
[Chọn sau]

hoặc

[Chọn Branch Manager hiện tại]
```

Tôi **không khuyến nghị bắt buộc phải có Branch Manager ngay khi tạo Branch**, vì Owner có thể cần tạo chi nhánh trước rồi mới tuyển hoặc mời nhân sự.

---

# 6. Business Rule — Giới hạn Branch theo SaaS Plan

Đây là nghiệp vụ rất quan trọng.

Ví dụ Tenant đang dùng:

```text
FITFLOW STARTER
Max Branch = 1
```

Hiện tại:

```text
Active Branch = 1
```

Khi Owner nhấn:

```text
+ Thêm chi nhánh
```

Backend phải kiểm tra:

```text
Current Usage < Max Branch?
```

Nếu:

```text
1 >= 1
```

thì không cho tạo Branch.

UI:

> Bạn đã sử dụng hết giới hạn số lượng chi nhánh của gói hiện tại.

```text
[Nâng cấp gói]
```

### Business Rule

```text
BR-BR-01:
Chỉ Branch đang ACTIVE mới được tính vào giới hạn sử dụng SaaS.
```

Điểm này cần chốt rõ.

Tôi khuyến nghị **INACTIVE vẫn được tính vào giới hạn**, vì Tenant vẫn đang sở hữu và lưu cấu hình Branch đó. Chỉ khi `ARCHIVED` mới không tính vào quota.

---

# 7. Branch Detail Page

Khi Owner click:

```text
[Xem chi tiết]
```

chuyển đến:

```text
/owner/branches/:branchId
```

## Layout đề xuất

```text
← Quản lý chi nhánh

BRANCH CẦU GIẤY
● Đang hoạt động

[Chỉnh sửa] [•••]

──────────────────────────────────────────

TỔNG QUAN     NHÂN SỰ     KHÁCH HÀNG
DỊCH VỤ       HOẠT ĐỘNG    CÀI ĐẶT
```

Tôi đề xuất không nhồi tất cả chức năng vào một màn hình.

Branch Detail đóng vai trò như **mini workspace** của một chi nhánh.

---

# 8. Tab Tổng quan Branch

Hiển thị:

```text
Doanh thu hôm nay
12.500.000 VNĐ

Check-in hôm nay
125

Khách đang tập
32

Active Members
450
```

Ngoài ra:

```text
Branch Manager
Nguyễn Văn A

Staff
8 người

PT
4 người
```

Owner có thể click để đi đến màn hình chi tiết tương ứng.

---

# 9. Quản lý Branch Manager

Đây là một điểm nghiệp vụ cần thiết.

## Quy tắc đề xuất

### Một Branch có bao nhiêu Branch Manager?

Tôi khuyến nghị:

> **MVP: Mỗi Branch có 1 Primary Branch Manager.**

Ví dụ:

```text
Branch Cầu Giấy
      ↓
Primary Branch Manager
      ↓
Nguyễn Văn A
```

Lý do:

* Rõ trách nhiệm.
* Dễ quản lý.
* Tránh nhiều người cùng nghĩ người khác chịu trách nhiệm.

Sau này có thể mở rộng:

```text
Branch Manager
Assistant Manager
```

---

## Điều kiện để được chọn làm Branch Manager

User phải:

```text
Thuộc cùng Tenant
+
Account ACTIVE
```

Owner có thể:

* Chọn Staff hiện có.
* Hoặc mời User mới với role Branch Manager.

---

# 10. Chỉnh sửa Branch

Owner có thể chỉnh sửa:

```text
Tên
Thông tin liên hệ
Địa chỉ
Giờ hoạt động
Hình ảnh (nếu có)
Branch Manager
```

## Không nên cho sửa tự do

Một số trường dữ liệu nên hạn chế:

```text
branchId
tenantId
createdAt
```

Nếu có `Branch Code`, tôi đề xuất:

> Có thể sửa trong giai đoạn mới tạo, nhưng sau khi Branch đã phát sinh giao dịch thì không nên cho sửa tùy tiện.

---

# 11. Tạm ngưng Branch

## Use Case

Ví dụ:

* Đang sửa chữa.
* Tạm đóng cửa.
* Chưa đủ nhân sự.

Owner chọn:

```text
Tạm ngưng chi nhánh
```

Hệ thống yêu cầu xác nhận.

Sau đó:

```text
Branch Status = INACTIVE
```

## Ảnh hưởng nghiệp vụ

Khi INACTIVE:

```text
❌ Không Check-in mới
❌ Không bán Membership mới tại Branch
❌ Không nhận Guest mới
❌ Không tạo PT Booking mới
```

Nhưng:

```text
✓ Xem dữ liệu
✓ Xem lịch sử
✓ Xem báo cáo
```

### Điểm cần lưu ý

Các Member có Membership vẫn còn hạn không được mất dữ liệu.

Khi Branch mở lại:

```text
INACTIVE → ACTIVE
```

hệ thống không tự động hoàn Membership cho khách.

Nếu sau này bạn muốn hỗ trợ chính sách “đóng cửa thì cộng thêm ngày tập”, đó nên là một nghiệp vụ riêng, không nên tự động mặc định.

---

# 12. Archive Branch

Tôi **không khuyến nghị chức năng Delete vật lý**.

Nên sử dụng:

```text
ARCHIVE
```

## Điều kiện Archive

Trước khi Archive, hệ thống kiểm tra:

```text
Active Staff?
Active Members?
Active Membership?
Open Check-ins?
Future PT Booking?
```

Nếu có dữ liệu đang hoạt động, hệ thống phải cảnh báo.

Ví dụ:

> Chi nhánh hiện vẫn có 25 Membership đang hoạt động. Bạn không thể đóng chi nhánh ngay.

Owner cần xử lý:

* Chuyển Membership.
* Kết thúc Membership theo chính sách.
* Hoặc chuyển khách sang Branch khác nếu phù hợp.

### Business Rule

```text
BR-BR-02:
Không được Archive Branch khi còn các hoạt động nghiệp vụ chưa được xử lý.
```

---

# 13. API đề xuất

## Danh sách Branch

```http
GET /owner/branches
```

Query:

```text
?search=
&status=
&page=
&limit=
```

---

## Tạo Branch

```http
POST /owner/branches
```

Backend:

```text
Authenticate
↓
Check Tenant
↓
Check Owner Permission
↓
Check Subscription/Entitlement
↓
Validate Data
↓
Create Branch
↓
Write Audit Log
```

---

## Xem chi tiết

```http
GET /owner/branches/:id
```

---

## Cập nhật

```http
PATCH /owner/branches/:id
```

---

## Thay đổi trạng thái

Tôi không khuyến nghị API chung chung:

```text
PATCH status
```

Thay vào đó nên có Action rõ nghiệp vụ:

```http
POST /owner/branches/:id/activate
POST /owner/branches/:id/deactivate
POST /owner/branches/:id/archive
```

Điều này giúp backend xử lý Business Rules rõ ràng hơn.

---

# 14. Edge Cases quan trọng

## EC-BR-01 — Trial chỉ cho phép 1 Branch

Owner đang Trial:

```text
Max Branch = 1
```

Đã có 1 Branch → không được tạo thêm.

---

## EC-BR-02 — Owner đang tạo Branch nhưng Subscription hết hạn

Nếu Trial/Subscription hết hạn trước khi bấm Submit:

```text
Backend kiểm tra lại Access Mode
```

Không chỉ dựa vào trạng thái lúc Owner mở trang.

---

## EC-BR-03 — Branch Manager bị vô hiệu hóa

Nếu User đang là Branch Manager nhưng:

```text
User Status = INACTIVE
```

thì Branch không nên tự động có Manager khác.

Hệ thống hiển thị:

```text
⚠ Branch chưa có Branch Manager hoạt động.
```

Owner cần phân công lại.

---

## EC-BR-04 — Branch đang có khách Check-in mà bị Inactive

Tôi khuyến nghị:

> Không cho chuyển Branch sang INACTIVE nếu đang có khách chưa Check-out.

Hệ thống thông báo:

> Hiện có 12 khách đang ở trong phòng tập. Vui lòng xử lý Check-out trước khi tạm ngưng chi nhánh.

Điều này giúp dữ liệu vận hành sạch hơn.

---

## EC-BR-05 — Địa chỉ Branch trùng nhau

Hai Branch có thể cùng địa chỉ trong một số mô hình, nhưng thường đây là dấu hiệu nhập nhầm.

Khuyến nghị:

* Cho phép tạo.
* Hiển thị cảnh báo trùng địa chỉ.
* Không tự động chặn.

---

# 15. Tổng hợp Business Rules

| ID       | Business Rule                                                  |
| -------- | -------------------------------------------------------------- |
| BR-BR-01 | Branch chỉ được tạo trong giới hạn Entitlement                 |
| BR-BR-02 | Không xóa vật lý Branch đã có dữ liệu                          |
| BR-BR-03 | Owner chỉ quản lý Branch thuộc Tenant của mình                 |
| BR-BR-04 | INACTIVE Branch không nhận hoạt động vận hành mới              |
| BR-BR-05 | Archive Branch cần kiểm tra dữ liệu đang hoạt động             |
| BR-BR-06 | Mỗi Branch MVP có một Primary Branch Manager                   |
| BR-BR-07 | Branch Manager phải thuộc cùng Tenant                          |
| BR-BR-08 | Thay đổi trạng thái Branch phải được Audit Log                 |
| BR-BR-09 | INACTIVE Branch không làm mất dữ liệu lịch sử                  |
| BR-BR-10 | Không cho Archive nếu còn nghiệp vụ chưa xử lý                 |
| BR-BR-11 | Branch mới phải kiểm tra quyền truy cập SaaS tại thời điểm tạo |

---

# Đề xuất của tôi về cấu trúc chức năng

Sau khi phân tích, tôi đề xuất module Branch phía Owner như sau:

```text
BRANCH MANAGEMENT
│
├── Branch List
│
├── Create Branch
│
└── Branch Detail
    │
    ├── Overview
    ├── Staff & Branch Manager
    ├── Members
    ├── Services
    ├── Operational Activities
    └── Branch Settings
```

## Nhận xét BA

Có một điểm rất quan trọng cần phân biệt trong thiết kế FitFlow:

> **Owner quản lý và cấu hình Branch, còn Branch Manager vận hành Branch.**


