Cấu hình tài nguyên & Giới hạn của Gói Dùng Thử
Gói dùng thử này được cấu hình bởi Super Admin để mở khóa tối đa giới hạn tài nguyên và tính năng nhằm giúp doanh nghiệp (Tenant) kiểm thử toàn diện
:
Thời hạn sử dụng: Đúng 7 ngày kể từ thời điểm kích hoạt hệ thống (hệ thống ghi nhận trạng thái Subscription là TRIAL)
.
Giới hạn Chi nhánh (Branch Limit): Tối đa 2 Chi nhánh
. Việc cấp quyền cho 2 chi nhánh là bắt buộc để Tenant có thể thử nghiệm tính năng vận hành đa cơ sở (Multi-Branch)
.
Giới hạn Người dùng (User Limit): Tối đa 10 tài khoản nhân sự
. Số lượng này vừa đủ để Tenant thiết lập đầy đủ sơ đồ tổ chức mẫu bao gồm: 1 Owner (Quản trị Tenant)
, 1 Branch Manager (Quản lý chi nhánh)
, 4 Staff (Nhân viên lễ tân)
 và 4 PT (Huấn luyện viên cá nhân)
.
Giới hạn Tính năng (Feature Limit): Mở khóa toàn bộ các tính năng cốt lõi và cao cấp nhất của hệ thống FitFlow
:
Quản lý Hội viên & Gói tập Đa chi nhánh: Cho phép tạo và thử nghiệm gói tập có phạm vi sử dụng trên toàn hệ thống (ALL_BRANCHES), giúp kiểm tra tính năng khách hàng mua gói ở chi nhánh A nhưng có thể sang chi nhánh B tập luyện
.
Nhận diện khuôn mặt (Face Recognition): Kích hoạt đầy đủ công nghệ sinh trắc học để Tenant tự thiết lập và kiểm thử quy trình tự động check-in tại quầy
.
Quản lý dịch vụ PT (PT Management & Booking): Trải nghiệm luồng đặt lịch hoàn chỉnh: Khách hàng đặt lịch hẹn → PT xác nhận buổi tập → Hệ thống tự động trừ số buổi tập của gói khi trạng thái chuyển sang COMPLETED
.
Tích hợp VietQR & Quản lý Thanh toán: Tạo hóa đơn thử nghiệm ở trạng thái PENDING và hiển thị mã VietQR động để tự động xác nhận gạch nợ sang trạng thái PAID
.
Tính năng Kiểm toán (Audit Log & Undo): Cho phép thử nghiệm các tác vụ nhạy cảm của nhân viên như hủy lượt check-in (Undo Attendance), yêu cầu hệ thống ghi nhận vết kiểm toán (gồm người thực hiện, thời gian, lý do hủy) và không thực hiện xóa vật lý dữ liệu để bảo đảm an toàn thông tin
.
II. Các quy tắc hệ thống bắt buộc áp dụng khi dùng thử
Để đảm bảo tính toàn vẹn hệ thống và tạo tiền đề chuyển đổi sang gói trả phí mượt mà, Gói Dùng Thử phải tuân thủ nghiêm ngặt các quy tắc nghiệp vụ sau:
Tự động vô hiệu hóa dịch vụ khi hết hạn (Subscription Expiration):
Ngay khi chạm mốc hết hạn 7 ngày, hệ thống sẽ tự động chuyển trạng thái của Tenant sang EXPIRED
.
Quyền sử dụng tính năng của Tenant bị đóng băng lập tức
. Hội viên quét mã QR hoặc Face Recognition tại quầy sẽ nhận cảnh báo ACCESS DENIED
.
Cô lập dữ liệu tuyệt đối (Tenant Isolation): Toàn bộ dữ liệu phát sinh trong quá trình dùng thử (Thông tin hội viên, lịch sử ra vào, lịch đặt PT, báo cáo doanh thu ảo) phải được cô lập tuyệt đối trong phạm vi Tenant đó và không thể bị truy cập bởi bất kỳ Tenant nào khác trên hệ thống
.
Bảo toàn dữ liệu khi nâng cấp (Seamless Upgrade):
Do dữ liệu được quản lý đồng nhất theo phạm vi doanh nghiệp (Tenant Scope)
, khi Tenant quyết định thanh toán phí SaaS để nâng cấp từ gói dùng thử lên gói trả phí chính thức (Standard hoặc Enterprise), toàn bộ cơ sở dữ liệu đã cấu hình và lịch sử vận hành thử nghiệm trong 1 tuần trước đó sẽ được bảo lưu nguyên vẹn mà không cần phải thiết lập lại từ đầu.
