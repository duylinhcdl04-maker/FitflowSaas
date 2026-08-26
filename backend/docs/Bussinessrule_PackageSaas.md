1. Gói Cơ Bản (Basic / Single-Branch Plan)
Phù hợp cho các phòng tập Gym, Yoga, Fitness quy mô nhỏ hoạt động độc lập.
Giới hạn tài nguyên:
Số lượng Chi nhánh: Tối đa 1 Chi nhánh (không kích hoạt tính năng đa chi nhánh Multi-Branch)
.
Số lượng Nhân sự: Giới hạn số lượng tài khoản Staff và PT (ví dụ: tối đa 5 tài khoản nhân sự)
.
Tính năng được mở khóa:
Quản lý Hội viên cơ bản: Cho phép đăng ký thông tin hội viên (Customer Profile)
 và quản lý gói tập thuộc phạm vi một chi nhánh đăng ký duy nhất (HOME_BRANCH)
.
Phương thức Check-in: Hỗ trợ quét mã Personal QR Code định danh của khách hàng hoặc Manual Check-in thực hiện bởi nhân viên lễ tân tại quầy
. (Không hỗ trợ Face Recognition).
Quản lý Thanh toán (Payment): Tạo hóa đơn ở trạng thái PENDING và hiển thị QR thanh toán (VietQR) tại quầy để chuyển trạng thái sang PAID
. Tài khoản nhận tiền được cấu hình chung ở cấp Tenant
.
Báo cáo cơ bản: Hiển thị Dashboard theo dõi lượng khách check-in trong ngày, danh sách khách hàng đang có mặt tại phòng tập (IN_GYM) và doanh thu cơ bản
.
2. Gói Tiêu Chuẩn (Standard / Growth Plan)
Phù hợp cho các phòng tập chuyên nghiệp có đội ngũ PT cá nhân hoặc chuỗi phòng tập quy mô trung bình.
Giới hạn tài nguyên:
Số lượng Chi nhánh: Tối đa 3 Chi nhánh (kích hoạt tính năng Multi-Branch)
.
Số lượng Nhân sự: Hỗ trợ số lượng tài khoản nhân sự lớn hơn (ví dụ: tối đa 15–20 tài khoản bao gồm cả Branch Manager, Staff và PT)
.
Tính năng được mở khóa:
Bao gồm toàn bộ tính năng của Gói Cơ Bản.
Vận hành Đa chi nhánh (Multi-Branch): Cho phép thiết kế và bán các gói Membership có phạm vi sử dụng trên toàn hệ thống (ALL_BRANCHES), giúp khách hàng linh hoạt check-in ở bất kỳ chi nhánh nào thuộc Tenant
.
Quản lý Huấn luyện viên cá nhân (PT Management):
PT tự quản lý hồ sơ cá nhân, chuyên môn và lịch làm việc
.
Quản lý các gói PT Package gắn liền với từng PT cụ thể
.
Khách hàng tự đặt lịch hẹn tập (PT Booking) và hệ thống tự động trừ số buổi tập của gói khi session được PT xác nhận hoàn thành (COMPLETED)
.
Nhận diện khuôn mặt (Face Recognition): Kích hoạt công nghệ xác nhận sinh trắc học để khách hàng tự động Check-in nhanh tại quầy
.
Báo cáo phân quyền: Cung cấp Dashboard chi tiết cho từng Branch Manager để quản lý doanh thu, hiệu suất hoạt động và lịch trình PT tại chi nhánh được phân công
.
3. Gói Nâng Cao / Doanh Nghiệp (Enterprise Plan)
Phù hợp cho các chuỗi thương hiệu lớn, cao cấp hoặc các hệ thống nhượng quyền thương mại cần quản trị dòng tiền và bảo mật chặt chẽ.
Giới hạn tài nguyên:
Số lượng Chi nhánh: Không giới hạn số lượng cơ sở hoạt động.
Số lượng Nhân sự: Không giới hạn số lượng tài khoản đăng ký vận hành hệ thống (Owner, Branch Manager, Staff, PT)
.
Tính năng được mở khóa:
Bao gồm toàn bộ tính năng của Gói Tiêu Chuẩn.
Cấu hình dòng tiền linh hoạt (Flexible Payment Config): Kích hoạt khả năng cấu hình tài khoản nhận tiền/VietQR riêng biệt cho từng Chi nhánh
. Điều này giúp các chi nhánh hạch toán độc lập thay vì bắt buộc dùng chung một tài khoản ở cấp Tenant
.
Hệ thống Audit Log & Bảo mật chuyên sâu: Ghi nhận nhật ký hoạt động (Audit Trail) chi tiết đối với tất cả thao tác nhạy cảm của nhân viên như thực hiện Undo Attendance/Check-in (yêu cầu lưu thông tin người thực hiện, thời gian, lý do hủy và không được xóa vật lý dữ liệu gốc)
.
Quản trị tập trung (Tenant Dashboard): Owner có quyền truy cập báo cáo tổng hợp hợp nhất toàn bộ doanh nghiệp, so sánh hiệu suất tài chính, doanh thu giữa các chi nhánh và cấu hình dùng chung toàn hệ thống
 Các quy tắc hệ thống cốt lõi bắt buộc áp dụng khi cấu hình gói thuê
Dù doanh nghiệp (Tenant) lựa chọn gói thuê nào, hệ thống FitFlow vẫn phải tuân thủ nghiêm ngặt các quy định sau:
Cô lập dữ liệu (Tenant Isolation): Dữ liệu của Tenant này phải hoàn toàn độc lập và không thể bị truy cập bởi Tenant khác
.
Quản lý vòng đời thuê: Trạng thái hoạt động của gói thuê (Trial, Active, Expired, Suspended) sẽ trực tiếp quyết định quyền truy cập tính năng của Tenant
. Nếu trạng thái là Expired, quyền Check-in của hội viên thuộc Tenant đó sẽ bị hệ thống từ chối
.
Lưu trữ Snapshot: Khi Tenant nâng cấp/hạ cấp gói, hoặc cấu hình lại gói tập, các giao dịch tài chính (SaaS Subscription Payment) và dữ liệu lịch sử đã bán cho khách hàng phải được lưu dưới dạng Snapshot để bảo toàn dữ liệu lịch sử và báo cáo tài chính chính xác
