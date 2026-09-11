# FITFLOW SAAS - BẢNG DANH MỤC TÍNH NĂNG VÀ GIỚI HẠN ĐỊNH MỨC
> **Tài liệu đặc tả dành cho Phân tích Nghiệp vụ (Business Analyst) & Định giá Sản phẩm (Product Pricing & Packaging Strategy)**  
> *Phiên bản:* 1.0  
> *Phạm vi áp dụng:* Toàn bộ hệ sinh thái FitFlow SaaS (Super Admin, Owner Portal, Mobile App, Kiosk Face Check-in).

---

## MỤC LỤC
1. [Kiến trúc Phân quyền Gói cước (Entitlements Architecture)](#1-kiến-trúc-phân-quyền-gói-cước)
2. [Chi tiết 17 Tính năng Nền tảng (Boolean Features)](#2-chi-tiết-17-tính-năng-nền-tảng-boolean-features)
   - 2.1. Phân hệ Check-in & Điểm danh (CHECKIN)
   - 2.2. Phân hệ Quản lý Hội viên (MEMBERSHIP)
   - 2.3. Phân hệ Huấn luyện viên & PT (TRAINING)
   - 2.4. Phân hệ Báo cáo & Phân tích (ANALYTICS)
   - 2.5. Phân hệ Giao tiếp & Thông báo (COMMUNICATION)
   - 2.6. Phân hệ Tích hợp & Kết nối (INTEGRATION)
   - 2.7. Phân hệ Bảo mật & Kiểm toán (SECURITY)
3. [Chi tiết 10 Giới hạn Định mức Tài nguyên (Quota Limits)](#3-chi-tiết-10-giới-hạn-định-mức-tài-nguyên-quota-limits)
4. [Nguyên lý Đóng gói & Đòn bẩy Nâng cấp (Packaging Principles & Upgrade Triggers)](#4-nguyên-lý-đóng-gói--đòn-bẩy-nâng-cấp)
5. [Khuyến nghị Phân tầng Giá trị (Value Tiering Guidelines)](#5-khuyến-nghị-phân-tầng-giá-trị-value-tiering-guidelines)

---

## 1. KIẾN TRÚC PHÂN QUYỀN GÓI CƯỚC

Hệ thống FitFlow quản lý phân quyền tính năng thông qua bảng `platform_features` và cấu hình theo gói tại `saas_plan_features`. Hệ thống chia làm 2 loại cơ chế kiểm soát:

* **Loại BOOLEAN (Bật / Tắt):** Quyết định Tenant có quyền truy cập hoặc nhìn thấy phân hệ chức năng tương ứng hay không. Khi tắt, backend sẽ chặn qua hàm `assertFeatureEnabled(code)` và giao diện sẽ ẩn/khóa tính năng.
* **Loại QUOTA (Định mức số lượng):** Giới hạn dung lượng sử dụng tối đa của Tenant trong chu kỳ. Backend kiểm tra qua `assertQuotaAvailable(code, currentCount)` để ngăn chặn việc tạo vượt ngưỡng (hoặc kích hoạt mua Add-on mở rộng).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    FITFLOW SAAS PLATFORM                    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│    17 BOOLEAN FEATURES    │               │      10 QUOTA LIMITS      │
│  (Phân quyền chức năng)   │               │   (Giới hạn tài nguyên)   │
└───────────────────────────┘               └───────────────────────────┘
```

---

## 2. CHI TIẾT 17 TÍNH NĂNG NỀN TẢNG (BOOLEAN FEATURES)

### 2.1. Phân hệ Check-in & Điểm danh (`module: CHECKIN`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `QR_CHECKIN` | **Check-in bằng QR** | Cho phép hội viên quét mã QR động cá nhân trên ứng dụng di động để tự động Check-in / Check-out tại quầy hoặc cửa kiểm soát. | **Tính năng cốt lõi (Core Feature):** Bắt buộc phải có ở tất cả các gói (kể cả gói thấp nhất). Giúp phòng gym bỏ thẻ nhựa vật lý, tiết kiệm chi phí in ấn thẻ. |
| `FACE_RECOGNITION` | **Nhận diện khuôn mặt (Face ID AI)** | Tích hợp Camera AI tại máy tính bảng/Kiosk quầy lễ tân để quét khuôn mặt hội viên, tự động đối soát và mở cửa check-in dưới 1 giây. | **Tính năng sát thủ (Killer Feature / Upsell Trigger):** Trải nghiệm cực kỳ cao cấp, chống gian lận mượn thẻ tập. Do tốn chi phí hạ tầng AI xử lý hình ảnh, nên **chỉ bật từ gói Chuyên Nghiệp (Growth/Pro) trở lên** hoặc bán dưới dạng Add-on. |
| `ATTENDANCE_ANALYTICS` | **Thống kê điểm danh** | Phân tích biểu đồ tần suất tập luyện, phát hiện khung giờ cao điểm (Peak Hours), thống kê hội viên vắng mặt trên 7 - 14 ngày. | **Tính năng giữ chân khách hàng (Retention):** Giúp chủ phòng gym biết khung giờ đông để bố trí nhân sự, lọc danh sách khách lười đi tập để telesale/lễ tân chăm sóc kịp thời. |

---

### 2.2. Phân hệ Quản lý Hội viên (`module: MEMBERSHIP`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `MEMBERSHIP_MANAGEMENT` | **Quản lý hội viên** | Quản lý toàn bộ hồ sơ khách hàng (Customer Profile), lịch sử mua gói tập, tạo hợp đồng điện tử và phân hạng hội viên (Silver, Gold, Diamond). | **Tính năng nền tảng (Base Feature):** Luôn luôn BẬT ở mọi gói. Đây là chức năng bắt buộc để phòng gym vận hành thay thế Excel. |
| `AUTO_RENEWAL` | **Tự động gia hạn gói tập** | Tự động tạo hóa đơn và gửi link thanh toán VietQR động/cổng thanh toán khi thẻ hội viên sắp đến kỳ gia hạn; kích hoạt chu kỳ mới khi thanh toán thành công. | **Tăng trưởng doanh thu lặp lại (Recurring Revenue):** Giúp phòng gym không bị đứt đoạn dòng tiền. Rất phù hợp định vị ở các gói tầm trung và cao cấp để thúc đẩy chuyển đổi số sâu. |
| `MEMBERSHIP_EXPIRATION_ALERT` | **Cảnh báo hết hạn gói tập** | Hệ thống tự động gửi thông báo trên App/Dashboard cho lễ tân và hội viên trước 3, 7, 15 ngày khi thẻ hội viên sắp hết hạn. | **Chống rớt học viên (Churn Prevention):** Giúp lễ tân chủ động tư vấn tái ký hợp đồng trước ngày hết hạn. Khuyên dùng: BẬT từ gói Cơ bản. |

---

### 2.3. Phân hệ Huấn luyện viên & PT (`module: TRAINING`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `PT_MANAGEMENT` | **Quản lý huấn luyện viên (PT)** | Khai báo danh sách HLV cá nhân, quản lý hợp đồng dạy kèm, ca làm việc và tự động tính hoa hồng (% commission) cho PT theo từng buổi dạy. | **Nghiệp vụ doanh thu cao:** Doanh thu PT thường chiếm 40-60% tổng thu phòng gym. Giúp chống gian lận chia hoa hồng giữa quản lý và huấn luyện viên. |
| `PT_BOOKING` | **Đặt lịch tập PT** | Cho phép hội viên mở App xem lịch trống của PT được chỉ định và chủ động đặt lịch hẹn (Booking Session); PT nhận thông báo xác nhận lịch dạy. | **Tối ưu trải nghiệm (Customer Experience):** Giảm thiểu tin nhắn thủ công qua Zalo. Rất tiện lợi cho các phòng tập có dịch vụ kèm 1-1 chuyên nghiệp. |
| `WORKOUT_PLANS` | **Giáo án tập luyện cá nhân** | Thiết kế bài tập chi tiết (số set, reps, khối lượng tạ), theo dõi chỉ số InBody và lộ trình dinh dưỡng chuyên biệt cho từng học viên. | **Giá trị gia tăng (Value-add):** Nâng cao năng lực cạnh tranh của PT. Nên định vị ở gói Pro/Enterprise để phân biệt với gói cơ bản chỉ quản lý lịch. |

---

### 2.4. Phân hệ Báo cáo & Phân tích (`module: ANALYTICS`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `BASIC_ANALYTICS` | **Báo cáo tổng quan** | Báo cáo doanh thu bán gói tập hàng ngày/tuần/tháng, số lượng hội viên mới đăng ký, lưu lượng khách ra vào phòng tập. | **Báo cáo chuẩn:** Cung cấp cho mọi gói để chủ phòng nắm được dòng tiền và lượng khách cơ bản. |
| `ADVANCED_ANALYTICS` | **Báo cáo chuyên sâu & Tài chính** | Phân tích tài chính chuyên sâu theo từng dòng sản phẩm, dự báo dòng tiền tương lai, tỷ lệ chuyển đổi sales, tỷ lệ rớt khách (Churn Rate) và so sánh giữa các cơ sở. | **Dành cho cấp điều hành (Executive Level):** Đòn bẩy phân tầng gói cước. Phòng gym nhỏ không cần, nhưng trung tâm lớn và chuỗi bắt buộc phải có để ra quyết định kinh doanh. |

---

### 2.5. Phân hệ Giao tiếp & Thông báo (`module: COMMUNICATION`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `EMAIL_NOTIFICATION` | **Thông báo Email** | Gửi email tự động xác nhận đặt chỗ PT, hóa đơn điện tử VAT/biên lai thu tiền và email chăm sóc sinh nhật, ưu đãi. | **Kênh giao tiếp chi phí thấp:** Phù hợp bật cho tất cả các gói với hạn mức quota email tương ứng. |
| `SMS_NOTIFICATION` | **Thông báo SMS Brandname** | Gửi tin nhắn SMS Brandname (tên thương hiệu gym) mã OTP đăng nhập, nhắc lịch tập khẩn cấp hoặc tin nhắn chúc mừng. | **Kênh viễn thông tốn phí (Direct Cost):** Mỗi SMS tốn cước mạng telco. **Chỉ nên bật từ gói Pro (kèm quota giới hạn)** hoặc bán gói cước nạp SMS riêng (Add-on). |

---

### 2.6. Phân hệ Tích hợp & Kết nối (`module: INTEGRATION`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `API_ACCESS` | **Tích hợp Open API** | Cung cấp hệ thống RESTful API chuẩn mở để doanh nghiệp kết nối FitFlow với phần mềm kế toán (MISA, FAST), hệ thống ERP (SAP, Odoo) hoặc Website/App riêng. | **Đặc quyền Enterprise:** Rào cản công nghệ cao nhất. Chỉ mở cho chuỗi phòng tập lớn hoặc thương hiệu có đội ngũ công nghệ riêng. |
| `WEBHOOK` | **Webhook thời gian thực** | Bắn tín hiệu sự kiện tự động (Event triggers) theo thời gian thực khi có khách check-in, đơn thanh toán thành công hoặc phát sinh đăng ký mới. | **Đồng bộ thời gian thực:** Kết nối với các hệ thống tự động hóa marketing (Zapier, n8n, CRM riêng). Khuyên dùng: Chỉ dành cho gói Enterprise. |

---

### 2.7. Phân hệ Bảo mật & Kiểm toán (`module: SECURITY`)

| Mã Code | Tên tính năng | Mô tả kỹ thuật trong hệ thống | Ý nghĩa kinh doanh & Đóng gói (BA Perspective) |
| :--- | :--- | :--- | :--- |
| `TWO_FACTOR_AUTH` | **Xác thực 2 lớp (2FA)** | Bắt buộc hoặc tùy chọn kích hoạt bảo mật tài khoản quản trị viên và nhân viên bằng mã TOTP (Google Authenticator / Authy). | **Bảo mật tiêu chuẩn:** Khuyến nghị BẬT ở tất cả các gói trả phí nhằm bảo vệ dữ liệu doanh nghiệp và tài khoản nhận tiền. |
| `AUDIT_LOGS` | **Nhật ký truy vết hệ thống** | Ghi lại toàn bộ lịch sử thao tác nhạy cảm của nhân viên: sửa hợp đồng, giảm giá, hủy check-in (ai sửa, sửa lúc nào, lý do gì). | **Kiểm soát nội bộ (Internal Audit):** Phòng gym càng đông nhân viên càng sợ nhân viên thu tiền riêng của khách rồi hủy hóa đơn. Rất quan trọng với gói Pro và Enterprise. |

---

## 3. CHI TIẾT 10 GIỚI HẠN ĐỊNH MỨC TÀI NGUYÊN (QUOTA LIMITS)

Các chỉ số Quota đóng vai trò là **Thước đo giá trị (Value Metric)**. Khi phòng gym phát triển vượt quá ngưỡng cho phép, họ bắt buộc phải nâng cấp lên gói cao hơn (*Expansion Revenue*).

| Mã Quota | Tên giới hạn | Đơn vị tính | Vai trò nghiệp vụ & Cơ chế kiểm soát |
| :--- | :--- | :---: | :--- |
| `MAX_BRANCHES` | **Số chi nhánh tối đa** | Chi nhánh (Phòng) | **Rào cản nâng cấp lớn nhất (Top Upgrade Driver):** Gói Basic chỉ cho phép 1 phòng tập. Khi chủ phòng mở cơ sở thứ 2 hoặc thứ 3, bắt buộc nâng cấp lên gói Pro hoặc Enterprise. |
| `MAX_MEMBERS` | **Số hội viên tối đa** | Hồ sơ khách hàng | Tổng số hồ sơ hội viên được lưu trữ trong cơ sở dữ liệu. Ngăn chặn việc lạm dụng lưu trữ dữ liệu không giới hạn ở gói thấp. |
| `MAX_ACTIVE_MEMBERS` | **Hội viên hoạt động tối đa** | Người / Thẻ hiệu lực | Số hội viên có gói tập đang còn hạn sử dụng cùng thời điểm. Đánh giá trực tiếp quy mô vận hành thực tế của phòng gym. |
| `MAX_STAFF` | **Số nhân viên tối đa** | Tài khoản nhân sự | Số tài khoản nhân viên được cấp quyền (Branch Manager, Lễ tân, Thu ngân). Kiểm soát quy mô bộ máy nhân sự. |
| `MAX_PT` | **Số HLV (PT) tối đa** | Tài khoản HLV | Số lượng huấn luyện viên cá nhân được đăng ký và xuất hiện trên lịch tập của ứng dụng. |
| `MAX_PT_BOOKINGS` | **Lượt đặt PT / tháng** | Buổi tập / tháng | Tổng số buổi dạy PT được đặt lịch trong một tháng. Giúp đo lường cường độ khai thác dịch vụ dạy kèm. |
| `MAX_CHECKINS_MONTH` | **Lượt check-in / tháng** | Lượt quét / tháng | Tổng số lần hội viên quét mã QR hoặc nhận diện khuôn mặt qua cửa kiểm soát mỗi tháng. Phản ánh lưu lượng ra vào phòng. |
| `MAX_STORAGE` | **Dung lượng lưu trữ (GB)** | Gigabyte (GB) | Dung lượng lưu trữ đám mây cho ảnh chân dung hội viên, hợp đồng scan, tài liệu PDF. Chi phí gắn liền với Cloud Storage (S3/GCS). |
| `MAX_EMAILS_MONTH` | **Emails gửi / tháng** | Email / tháng | Giới hạn số lượng email tự động gửi qua SMTP server nhằm chống spam và tối ưu chi phí hạ tầng mail. |
| `MAX_SMS_MONTH` | **SMS gửi / tháng** | Tin nhắn / tháng | Hạn mức tin nhắn SMS Brandname viễn thông được FitFlow tài trợ miễn phí trong gói cước mỗi tháng. |

---

## 4. NGUYÊN LÝ ĐÓNG GÓI & ĐÒN BẨY NÂNG CẤP (UPGRADE TRIGGERS)

Khi xây dựng các gói cước thương mại, Business Analyst áp dụng 3 quy tắc cốt lõi:

```
                  ┌───────────────────────────────────────────┐
                  │          3 ĐÒN BẨY NÂNG CẤP CHÍNH         │
                  └─────────────────────┬─────────────────────┘
                                        │
     ┌──────────────────────────────────┼──────────────────────────────────┐
     ▼                                  ▼                                  ▼
[GIỚI HẠN QUY MÔ]              [TÍNH NĂNG ĐẲNG CẤP]             [TÍCH HỢP HỆ THỐNG]
Số chi nhánh, Hội viên,        Camera AI Face Check-in,         Open RESTful API,
Tài khoản PT & Nhân sự         Tự động gia hạn, Audit logs      Webhook thời gian thực
```

1. **Nguyên tắc "Good - Better - Best":**
   * **Good (Cơ Bản):** Đủ tính năng để sống sót và vận hành gọn gàng, nhưng bị giới hạn về quy mô (1 chi nhánh, tối đa 300 hội viên).
   * **Better (Chuyên Nghiệp - Gói Trọng Tâm Hero Plan):** Mở khóa tính năng tạo sự khác biệt vượt trội (Face ID AI, Tự động gia hạn thẻ) và nới rộng quota (3 chi nhánh, 2.000 hội viên).
   * **Best (Doanh Nghiệp):** Dành riêng cho khách hàng lớn, mở toàn bộ tính năng và cung cấp Open API kết nối ERP.
2. **Nguyên tắc bảo vệ chi phí biên (COGS Protection):**
   * Tuyệt đối không cấp SMS Brandname hoặc Face ID AI ở gói giá rẻ nhất (Basic), vì chi phí viễn thông và nhận diện khuôn mặt sẽ bào mòn lợi nhuận biên của SaaS.
3. **Nguyên tắc chu kỳ thanh toán:**
   * Không bao giờ bán gói dịch vụ phòng gym theo đơn vị ngày. Luôn luôn bán theo **Tháng (Monthly)** và **Năm (Annual - chiết khấu 15-20% tặng 2 tháng)**.

---

## 5. KHUYẾN NGHỊ PHÂN TẦNG GIÁ TRỊ (VALUE TIERING GUIDELINES)

Bảng đối chiếu tổng quan khuyến nghị cho 3 gói cước chính thức (Không bao gồm Gói Dùng thử 14 ngày):

| Nhóm chỉ số | GÓI CƠ BẢN (STARTER) | GÓI CHUYÊN NGHIỆP (GROWTH) | GÓI DOANH NGHIỆP (ENTERPRISE) |
| :--- | :---: | :---: | :---: |
| **Đối tượng phù hợp** | Studio Yoga/Pilates, Gym nhỏ đơn điểm | Trung tâm thể hình thương mại, chuỗi 2-3 điểm | Chuỗi Mega Gym lớn, chuỗi nhượng quyền |
| **Giá niêm yết (Tháng)** | **490.000 ₫ / tháng** | **990.000 ₫ / tháng** | **2.490.000 ₫ / tháng** |
| **Giá ưu đãi (Năm)** | **4.880.000 ₫ / năm** *(tặng 2 tháng)* | **9.860.000 ₫ / năm** *(tặng 2 tháng)* | **24.800.000 ₫ / năm** *(tặng 2 tháng)* |
| **Thời hạn dùng thử** | **0 ngày** *(Thu phí ngay)* | **0 ngày** *(Thu phí ngay)* | **0 ngày** *(Thu phí ngay)* |
| **Số tính năng BẬT** | **9 / 17 tính năng** | **15 / 17 tính năng** | **17 / 17 tính năng (Full)** |
| `FACE_RECOGNITION` | ❌ Tắt |  **Bật (Signature Feature)** |  **Bật** |
| `AUTO_RENEWAL` | ❌ Tắt |  **Bật** |  **Bật** |
| `WORKOUT_PLANS` | ❌ Tắt |  **Bật** |  **Bật** |
| `ADVANCED_ANALYTICS` | ❌ Tắt |  **Bật** |  **Bật** |
| `AUDIT_LOGS` | ❌ Tắt |  **Bật** |  **Bật** |
| `API_ACCESS` & `WEBHOOK`| ❌ Tắt | ❌ Tắt |  **Bật (Enterprise Only)** |
| `MAX_BRANCHES` | **1 phòng tập** | **3 chi nhánh** | **15 chi nhánh (hoặc 99)** |
| `MAX_MEMBERS` | **300 hội viên** | **2.000 hội viên** | **10.000 hội viên** |
| `MAX_ACTIVE_MEMBERS` | **200 người** | **1.200 người** | **6.000 người** |
| `MAX_STAFF` | **5 nhân viên** | **20 nhân viên** | **100 nhân viên** |
| `MAX_PT` | **5 PT** | **20 PT** | **100 PT** |
| `MAX_PT_BOOKINGS` | **150 buổi / tháng** | **800 buổi / tháng** | **5.000 buổi / tháng** |
| `MAX_CHECKINS_MONTH` | **3.000 lượt / tháng** | **15.000 lượt / tháng** | **60.000 lượt / tháng** |
| `MAX_STORAGE` | **5 GB** | **25 GB** | **100 GB** |
| `MAX_EMAILS_MONTH` | **1.000 email / tháng** | **5.000 email / tháng** | **20.000 email / tháng** |
| `MAX_SMS_MONTH` | **0 SMS** | **500 SMS / tháng** | **2.000 SMS / tháng** |

---

*Tài liệu này là cơ sở chuẩn để đội ngũ BA, Product Manager và Ban Điều hành hoàn thiện chính sách giá, đồng thời hướng dẫn đội ngũ Sales / CSKH tư vấn gói cước chính xác cho từng phân khúc phòng tập.*
