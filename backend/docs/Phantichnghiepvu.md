# FITFLOW SAAS - TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & PHÂN QUYỀN 6 ROLES

---

## 1. ROLE_SUPER_ADMIN.md

# PHÂN HỆ QUẢN TRỊ NỀN TẢNG (SUPER ADMIN)

### 1. Phạm vi & Ranh giới (Scope & Boundaries)
* **Phạm vi:** Toàn bộ nền tảng SaaS FitFlow đa khách thuê (Multi-tenant).
* **Ranh giới:** Quản trị kỹ thuật, vận hành subscription, tài nguyên tenant; **không can thiệp trực tiếp** vào dữ liệu vận hành phòng tập (check-in, hợp đồng khách, lịch tập PT) của từng Tenant trừ khi có ủy quyền hỗ trợ kỹ thuật.

### 2. Danh mục chức năng (Functional Modules)

#### 2.1. SaaS Platform Dashboard
* Xem tổng số Tenants: Active, Inactive, Suspended, Trial.
* Theo dõi doanh thu định kỳ SaaS (MRR/ARR), tỷ lệ rời bỏ (Churn rate).
* Giám sát tài nguyên hạ tầng: Dung lượng lưu trữ (Storage), số lượng Face ID models đã nhúng (Embeddings), tổng API calls Check-in/Face Recognition.

#### 2.2. Tenant / Business Management
* **Tạo mới Tenant:** Cấp định danh duy nhất (`tenant_id`), khởi tạo tài khoản Owner đầu tiên.
* **Quản lý trạng thái Tenant:** Chuyển đổi giữa `TRIAL` -> `ACTIVE` -> `SUSPENDED` -> `INACTIVE`.
* **Cấu hình giới hạn:** Gán hạn mức theo gói (Branches tối đa, Staffs tối đa, số lượt Face API/tháng).

#### 2.3. SaaS Plan & Feature Flag Management
* Định nghĩa các gói thương mại: `FREE_TRIAL`, `STARTER`, `GROWTH`, `ENTERPRISE`.
* Thiết lập Feature Flags cho từng gói:
  * `FEATURE_MULTI_BRANCH` (true/false)
  * `FEATURE_FACE_RECOGNITION` (true/false)
  * `FEATURE_PT_MANAGEMENT` (true/false)
  * `FEATURE_ADVANCED_ANALYTICS` (true/false)

#### 2.4. SaaS Subscription & B2B Billing
* Quản lý hợp đồng SaaS giữa FitFlow và Tenant Owner.
* Theo dõi chu kỳ thanh toán phần mềm: B2B Invoicing, tích hợp cổng thanh toán phí duy trì hệ thống.
* Xử lý gia hạn, nâng cấp (Upgrade), hạ cấp (Downgrade) hoặc hủy thuê bao SaaS.

#### 2.5. Platform Audit & Support Assistance
* Xem Audit Log toàn hệ thống (ghi nhận các thay đổi cấu hình, lỗi phát sinh cấp hạ tầng).
* **Impersonation/Support Mode:** Truy cập vào tài khoản Tenant theo phiên bảo mật có ghi log để hỗ trợ kỹ thuật khi được Owner yêu cầu.

### 3. Business Rules (BR-SA)
* **`BR-SA-001` (No Physical Delete):** Không bao giờ xóa vật lý (`HARD DELETE`) dữ liệu Tenant. Khi chấm dứt hợp đồng, chuyển trạng thái sang `INACTIVE` để bảo toàn lịch sử giao dịch và dữ liệu kiểm toán.
* **`BR-SA-002` (Plan Enforcement):** Hệ thống tự động chặn Tenant sử dụng các tính năng hoặc tạo tài nguyên (Branch, Staff) vượt quá hạn mức quy định trong SaaS Plan hiện hành.
* **`BR-SA-003` (Suspension Impact):** Khi Tenant ở trạng thái `SUSPENDED` (do nợ phí hoặc vi phạm chính sách):
  * Vô hiệu hóa toàn bộ quyền đăng nhập/thao tác của Owner, Branch Manager, Staff, PT.
  * Ứng dụng Customer chuyển sang chế độ chỉ đọc (Read-only); từ chối toàn bộ yêu cầu Check-in tại quầy/cổng.
* **`BR-SA-004` (SaaS Payment vs Business Payment):** Luồng thanh toán thuê bao SaaS (Tenant -> FitFlow) độc lập hoàn toàn với luồng thanh toán dịch vụ phòng gym (Customer -> Tenant).

---

## 2. ROLE_OWNER.md

# PHÂN HỆ CHỦ DOANH NGHIỆP / TENANT (OWNER)

### 1. Phạm vi & Ranh giới (Scope & Boundaries)
* **Phạm vi:** Toàn bộ hoạt động kinh doanh, cấu hình nghiệp vụ, chuỗi chi nhánh và nhân sự trong Tenant của mình.
* **Ranh giới:** Không truy cập hoặc nhìn thấy dữ liệu của bất kỳ Tenant nào khác trên nền tảng (`Tenant Data Isolation`).

### 2. Danh mục chức năng (Functional Modules)

#### 2.1. Enterprise Dashboard & Analytics
* Báo cáo hợp nhất doanh thu toàn chuỗi: Doanh thu Membership, Doanh thu PT, Doanh thu Guest.
* So sánh hiệu quả kinh doanh giữa các Chi nhánh (Branch Performance Comparison).
* Tỷ lệ gia hạn hợp đồng (Retention Rate) và phân tích mật độ tập luyện toàn hệ thống.

#### 2.2. Multi-Branch Management
* Khởi tạo và thiết lập thông tin Chi nhánh mới: Tên, địa chỉ, số hotline, giờ mở cửa/đóng cửa.
* Điều phối trạng thái Chi nhánh: `ACTIVE`, `TEMPORARILY_CLOSED`, `INACTIVE`.
* Gán bổ nhiệm / Bãi nhiệm `Branch Manager` cho từng chi nhánh.

#### 2.3. Human Resource & Access Governance
* Quản lý vòng đời nhân sự cấp cao và vận hành: Tạo, kích hoạt, vô hiệu hóa tài khoản Branch Manager, Staff, PT.
* Phân bổ nhân sự làm việc tại một hoặc nhiều chi nhánh cụ thể.

#### 2.4. Membership & Service Catalog Configuration
* **Quản lý Dịch vụ:** Khởi tạo danh mục bộ môn (Gym, Yoga, Boxing, Swimming).
* **Thiết lập Gói tập (Membership Packages):**
  * Tên gói, thời hạn (1 tuần, 1 tháng, 1 năm,...).
  * Phạm vi sử dụng (`HOME_BRANCH` vs `ALL_BRANCHES`).
  * Cấu hình chính sách giá phân tầng theo từng chi nhánh (nếu có).

#### 2.5. PT Business Policy Management
* Phê duyệt danh mục gói PT do huấn luyện viên đề xuất (nếu bật chế độ Owner Approval).
* Thiết lập khung thời hạn áp dụng cho các gói PT (30 ngày, 60 ngày, 90 ngày hoặc không thời hạn).
* Thiết lập tỷ lệ chia sẻ hoa hồng (Commission rate) giữa phòng gym và PT.

#### 2.6. Central Business Settings
* **Cấu hình Check-in/Check-out:** Kích hoạt/vô hiệu hóa các phương thức (Face Recognition, QR Code, Manual, Auto Check-out).
* **Cấu hình Auto Check-out:** Thiết lập khoảng thời gian tự động check-out tính từ lúc check-in (ví dụ: mặc định 4 giờ).
* **Cấu hình Thanh toán:** Nhập thông tin tài khoản ngân hàng thụ hưởng (Số tài khoản, Tên ngân hàng, Tên chủ tài khoản) để hệ thống sinh chuẩn VietQR cho toàn chuỗi hoặc theo chi nhánh.

### 3. Business Rules (BR-OWNER)
* **`BR-OWN-001` (Tenant Boundary):** Mọi truy vấn từ Owner bắt buộc phải đi kèm bộ lọc `tenant_id`. Owner không được quyền truy cập bất kỳ tài nguyên nào ngoài `tenant_id` của mình.
* **`BR-OWN-002` (Immutable Package Snapshot):** Không cho phép sửa đổi quyền lợi hoặc xóa bỏ Membership Package đang có hội viên sử dụng (`Active Memberships > 0`). Chỉ cho phép chuyển trạng thái Package sang `INACTIVE` để ngừng bán mới.
* **`BR-OWN-003` (Branch Inactivation Rule):** Chi nhánh chuyển sang `INACTIVE` sẽ không tiếp nhận Check-in mới, nhưng toàn bộ lịch sử giao dịch, chấm công, dữ liệu hội viên cũ vẫn được lưu trữ toàn vẹn.
* **`BR-OWN-004` (Auto Check-out Snapshot):** Tham số thời gian Auto Check-out được gắn cứng (Snapshot) vào bản ghi Attendance tại thời điểm hội viên Check-in. Việc thay đổi cấu hình sau đó không làm thay đổi hạn giờ của các lượt đang `IN_GYM`.

---

## 3. ROLE_BRANCH_MANAGER.md

# PHÂN HỆ QUẢN LÝ CHI NHÁNH (BRANCH MANAGER)

### 1. Phạm vi & Ranh giới (Scope & Boundaries)
* **Phạm vi:** Điều hành, giám sát toàn bộ hoạt động kinh doanh, nhân sự và vận hành tại **chi nhánh được phân công phụ trách**.
* **Ranh giới:** Không chỉnh sửa cấu hình cốt lõi của Tenant (Gói tập, B2B Billing, Tài khoản thanh toán tổng); không truy cập dữ liệu quản trị của chi nhánh khác nếu không được phân quyền chéo.

### 2. Danh mục chức năng (Functional Modules)

#### 2.1. Branch Operational Dashboard
* Giám sát số lượng hội viên đang có mặt tại phòng tập (`Current In-Gym Counter`).
* Thống kê lượng Check-in trong ngày theo phương thức (Face, QR, Manual, Guest).
* Theo dõi doanh thu trực tiếp tại quầy trong ngày/tháng của chi nhánh.
* Theo dõi lịch dạy và tỷ lệ thực hiện buổi tập của đội ngũ PT tại cơ sở.

#### 2.2. Branch Personnel Supervision
* Quản lý danh sách Staff và PT thuộc chi nhánh.
* Giám sát ca trực, xem nhật ký thao tác (Audit trail) của nhân viên tại quầy.
* Khóa tạm thời hoặc đề xuất chấm dứt quyền truy cập của nhân viên thuộc quyền quản lý.

#### 2.3. Customer & Member Supervision
* Tra cứu danh sách hội viên đăng ký tại chi nhánh hoặc hội viên có quyền `ALL_BRANCHES` đến tập.
* Tiếp nhận và xử lý các trường hợp đặc biệt: Khách hết hạn gói tập cần gia hạn, khiếu nại thông tin nhận diện khuôn mặt.
* Xem báo cáo tỷ lệ chuyển đổi từ Guest sang Member chính thức tại chi nhánh.

#### 2.4. Payment & Financial Control
* Giám sát các giao dịch phát sinh tại chi nhánh (`PENDING`, `PAID`, `CANCELLED`).
* Thẩm quyền hủy các đơn hàng/giao dịch thanh toán `PENDING` bị treo hoặc sai sót.
* Bàn giao và đối soát doanh thu ca trực với nhân viên quầy.

#### 2.5. Operational Attendance Management
* Giám sát luồng Check-in / Check-out thời gian thực.
* Xử lý trường hợp cưỡng chế Check-out (Manual Force Check-out) khi khách quên hoặc có sự cố.
* **Thực hiện Undo Check-in:** Hủy lượt Check-in do nhân viên quét nhầm, kèm theo lý do bắt buộc.

### 3. Business Rules (BR-BM)
* **`BR-BM-001` (Branch Data Scope):** Branch Manager chỉ xem và quản lý các giao dịch, lịch tập, nhân sự phát sinh tại chi nhánh mình quản lý (`branch_id`).
* **`BR-BM-002` (Price Non-Modification):** Branch Manager không có quyền chỉnh sửa giá bán niêm yết của Membership Package đã được Owner cấu hình.
* **`BR-BM-003` (Undo Check-in Limitation):** Chỉ được thực hiện Undo các lượt Check-in phát sinh tại chính chi nhánh mình phụ trách trong ngày làm việc hiện tại.
* **`BR-BM-004` (Financial Integrity):** Tuyệt đối không được xóa hoặc chỉnh sửa số tiền trên các hóa đơn đã ở trạng thái `PAID`.

---

## 4. ROLE_STAFF.md

# PHÂN HỆ NHÂN VIÊN LỄ TÂN / QUẦY (STAFF)

### 1. Phạm vi & Ranh giới (Scope & Boundaries)
* **Phạm vi:** Thao tác nghiệp vụ tiếp đón khách, bán gói dịch vụ, thu ngân và kiểm soát vào/ra trực tiếp tại quầy của chi nhánh làm việc.
* **Ranh giới:** Không truy cập dữ liệu báo cáo tài chính cấp cao; không cấu hình hệ thống; không quản trị tài khoản người dùng khác.

### 2. Danh mục chức năng (Functional Modules)

#### 2.1. Member Registration & Profile Handling
* Tìm kiếm khách hàng theo Số điện thoại, Mã hội viên (`member_code`), hoặc Họ tên.
* Đăng ký hồ sơ khách hàng mới vào hệ thống Tenant.
* Hỗ trợ chụp ảnh và đăng ký dữ liệu khuôn mặt (Face Enrollment) cho hội viên.

#### 2.2. Membership Sales & Point-of-Sale (POS)
* Bán gói tập mới cho khách hàng từ danh mục Package của phòng gym.
* Thực hiện thủ tục Gia hạn gói tập (`Membership Renewal`) và chọn ngày bắt đầu hiệu lực theo thẩm quyền.
* Khởi tạo giao dịch thanh toán, sinh mã VietQR động để khách quét thanh toán chuyển khoản hoặc xác nhận tiền mặt.

#### 2.3. Guest Visit Management (Khách tập theo lượt)
* Tạo phiên tiếp đón khách vãng lai: Nhập thông tin cơ bản -> Chọn gói tập 1 buổi.
* Thu tiền vé ngày -> Hệ thống tự động chuyển `PAID` và kích hoạt Check-in vào phòng tập.
* **Xử lý Guest On-Hold:** Chuyển trạng thái vé lượt sang `ON_HOLD` khi khách đã thanh toán nhưng chưa vào tập do có việc đột xuất; mở lại (`Resume`) khi khách quay lại trong thời hạn cho phép.

#### 2.4. Front-Desk Attendance Operation
* Thực hiện Manual Check-in / Manual Check-out cho khách không dùng QR/Face ID.
* Hỗ trợ xử lý cảnh báo khi khách quét nhận diện lỗi hoặc gói tập hết hạn (`ACCESS_DENIED`).
* **Undo Check-in:** Thực hiện hủy lượt check-in thao tác nhầm tại chi nhánh trực trong vòng tối đa 15 phút kể từ lúc ghi nhận.

### 3. Business Rules (BR-STAFF)
* **`BR-STAFF-001` (Single Active Membership Restriction):** Nhân viên không được phép tạo hợp đồng Membership mới nếu khách hàng đang có một Membership cùng dịch vụ ở trạng thái `ACTIVE`.
* **`BR-STAFF-002` (Guest Auto-Checkin):** Giao dịch mua vé Guest sau khi xác nhận thanh toán thành công (`PAID`) bắt buộc phải tự động kích hoạt trạng thái Check-in (`IN_GYM`).
* **`BR-STAFF-003` (No Physical Attendance Deletion):** Thao tác Undo Check-in không được xóa bản ghi trong Database mà phải cập nhật trạng thái `Attendance.status = CANCELLED`, đồng thời lưu vết `created_by`, `cancelled_at` và `cancel_reason`.
* **`BR-STAFF-004` (In-Gym Duplicate Scan):** Khi hội viên đang có trạng thái `IN_GYM` mà tiếp tục quét nhận diện tại luồng Check-in, hệ thống từ chối tạo lượt mới và hiển thị cảnh báo "Hội viên đang ở trong phòng tập".

---

## 5. ROLE_PT.md

# PHÂN HỆ HUẤN LUYỆN VIÊN CÁ NHÂN (PERSONAL TRAINER - PT)

### 1. Phạm vi & Ranh giới (Scope & Boundaries)
* **Phạm vi:** Quản trị hồ sơ chuyên môn, lịch dạy cá nhân, học viên được phân công và các buổi tập (Sessions) của chính mình.
* **Ranh giới:** Không truy cập danh sách khách hàng chung của phòng tập (trừ học viên của mình); không xem doanh thu hoặc thông tin gói tập của PT khác.

### 2. Danh mục chức năng (Functional Modules)

#### 2.1. Professional Profile Management
* Cập nhật thông tin cá nhân: Ảnh đại diện, tiểu sử, chứng chỉ chuyên môn, phong cách huấn luyện.
* Thiết lập khung giờ làm việc khả dụng (Available Working Hours) theo tuần để khách đặt lịch.

#### 2.2. PT Package Pricing & Proposal
* Định cấu hình và niêm yết giá các gói huấn luyện cá nhân của chính mình (ví dụ: Gói 10 buổi, 20 buổi, 36 buổi).
* Gửi yêu cầu phê duyệt gói PT mới tới Owner (nếu chính sách phòng tập yêu cầu kiểm duyệt giá).

#### 2.3. Client Roster (Quản lý học viên cá nhân)
* Danh sách "My Clients": Xem thông tin học viên đang ký hợp đồng tập luyện với mình.
* Theo dõi tiến độ hợp đồng: Tổng số buổi, số buổi đã hoàn thành, số buổi còn lại, hạn sử dụng gói.
* Ghi chú nhật ký tập luyện (Workout Log), chỉ số cơ thể (InBody/Measurements) của học viên.

#### 2.4. Schedule & Session Confirmation
* Tiếp nhận và xác nhận / từ chối các yêu cầu đặt lịch hẹn (`PT Booking`) từ hội viên.
* **Check-in Buổi tập (Session Completion):** Xác nhận hoàn thành buổi tập sau khi kết thúc ca dạy để hệ thống chính thức trừ buổi.

### 3. Business Rules (BR-PT)
* **`BR-PT-001` (PT Binding):** Mỗi hợp đồng PT Package bán ra bắt buộc phải gán cố định với một PT duy nhất (`pt_id`). Không hỗ trợ gói PT dùng chung cho nhiều PT trừ khi có nghiệp vụ chuyển nhượng hợp đồng.
* **`BR-PT-002` (Session Deduction Trigger):** Số buổi còn lại (`remaining_sessions`) của học viên **chỉ bị trừ khi buổi tập chuyển sang trạng thái `COMPLETED`**. Khi lịch hẹn ở trạng thái `SCHEDULED` hoặc `PENDING`, số buổi vẫn được giữ nguyên.
* **`BR-PT-003` (Active Membership Prerequisite):** PT chỉ có thể nhận học viên hoặc thực hiện buổi dạy nếu học viên đó đang có hợp đồng `Membership = ACTIVE` tại phòng tập.
* **`BR-PT-004` (Client Data Privacy):** PT chỉ được phép xem số điện thoại và thông tin tập luyện của những khách hàng đang có hợp đồng PT còn hiệu lực với chính mình.

---

## 6. ROLE_CUSTOMER.md

# PHÂN HỆ HỘI VIÊN / KHÁCH HÀNG (CUSTOMER)

### 1. Phạm vi & Ranh giới (Scope & Boundaries)
* **Phạm vi:** Toàn bộ thông tin cá nhân, quyền lợi thẻ tập, lịch sử tập luyện, giao dịch thanh toán và đặt lịch dịch vụ của chính bản thân.
* **Ranh giới:** Không truy cập dữ liệu của hội viên khác; không truy cập các cổng thông tin nội bộ của nhân sự phòng tập.Mỗi tài khoản chỉ có thể đăng nhập tại cổng đăng nhập của chi nhánh khách hàng được staff tạo tài khoản.

### 2. Danh mục chức năng (Functional Modules)

#### 2.1. Member Identity & Personal Profile
* Xem và chỉnh sửa thông tin liên lạc cá nhân (sđt địa chỉ liên hệ, ngày sinh, nơi ở).
* Quản lý mã định danh số: Truy cập mã **Personal Dynamic QR Code** dùng để Check-in / Check-out tại các điểm kiểm soát.
* Cung cấp hình ảnh khuôn mặt để đăng ký dịch vụ nhận diện Face ID tại cơ sở.

#### 2.2. My Memberships & Benefits
* Tra cứu thông tin gói tập hiện tại: Tên gói, loại thẻ, ngày kích hoạt, ngày hết hạn, trạng thái (`ACTIVE`, `EXPIRED`, `FROZEN`).
* Kiểm tra quyền hạn chi nhánh: Danh sách các chi nhánh được phép vào tập (`HOME_BRANCH` cụ thể hay `ALL_BRANCHES`).
* Xem lịch sử tất cả các gói tập đã từng tham gia trong quá khứ.

#### 2.3. PT Training & Booking Service
* Xem tiến độ gói tập cá nhân: Huấn luyện viên phụ trách, số buổi đã tập, số buổi còn lại, hạn sử dụng gói.
* **Đặt lịch tập (Booking):** Tra cứu khung giờ trống của PT -> Chọn giờ tập -> Gửi yêu cầu đặt lịch.
* **Hủy lịch tập (Cancellation):** Thực hiện hủy lịch đã hẹn theo chính sách hủy đặt trước của hệ thống.

#### 2.4. Attendance & Access History
* Tra cứu nhật ký ra/vào phòng tập: Thời gian Check-in, thời gian Check-out, chi nhánh tập, phương thức xác thực (Face/QR/Manual).
* Nhận thông báo tự động (Push Notification) khi hệ thống thực hiện Auto Check-out.

#### 2.5. Billing & Transaction History
* Xem lịch sử thanh toán hóa đơn thẻ tập, gói PT, vé ngày.
* Tải về biên lai/hóa đơn điện tử đối với các giao dịch thành công (`PAID`).

### 3. Business Rules (BR-CUST)
* **`BR-CUST-001` (Single Active PT Package):** Một khách hàng tại một thời điểm chỉ được sở hữu tối đa **01 gói PT Package ở trạng thái `ACTIVE`**. Khách hàng phải sử dụng hết số buổi hoặc đợi gói hết hạn mới được kích hoạt gói PT tiếp theo.
* **`BR-CUST-002` (Branch Access Restriction):** Khách hàng sở hữu gói tập phạm vi `HOME_BRANCH` sẽ bị hệ thống tự động từ chối truy cập (`ACCESS_DENIED`) khi thực hiện Check-in tại các chi nhánh khác thuộc Tenant.
* **`BR-CUST-003` (Unlimited Daily Check-ins):** Đối với các gói Membership dài hạn (tuần, tháng, năm), khách hàng không bị giới hạn số lần Check-in ra/vào phòng tập trong cùng một ngày.
* **`BR-CUST-004` (Secure Token QR):** Mã QR cá nhân trên ứng dụng là một Dynamic Token tự động làm mới định kỳ (ví dụ: mỗi 30-60 giây) để chống hành vi chụp ảnh màn hình chuyển tiếp cho người khác dùng hộ.

---

## 7. PERMISSION_MATRIX.md

# MA TRẬN PHÂN QUYỀN HỆ THỐNG TỔNG HỢP (PERMISSION MATRIX)

| Nghiệp vụ / Quyền hạn | Super Admin | Tenant Owner | Branch Manager | Staff (Lễ tân) | PT (HLV) | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quản trị Multi-Tenant & SaaS Plan** | **CRUD** | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Quản lý Chi nhánh (Branch)** | Read (All) | **CRUD** (Own) | Read (Assigned) | Read (Assigned) | Read (Assigned) | Read (Public) |
| **Quản lý Nhân sự (Staff / PT / BM)** | ✗ | **CRUD** (Own) | **CRUD** (Branch) | ✗ | ✗ | ✗ |
| **Cấu hình Gói Membership** | ✗ | **CRUD** | Read-only | Read-only | ✗ | Read (Public) |
| **Cấu hình Giá gói PT** | ✗ | Approve/Audit | Read-only | Read-only | **Create/Update** (Own) | Read (Assigned) |
| **Đăng ký / Bán thẻ tập (POS)** | ✗ | Read-only | Read-only | **Execute** | ✗ | ✗ |
| **Tạo & Quản lý vé Guest (Vé lượt)** | ✗ | Read-only | Read/Audit | **Execute** | ✗ | ✗ |
| **Thực hiện Check-in / Check-out** | ✗ | Read-only | Monitor | **Execute** (Manual/QR) | ✗ | **Self** (QR/Face) |
| **Undo Check-in (Hủy check-in nhầm)** | ✗ | Audit | **Execute** (Branch) | **Execute** (15 mins) | ✗ | ✗ |
| **Xác nhận hoàn thành buổi tập PT** | ✗ | Audit | Audit | ✗ | **Execute** (Own) | Read (Self) |
| **Đặt lịch tập PT (Booking)** | ✗ | ✗ | Support | Support | Confirm/Reject | **Create/Cancel** |
| **Báo cáo tài chính doanh nghiệp** | SaaS Revenue | Full Tenant | Branch Level | Shift Level | Personal Earn | Personal Bill |