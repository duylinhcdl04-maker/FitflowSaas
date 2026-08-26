Rất tốt. Với **Câu 28 = C**, chúng ta đã có thể xem phần nghiệp vụ cốt lõi của **Branch Manager** là tương đối hoàn chỉnh. Dưới đây là bản tổng hợp toàn bộ các quyết định và Business Rules mà chúng ta đã cùng chốt trong quá trình phân tích.

> **Lưu ý BA:** Bản dưới đây tổng hợp dựa trên đúng các quyết định bạn đã xác nhận trong các bước trước. Tôi giữ nguyên các nguyên tắc nghiệp vụ đã chốt và chỉ hệ thống hóa lại để dễ chuyển sang thiết kế UI, Database và API.

# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ

# BRANCH MANAGER – FITFLOW GYM MANAGEMENT SAAS

---

## 1. VAI TRÒ CỦA BRANCH MANAGER

Branch Manager là người chịu trách nhiệm **quản lý và vận hành trực tiếp một chi nhánh phòng tập** trong hệ thống FitFlow.

Branch Manager đóng vai trò trung gian giữa:

```text
OWNER
   │
   │ Phân công quản lý
   ▼
BRANCH MANAGER
   │
   ├── STAFF
   ├── PT
   ├── CUSTOMER / MEMBER
   ├── GUEST
   ├── CHECK-IN
   ├── PT BOOKING
   └── Vận hành Branch
```

Branch Manager có quyền vận hành tương đối cao trong chi nhánh nhưng **không được vượt qua phạm vi Branch mà Owner phân công**.

---

# 2. PHẠM VI QUẢN LÝ BRANCH

## Quyết định đã chốt

* Một Branch Manager chỉ quản lý **01 Branch duy nhất**.
* Branch do **Owner gán**.
* Không được xem hoặc truy cập dữ liệu của Branch khác.
* Chỉ thao tác dữ liệu thuộc Branch mình quản lý.
* Được chỉnh sửa các thông tin vận hành của Branch.

Ví dụ:

```text
Tenant: FitFlow Gym

Branch Manager A
       ↓
Quản lý: Branch Cầu Giấy

❌ Không truy cập Branch Đống Đa
❌ Không truy cập Branch Hà Đông
```

### Business Rules

```text
BR-BM-01:
Một Branch Manager chỉ được quản lý một Branch tại một thời điểm.

BR-BM-02:
Branch Manager chỉ được truy cập dữ liệu thuộc Branch được Owner phân công.

BR-BM-03:
Mọi thao tác Backend phải kiểm tra Tenant + Role + Assigned Branch.

BR-BM-04:
Branch Manager chỉ được chỉnh sửa thông tin vận hành của Branch
theo phạm vi quyền được cấp.
```

---

# 3. QUẢN LÝ NHÂN SỰ

Branch Manager được phép quản lý nhân sự thuộc Branch mình.

## Có quyền

* Tạo/mời Staff.
* Tạo/mời PT.
* Xem danh sách Staff/PT thuộc Branch.
* Cập nhật thông tin nhân sự trong phạm vi được phép.
* Vô hiệu hóa Staff/PT thuộc Branch.

## Không có quyền

* Xóa vật lý User đã có dữ liệu.
* Quản lý nhân sự Branch khác.
* Chuyển nhân sự sang Branch khác ngoài phạm vi quyền của mình.

### Business Rules

```text
BR-BM-05:
Branch Manager chỉ được tạo Staff/PT cho Branch mình quản lý.

BR-BM-06:
Staff/PT khi tạo phải thuộc đúng Tenant và Branch của Branch Manager.

BR-BM-07:
Không xóa vật lý nhân sự đã phát sinh dữ liệu nghiệp vụ.
Chỉ chuyển trạng thái Inactive/Disabled.

BR-BM-08:
Branch Manager không được thao tác với Staff/PT thuộc Branch khác.
```

---

# 4. QUOTA NHÂN SỰ CỦA GÓI SAAS

Theo quyết định của bạn, quota nhân sự của Tenant sẽ tính:

### Được tính quota

* Branch Manager
* Staff
* PT

### Không tính quota

* Owner
* Customer/Member
* Guest

Ví dụ:

```text
Gói SaaS: Tối đa 20 nhân sự

Branch Manager: 2
Staff:          10
PT:              8
────────────────────
Tổng:            20/20
```

### Business Rules

```text
BR-SUB-USER-01:
Quota nhân sự được tính trên các tài khoản có Role:
BRANCH_MANAGER, STAFF, PT.

BR-SUB-USER-02:
Owner không tính vào quota nhân sự.

BR-SUB-USER-03:
Customer/Member và Guest không tính vào quota.

BR-SUB-USER-04:
Khi tạo hoặc kích hoạt nhân sự, hệ thống phải kiểm tra quota SaaS.
```

> Khuyến nghị kỹ thuật đã được đưa ra: nên tính theo số lượng tài khoản **đang Active**, để khi nhân sự nghỉ việc và bị vô hiệu hóa thì quota được giải phóng.

---

# 5. QUẢN LÝ CUSTOMER / MEMBER

Branch Manager được phép:

* Tạo Customer/Member mới.
* Xem Customer/Member thuộc phạm vi vận hành.
* Hỗ trợ Member thực hiện các nghiệp vụ Membership.
* Bán Membership Package được áp dụng tại Branch.

## Không được phép

* Chuyển Customer/Member sang Branch khác.

### Business Rules

```text
BR-BM-09:
Branch Manager được tạo Customer/Member mới cho Tenant/Branch mình.

BR-BM-10:
Branch Manager không được chuyển Customer/Member sang Branch khác.

BR-BM-11:
Customer nên được quản lý ở cấp Tenant;
Membership lưu Branch đăng ký/phát sinh nghiệp vụ.

BR-BM-12:
Branch Manager chỉ được bán Membership Package đang Active
và được phép áp dụng tại Branch của mình.
```

### Mô hình nghiệp vụ quan trọng

```text
CUSTOMER
   │
   │ Thuộc Tenant
   ▼
MEMBERSHIP
   │
   ├── Registration Branch
   ├── Package
   ├── Validity
   └── Access Scope
```

Điều này hỗ trợ tốt cho Member có quyền **Multi-Branch**.

---

# 6. MEMBERSHIP PACKAGE

Branch Manager:

```text
❌ Không được tạo Membership Package
❌ Không được chỉnh sửa Membership Package
```

Membership Package là chính sách kinh doanh do **Owner quản lý**.

Branch Manager chỉ được bán các Package:

```text
ACTIVE
+
Được áp dụng cho Branch
```

---

# 7. PAYMENT

Hiện tại hệ thống chưa triển khai cơ chế xác nhận thanh toán tự động qua cổng ngân hàng.

Vì vậy Branch Manager được:

* Tạo giao dịch thanh toán.
* Xác nhận thanh toán thủ công tại Branch.
* Kích hoạt Membership theo luồng thanh toán.

Luồng cơ bản:

```text
Chọn Package
      ↓
Tạo Payment
      ↓
Khách thanh toán
      ↓
Branch Manager xác nhận Payment
      ↓
Payment = SUCCESS
      ↓
Membership được kích hoạt
```

### Business Rules

```text
BR-BM-13:
Branch Manager chỉ được xác nhận Payment phát sinh tại Branch mình.

BR-BM-14:
Payment SUCCESS là điều kiện để kích hoạt Membership
theo chính sách nghiệp vụ.

BR-BM-15:
Branch Manager không được tự hoàn tiền.

BR-BM-16:
Refund phải thông qua Owner Approval.
```

---

# 8. QUẢN LÝ MEMBERSHIP ĐANG ACTIVE

Branch Manager được phép xử lý Membership đang Active, nhưng không phải được sửa tất cả dữ liệu trực tiếp.

## Được thực hiện

* Freeze Membership.
* Unfreeze theo chính sách.
* Thêm ngày tập miễn phí.
* Hủy Membership theo điều kiện nghiệp vụ.
* Cập nhật các thông tin vận hành được phép.

## Không được thực hiện trực tiếp

* Sửa Payment đã thành công.
* Sửa số tiền giao dịch.
* Thay đổi Customer của Membership.
* Xóa Membership đã phát sinh giao dịch.
* Đổi trực tiếp Membership Package.

---

## 8.1 Freeze Membership

Branch Manager được **tự thực hiện Freeze**.

Nhưng phải tuân theo Freeze Policy do Owner cấu hình.

Luồng:

```text
ACTIVE
  ↓
Branch Manager chọn Freeze
  ↓
Nhập lý do + thời gian
  ↓
System kiểm tra Freeze Policy
  ↓
FROZEN
  ↓
Hết thời gian → xử lý theo Policy
```

### Business Rules

```text
BR-BM-17:
Branch Manager được Freeze Membership trong giới hạn Freeze Policy.

BR-BM-18:
Không được Freeze vượt quá giới hạn thời gian hoặc điều kiện Owner cấu hình.

BR-BM-19:
Hệ thống tự động xử lý thời hạn Membership theo Freeze Policy.

BR-BM-20:
Freeze/Unfreeze phải được lưu lịch sử.
```

---

## 8.2 Thêm ngày tập miễn phí

Branch Manager được phép cộng thêm ngày tập miễn phí.

Ví dụ:

```text
Membership hết hạn: 30/08
Phòng tập đóng cửa: 3 ngày
        ↓
Branch Manager cộng thêm: 3 ngày
        ↓
Hết hạn mới: 02/09
```

Bắt buộc nhập:

* Số ngày.
* Lý do.

Và hệ thống phải lưu:

* End Date trước.
* End Date sau.
* Người thực hiện.
* Thời gian thực hiện.

```text
BR-BM-21:
Branch Manager được cộng thêm ngày Membership miễn phí
nhưng bắt buộc nhập lý do.

BR-BM-22:
Không được sửa trực tiếp End Date mà không lưu Adjustment History.
```

---

## 8.3 Thay đổi Membership Package

Đã chốt:

> **Không được đổi trực tiếp Package của Membership Active.**

Ví dụ:

```text
Gym Basic
    ↓
Gym Premium
```

Không được UPDATE trực tiếp Package.

Phải xử lý bằng nghiệp vụ riêng trong tương lai:

```text
Membership Upgrade
Package Change
New Membership Transaction
```

### Business Rule

```text
BR-BM-23:
Branch Manager không được thay đổi trực tiếp Membership Package
của Membership đang Active.

BR-BM-24:
Mọi thay đổi Package phải được xử lý qua nghiệp vụ/giao dịch mới.
```

---

# 9. CANCEL MEMBERSHIP

## Trường hợp 1 — Chưa Check-in

Branch Manager được tự hủy Membership nếu:

* Membership chưa phát sinh Check-in.
* Đáp ứng chính sách hủy của Tenant.

Bắt buộc nhập lý do.

```text
BR-BM-25:
Branch Manager được tự Cancel Membership chưa từng phát sinh Check-in.
```

---

## Trường hợp 2 — Đã Check-in

Branch Manager không được tự hủy.

Phải:

```text
Cancellation Request
        ↓
Owner Review
        ↓
Approved / Rejected
```

```text
BR-BM-26:
Membership đã phát sinh Check-in chỉ được Cancel sau Owner Approval.
```

### Nguyên tắc quan trọng

```text
Cancel Membership ≠ Refund
```

Đây là hai nghiệp vụ độc lập.

---

# 10. CHECK-IN / CHECK-OUT

Branch Manager có quyền:

* Manual Check-in.
* Manual Check-out.
* Hỗ trợ Check-in bằng các phương thức hệ thống.
* Undo Check-in.
* Xử lý các trường hợp ngoại lệ trong Branch.

### Undo Check-in

Branch Manager được Undo Check-in của khách tại Branch mình.

Tất cả thao tác phải được Audit Log.

```text
BR-BM-27:
Branch Manager chỉ được Undo Check-in thuộc Branch mình.

BR-BM-28:
Undo Check-in phải lưu lịch sử thao tác và lý do nếu chính sách yêu cầu.
```

---

# 11. AUTO CHECK-OUT

Auto Check-out được tính **theo thời điểm Check-in của từng khách**, không phải chạy chung theo một giờ cố định.

Ví dụ Owner cấu hình:

```text
Auto Checkout After = 4 Hours
```

Khách A:

```text
Check-in: 08:00
→ Auto Check-out: 12:00
```

Khách B:

```text
Check-in: 09:00
→ Auto Check-out: 13:00
```

Branch Manager không trực tiếp cấu hình.

Branch Manager có thể **đề xuất cấu hình riêng**, Owner là người quyết định/phê duyệt theo chính sách đã chốt.

---

# 12. MEMBERSHIP HẾT HẠN TRONG NGÀY

Đã chốt **Câu 28 = C**.

Membership được quản lý theo ngày và có hiệu lực đến hết ngày hết hạn.

Ví dụ:

```text
End Date = 31/08/2026
```

Có nghĩa là Membership còn hiệu lực đến:

```text
31/08/2026 23:59:59
```

### Business Rule

```text
BR-MEM-VALID-01:
Membership có End Date được phép sử dụng đến hết ngày End Date,
trừ khi Package hoặc chính sách riêng quy định khác.
```

Nhờ đó khách có thể Check-in bình thường trong ngày cuối cùng của gói tập.

---

# 13. PT VÀ PT BOOKING

Branch Manager được:

* Xem toàn bộ PT Booking tại Branch.
* Tạo Booking thay Customer.
* Quản lý lịch Booking.
* Hủy Booking.

Khi hủy Booking:

```text
Bắt buộc nhập Cancellation Reason.
```

### Business Rules

```text
BR-BM-29:
Branch Manager chỉ quản lý PT Booking thuộc Branch mình.

BR-BM-30:
Booking tạo bởi Branch Manager phải lưu Created By.

BR-BM-31:
Cancellation phải lưu Reason + Cancelled By + Cancelled At.
```

---

# 14. MULTI-BRANCH MEMBER

Đối với Member có Package VIP cho phép tập tại tất cả Branch:

Branch Manager vẫn có thể xác minh quyền Check-in.

Nhưng chỉ được xem thông tin cần thiết:

```text
✓ Họ tên
✓ Mã khách hàng
✓ Ảnh
✓ Trạng thái Membership
✓ Ngày hết hạn
✓ Quyền Multi-Branch
✓ Trạng thái Check-in
```

Không nên được xem toàn bộ:

```text
✕ Payment History toàn Tenant
✕ Thông tin tài chính không cần thiết
✕ Dữ liệu vận hành của Branch khác
```

### Business Rule

```text
BR-BM-32:
Branch Manager được xem thông tin tối thiểu cần thiết
để xác minh quyền sử dụng dịch vụ của Multi-Branch Member.
```

---

# 15. OVERRIDE STAFF

Branch Manager có quyền Override một số quyết định/thao tác của Staff.

Ví dụ:

```text
Staff từ chối Check-in
       ↓
Branch Manager xác minh
       ↓
Override
       ↓
Nhập lý do
       ↓
Thực hiện thao tác
```

### Business Rule

```text
BR-BM-33:
Mọi thao tác Override phải bắt buộc có lý do và Audit Log.
```

---

# 16. AUDIT LOG

Branch Manager được xem Business Audit Log thuộc Branch mình.

Ví dụ:

* Manual Check-in.
* Undo Check-in.
* Payment Confirmation.
* Membership Adjustment.
* Freeze.
* Cancel.
* Booking Cancellation.
* Override.

Không được xem:

* Security Log cấp hệ thống.
* Hoạt động Tenant khác.
* Hoạt động Branch khác.

```text
BR-BM-34:
Branch Manager chỉ được xem Audit Log thuộc phạm vi Branch được quản lý.
```

---

# 17. DASHBOARD VÀ REPORT

Branch Manager được xem:

### Dashboard vận hành Branch

* Số Member.
* Check-in trong ngày.
* Khách đang ở phòng tập.
* Guest trong ngày.
* Membership sắp hết hạn.
* Doanh thu Branch.
* PT Booking.
* Các vấn đề cần xử lý.

### Report

Branch Manager chỉ được xem dữ liệu:

```text
BRANCH SCOPE ONLY
```

Không được xem:

* Tổng doanh thu Tenant.
* Doanh thu Branch khác.
* Báo cáo SuperAdmin.

---

# 18. EXPORT REPORT

Bạn đã chọn:

> Owner là người quyết định quyền Export.

Tuy nhiên, vì hệ thống ban đầu theo mô hình **Fixed Role & Permission**, điểm này cần được thiết kế cẩn thận.

Tôi đề xuất thể hiện trong hệ thống theo dạng **Permission cố định nhưng có thể được Owner bật/tắt theo chính sách Tenant**, thay vì cho phép Owner tự tạo Role.

Ví dụ:

```text
Branch Manager
├── View Report       ✓
└── Export Report     Configurable by Owner
```

Đây là điểm chúng ta có thể chốt chi tiết khi phân tích Permission Matrix toàn hệ thống.

---

# 19. TỔNG HỢP QUYỀN HẠN BRANCH MANAGER

| Module                | Quyền                                 |
| --------------------- | ------------------------------------- |
| Branch                | Quản lý 01 Branch được Owner gán      |
| Branch khác           | ❌ Không xem/truy cập                  |
| Staff                 | Tạo, quản lý, vô hiệu hóa             |
| PT                    | Tạo, quản lý, vô hiệu hóa             |
| Customer              | Tạo và quản lý trong phạm vi vận hành |
| Chuyển Member Branch  | ❌                                     |
| Membership Package    | Chỉ bán, không cấu hình               |
| Payment               | Xác nhận thủ công                     |
| Refund                | Tạo/gửi yêu cầu, Owner duyệt          |
| Membership Active     | Điều chỉnh theo nghiệp vụ             |
| Freeze                | ✅ Theo Owner Policy                   |
| Thêm ngày tập         | ✅ + bắt buộc lý do                    |
| Đổi Package trực tiếp | ❌                                     |
| Cancel chưa Check-in  | ✅                                     |
| Cancel đã Check-in    | Owner Approval                        |
| Check-in              | ✅                                     |
| Check-out             | ✅                                     |
| Undo Check-in         | ✅ Trong Branch                        |
| Auto Checkout         | Đề xuất, Owner quyết định             |
| PT Booking            | Quản lý trong Branch                  |
| Multi-Branch Member   | Xác minh thông tin cần thiết          |
| Audit Log             | Chỉ Branch                            |
| Override Staff        | ✅ + lý do                             |
| Dashboard             | Chỉ Branch                            |
| Report                | Chỉ Branch                            |
| Export                | Theo quyền Owner cấu hình             |

---

# 20. PHÂN CẤP QUYỀN TRONG MÔ HÌNH FITFLOW

Sau khi chốt Branch Manager, cấu trúc quyền hạn của hệ thống đang khá hợp lý:

```text
SUPER ADMIN
    │
    ▼
OWNER
    │
    ├───────────────┐
    ▼               ▼
BRANCH MANAGER   Shared Tenant Management
    │
    ├── STAFF
    │
    └── PT
          │
          ▼
      CUSTOMER / MEMBER
```

Điểm quan trọng nhất là:

> **Branch Manager là người có quyền quản lý vận hành cao nhất tại một Branch, nhưng không được can thiệp vào chính sách kinh doanh cấp Tenant và không được vượt qua phạm vi Branch của mình.**

Đây là nguyên tắc xuyên suốt mà Backend, Frontend và Database đều nên tuân thủ.

---

## Đánh giá BA của tôi

Đến thời điểm hiện tại, nghiệp vụ **Branch Manager đã đủ chắc để chuyển sang giai đoạn thiết kế chi tiết**. Chúng ta đã chốt được:

* Phạm vi dữ liệu.
* Quản lý nhân sự.
* Quota SaaS.
* Customer/Member.
* Membership.
* Freeze/Cancel/Adjustment.
* Payment.
* Check-in/Check-out.
* PT Booking.
* Báo cáo và Audit Log.
* Các Edge Cases quan trọng.

Đây là một câu hỏi rất đúng trọng tâm. Nếu đứng ở góc nhìn của một **BA hiểu vận hành phòng gym**, tôi sẽ không thiết kế Dashboard Branch Manager chỉ là một trang có thật nhiều biểu đồ.

**Dashboard phải giúp Branch Manager trả lời nhanh:**

> **“Hôm nay chi nhánh của tôi đang vận hành như thế nào, có vấn đề gì cần xử lý ngay, và xu hướng đang tốt lên hay xấu đi?”**

Vì Branch Manager chỉ quản lý **một chi nhánh**, Dashboard nên tập trung vào **hành động và vận hành**, khác với Owner là người quan tâm bức tranh toàn Tenant.

---

# 1. MỤC TIÊU CỦA BRANCH MANAGER DASHBOARD

Tôi đề xuất Dashboard được chia thành **4 tầng thông tin**:

```text
┌──────────────────────────────────────┐
│  1. HÔM NAY ĐANG CÓ GÌ XẢY RA?        │
│  → Vận hành tức thời                  │
├──────────────────────────────────────┤
│  2. CÓ VẤN ĐỀ GÌ CẦN XỬ LÝ?           │
│  → Cảnh báo & Action Required         │
├──────────────────────────────────────┤
│  3. CHI NHÁNH ĐANG HOẠT ĐỘNG RA SAO?  │
│  → KPI & hiệu quả                     │
├──────────────────────────────────────┤
│  4. XU HƯỚNG CÓ TỐT HƠN KHÔNG?        │
│  → So sánh theo thời gian             │
└──────────────────────────────────────┘
```

Đây là cấu trúc tôi đánh giá phù hợp nhất cho một hệ thống quản lý gym SaaS.

---

# 2. KHU VỰC QUAN TRỌNG NHẤT: TÌNH HÌNH HÔM NAY

## Dashboard Overview

Ở phần đầu màn hình, Branch Manager cần nhìn thấy ngay:

| KPI                     | Ý nghĩa thực tế                      |
| ----------------------- | ------------------------------------ |
| 🟢 Đang trong phòng tập | Hiện tại có bao nhiêu người đang tập |
| ➕ Check-in hôm nay      | Lượng khách đã đến                   |
| 👤 Member Check-in      | Khách có Membership                  |
| 👥 Guest hôm nay        | Khách tập lẻ                         |
| 📅 PT Sessions hôm nay  | Số buổi PT dự kiến                   |
| ⏳ Pending Payments      | Giao dịch cần xử lý                  |

### Ví dụ

```text
HÔM NAY - BRANCH CẦU GIẤY

👥 Đang tập          42
🚪 Check-in hôm nay  127
👤 Member            105
🙋 Guest              22
🏋️ PT Sessions        18
💳 Pending Payment     3
```

## Lợi ích

Branch Manager có thể ngay lập tức nhận biết:

* Phòng tập có đông bất thường không?
* Hôm nay lượng khách có thấp không?
* Staff có đang bỏ sót Payment không?
* PT có lịch tập nào cần chú ý?

### Gợi ý BA quan trọng

KPI **“Đang trong phòng tập”** đặc biệt hữu ích vì bạn đã có:

* Check-in.
* Check-out.
* Auto Check-out.

Do đó dữ liệu này không chỉ để trang trí mà thực sự có giá trị vận hành.

---

# 3. KHU VỰC ACTION REQUIRED — QUAN TRỌNG HƠN BIỂU ĐỒ

Theo tôi, đây nên là phần có giá trị nhất của Dashboard.

Thay vì chỉ hiện:

> “Có 20 Membership sắp hết hạn”

Dashboard nên nói:

> **“Có việc gì Branch Manager cần làm ngay?”**

## Action Center

```text
⚠️ CẦN XỬ LÝ

🔴 3 Payment đang Pending quá lâu
🟠 8 Membership sắp hết hạn trong 3 ngày
🟡 2 Membership đang chờ Cancellation Approval
🟡 1 PT Booking bị trùng lịch
🟠 4 khách chưa Check-out quá thời gian dự kiến
```

### Lợi ích thực tế

Branch Manager bấm vào từng mục:

```text
8 Membership sắp hết hạn
          ↓
Danh sách 8 khách
          ↓
Liên hệ / hỗ trợ gia hạn
```

Như vậy Dashboard trở thành **trung tâm điều hành**, không phải trang thống kê.

---

# 4. CUSTOMER & MEMBER HEALTH

Đây là khu vực mà tôi cho rằng rất nhiều hệ thống gym bỏ qua.

Branch Manager cần biết **khách hàng có còn hoạt động hay không**.

## Gợi ý chỉ số

### Active Members

```text
Tổng Member Active: 850
```

### At-risk Members

Ví dụ:

```text
⚠️ 42 khách không Check-in trong 14 ngày
```

Điều này giúp Branch Manager hoặc Staff chủ động liên hệ:

> “Anh/chị có gặp vấn đề gì trong quá trình tập không?”

### Membership Expiry

```text
Sắp hết hạn:

7 ngày:   15 khách
14 ngày:  32 khách
30 ngày:  71 khách
```

## Lợi ích

Đây là dữ liệu hỗ trợ:

* Retention.
* Chăm sóc khách hàng.
* Gia hạn Membership.
* Dự đoán doanh thu.

### Gợi ý BA

Không nên chỉ hiển thị **“sắp hết hạn”**, mà nên chia mức ưu tiên:

```text
🔴 Hết hạn trong 3 ngày
🟠 Hết hạn trong 7 ngày
🟡 Hết hạn trong 30 ngày
```

---

# 5. DOANH THU — NHƯNG KHÔNG CẦN QUÁ PHỨC TẠP

Branch Manager cần biết doanh thu Branch, nhưng không cần Dashboard tài chính quá phức tạp.

Tôi đề xuất:

## Revenue Summary

```text
DOANH THU

Hôm nay:       5.200.000 VNĐ
Tháng này:   125.000.000 VNĐ

So với tháng trước: ▲ 12%
```

Quan trọng hơn là chia nguồn:

```text
Membership    ████████████ 70%
PT Package    ████         25%
Guest         █            5%
```

## Giá trị thực tế

Branch Manager biết:

* Branch đang kiếm tiền từ đâu.
* Membership có đang giảm không.
* PT có hoạt động hiệu quả không.
* Guest có đang tạo cơ hội chuyển đổi thành Member không.

---

# 6. GUEST → MEMBER CONVERSION

Đây là một KPI rất đáng đầu tư cho hệ sinh thái gym của bạn.

Vì Guest thường là **khách hàng tiềm năng**.

Dashboard có thể theo dõi:

```text
Guest tháng này:        80
Guest quay lại:         30
Chuyển thành Member:    12

Conversion Rate: 15%
```

### Lợi ích

Branch Manager có thể đánh giá:

> “Chi nhánh có nhiều khách trải nghiệm, nhưng Staff có đang chuyển họ thành Member không?”

Đây là KPI rất thiết thực cho vận hành và bán hàng.

> **Lưu ý:** KPI này cần định nghĩa rõ “Conversion Window”, ví dụ Guest mua Membership trong vòng 30 ngày kể từ lần tập Guest đầu tiên.

---

# 7. CHECK-IN ANALYTICS — ĐỂ HIỂU NHỊP HOẠT ĐỘNG CỦA BRANCH

Đây là một trong những lợi ích lớn nhất của hệ thống có Check-in.

Dashboard nên có biểu đồ:

```text
Check-in theo giờ

06:00  ██
08:00  ███████
12:00  ████
17:00  █████████████
19:00  ████████████████
21:00  █████
```

## Branch Manager biết được gì?

* Giờ cao điểm.
* Giờ vắng.
* Có cần tăng Staff trực quầy?
* Có cần tăng PT?
* Có nguy cơ quá tải thiết bị không?

### So sánh

```text
Hôm nay vs Hôm qua
Tuần này vs Tuần trước
Tháng này vs Tháng trước
```

Đây là **so sánh theo thời gian**, phù hợp với quyền Branch Manager hơn việc so sánh với Branch khác.

---

# 8. HIỆU QUẢ PT

Vì Branch Manager trực tiếp quản lý PT, Dashboard nên có một phần riêng.

## PT Overview

```text
PT Active:                8
Sessions hôm nay:         18
Completed:                12
Upcoming:                  6
Cancelled / No-show:       2
```

Có thể có bảng:

| PT   | Sessions tháng này | Hoàn thành | Hủy |
| ---- | -----------------: | ---------: | --: |
| PT A |                 42 |         39 |   3 |
| PT B |                 38 |         36 |   2 |

## Lợi ích

Branch Manager phát hiện:

* PT nào quá tải.
* PT nào ít lịch.
* Tỷ lệ hủy bất thường.
* Cần điều phối nhân sự hay không.

---

# 9. NHÂN SỰ VÀ VẬN HÀNH STAFF

Không cần biến Dashboard thành HRM, nhưng nên có một widget:

```text
NHÂN SỰ HÔM NAY

Staff Active:       4/5
PT Active:          7/8
```

Nếu hệ thống sau này có lịch làm việc:

```text
Staff ca sáng: 3
Staff ca chiều: 4
```

### Lợi ích

Branch Manager nhanh chóng biết:

> “Hôm nay chi nhánh có thiếu người không?”

Tuy nhiên, vì MVP hiện tại chưa phân tích module **Shift/Attendance cho Staff**, tôi đề xuất chỉ để dạng đơn giản hoặc đưa sang Phase 2.

---

# 10. CÁC SO SÁNH MÀ BRANCH MANAGER THỰC SỰ CẦN

Theo tôi, **so sánh quan trọng nhất không phải là Branch A với Branch B**, vì Branch Manager của bạn không được xem dữ liệu Branch khác.

Thay vào đó, Dashboard nên hỗ trợ so sánh:

## So sánh theo thời gian

| Chỉ số         | Hôm nay | Hôm qua | Xu hướng |
| -------------- | ------: | ------: | -------- |
| Check-in       |     127 |     115 | ▲ 10%    |
| Doanh thu      |   5.2tr |   4.6tr | ▲        |
| Guest          |      22 |      18 | ▲        |
| Membership mới |       6 |       8 | ▼        |

### Các bộ lọc

```text
Today vs Yesterday
This Week vs Last Week
This Month vs Last Month
Custom Date Range
```

Đây là cách so sánh hữu ích và không vi phạm phạm vi dữ liệu Branch.

---

# 11. THIẾT KẾ TỔNG THỂ DASHBOARD TÔI ĐỀ XUẤT

Nếu thiết kế thực tế, tôi sẽ sắp xếp như sau:

```text
┌─────────────────────────────────────────────────────┐
│ Xin chào, Branch Manager      [Today ▾]             │
│ Branch: Cầu Giấy                                   │
├─────────────────────────────────────────────────────┤
│ 👥 Đang tập │ 🚪 Check-in │ 💰 Doanh thu │ PT hôm nay│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ⚠️ ACTION CENTER                                   │
│ • Payment Pending                                   │
│ • Membership sắp hết hạn                            │
│ • Khách chưa Checkout                               │
│ • Booking cần xử lý                                 │
├──────────────────────────────┬──────────────────────┤
│ CHECK-IN TREND               │ MEMBER HEALTH        │
│ Theo giờ / theo ngày         │ Active / At Risk     │
├──────────────────────────────┼──────────────────────┤
│ REVENUE                      │ PT PERFORMANCE       │
│ Theo nguồn thu               │ Booking/Sessions     │
├──────────────────────────────┼──────────────────────┤
│ MEMBERSHIP EXPIRING          │ GUEST CONVERSION     │
│ Danh sách cần chăm sóc       │ Guest → Member       │
└──────────────────────────────┴──────────────────────┘
```

---

# 12. PHÂN LOẠI MVP VÀ TÍNH NĂNG MỞ RỘNG

Để tránh Dashboard quá tải, tôi đề xuất:

## 🟢 MVP — Bắt buộc

1. Tổng Check-in hôm nay.
2. Số khách đang trong phòng tập.
3. Guest hôm nay.
4. Doanh thu hôm nay/tháng.
5. Membership sắp hết hạn.
6. Payment cần xử lý.
7. PT Booking hôm nay.
8. Action Center.
9. So sánh theo thời gian cơ bản.

## 🟡 Phase 2 — Rất có giá trị

* Guest → Member Conversion.
* Member At-Risk.
* Check-in Heatmap.
* PT Performance.
* No-show Rate.
* Membership Renewal Rate.

## 🔵 Phase 3 — Phân tích nâng cao

* Dự đoán khách có nguy cơ rời bỏ.
* Dự đoán doanh thu.
* Phân tích giờ cao điểm bằng AI.
* Đề xuất số lượng Staff/PT cần thiết.

---

# KẾT LUẬN BA

Theo tôi, **Dashboard tốt nhất cho Branch Manager không phải là Dashboard có nhiều số liệu nhất**, mà là Dashboard giúp họ trả lời được 5 câu hỏi trong chưa đến 30 giây:

### 1️⃣ Hôm nay phòng tập đang hoạt động thế nào?

→ Check-in, khách đang tập, PT Sessions.

### 2️⃣ Có vấn đề gì tôi phải xử lý ngay?

→ Action Center.

### 3️⃣ Khách hàng có nguy cơ rời bỏ không?

→ Membership Expiring, At-Risk Member.

### 4️⃣ Chi nhánh đang kiếm tiền tốt không?

→ Revenue và nguồn doanh thu.

### 5️⃣ Chi nhánh tốt hơn hay xấu hơn trước?

→ So sánh Today/Yesterday, Week/Week, Month/Month.

**Đó là giá trị thực sự của Dashboard Branch Manager trong FitFlow.**
