
# TÀI LIỆU PHÂN TÍCH DASHBOARD BRANCH MANAGER — FITFLOW

## 1. Mục tiêu của Dashboard

Dashboard Branch Manager không nên chỉ là trang thống kê. Nó phải là **trung tâm điều hành chi nhánh**.

Khi mở Dashboard, Branch Manager cần trả lời được 5 câu hỏi trong khoảng 30 giây:

1. **Chi nhánh hiện đang vận hành thế nào?**
2. **Có vấn đề gì cần tôi xử lý ngay?**
3. **Khách hàng nào cần được quan tâm?**
4. **Doanh thu và hoạt động kinh doanh đang như thế nào?**
5. **Chi nhánh đang tốt hơn hay xấu hơn so với trước?**

Nguyên tắc thiết kế:

```text
REAL-TIME OPERATION
        +
ACTIONABLE ALERTS
        +
BUSINESS PERFORMANCE
        +
CUSTOMER HEALTH
        +
TREND & COMPARISON
```

---

# 2. PHẠM VI DỮ LIỆU

Branch Manager chỉ quản lý **01 Branch duy nhất do Owner phân công**.

Vì vậy:

```text
Dashboard Data Scope
       =
Current Tenant
       +
Assigned Branch Only
```

Branch Manager:

* ❌ Không xem Dashboard Branch khác.
* ❌ Không xem số liệu tổng toàn Tenant.
* ❌ Không so sánh trực tiếp với Branch khác.
* ✅ So sánh Branch của mình theo thời gian.

Đây là nguyên tắc Backend bắt buộc phải enforce, không chỉ giới hạn ở UI.

---

# 3. CẤU TRÚC TỔNG THỂ DASHBOARD

Tôi đề xuất Dashboard gồm 7 khu vực:

```text
┌──────────────────────────────────────────────────────┐
│ HEADER + BRANCH CONTEXT + DATE                       │
├──────────────────────────────────────────────────────┤
│ TOP KPI CARDS                                        │
├──────────────────────────────────────────────────────┤
│ ACTION CENTER                                        │
├──────────────────────────────────────────────────────┤
│ TODAY OPERATION + CHECK-IN OVERVIEW                  │
├──────────────────────────────────────────────────────┤
│ REVENUE & BUSINESS PERFORMANCE                       │
├──────────────────────────────────────────────────────┤
│ MEMBER HEALTH + RETENTION                            │
├──────────────────────────────────────────────────────┤
│ PT PERFORMANCE + QUICK INSIGHTS                      │
└──────────────────────────────────────────────────────┘
```

---

# 4. HEADER — BRANCH CONTEXT

Phần đầu Dashboard nên có:

```text
Chào buổi sáng, Nguyễn Văn A 👋

Chi nhánh: FitFlow – Cầu Giấy
Hôm nay: Thứ Ba, 25/08/2026

[Today ▼]  [Refresh]
```

## Date Filter

Nên hỗ trợ:

* Today.
* Yesterday.
* This Week.
* Last Week.
* This Month.
* Last Month.
* Custom Range.

Tuy nhiên, **KPI trạng thái thời gian thực** như “Đang trong phòng tập” không nên bị hiểu sai khi người dùng chọn khoảng thời gian lịch sử.

Ví dụ:

> Chọn tháng trước nhưng vẫn hiển thị “42 người đang trong phòng tập”.

Vì vậy cần tách:

```text
REAL-TIME KPI
→ Luôn lấy dữ liệu hiện tại

PERFORMANCE KPI
→ Thay đổi theo Date Range
```

Đây là một Business Rule quan trọng.

---

# 5. TOP KPI CARDS

Chúng ta đã chọn **42C**:

> Dashboard có bộ KPI mặc định, nhưng Branch Manager có thể cá nhân hóa các KPI muốn ghim.

## Bộ KPI mặc định đề xuất

### 👥 Đang trong phòng tập

```text
42 người

Member: 35
Guest: 7
```

Được tính:

```text
Valid Check-in
+
Chưa Check-out
=
Currently In Gym
```

Không tính:

* Undo Check-in.
* Đã Check-out.
* Đã Auto Check-out.

**Đây là KPI Real-time, không cần Trend.**

---

### 🚪 Check-in hôm nay

Ví dụ:

```text
127 lượt
▲ 12%
So với cùng ngày tuần trước

Valid: 127
Undo: 2
```

Check-in hợp lệ là KPI chính. Undo chỉ là chỉ số phụ phục vụ kiểm soát vận hành.

---

### 💰 Doanh thu

Ví dụ:

```text
Hôm nay: 5.200.000 VNĐ
▲ 8%

Gross Revenue: 6.000.000
Refund:        800.000
Net Revenue:   5.200.000
```

Doanh thu được ghi nhận theo thời điểm:

```text
Payment Status = SUCCESS
```

Bao gồm tất cả nguồn Payment SUCCESS phát sinh tại Branch.

---

### 👤 Membership mới / Gia hạn

Theo dõi khả năng bán và duy trì khách hàng.

Ví dụ:

```text
Membership mới: 8
Gia hạn: 5
```

---

### 🙋 Guest hôm nay

Theo dõi khách tập lẻ/khách trải nghiệm:

```text
Guest: 22
▲ 15%
```

Đây là nguồn dữ liệu quan trọng để sau này tính:

```text
Guest → Member Conversion
```

---

### 📅 PT Sessions hôm nay

```text
Tổng: 18

Completed: 10
Upcoming: 6
Cancelled: 2
```

---

## Cá nhân hóa Dashboard

Branch Manager có thể:

* Ghim KPI quan trọng.
* Ẩn KPI ít quan tâm.
* Sắp xếp lại vị trí KPI.

Nhưng hệ thống vẫn giữ bộ KPI chuẩn, **không cho người dùng tự tạo công thức KPI mới trong MVP**.

---

# 6. ACTION CENTER — TRUNG TÂM XỬ LÝ CÔNG VIỆC

Đây là phần quan trọng nhất của Dashboard.

## Mục tiêu

Không chỉ nói:

> “Có vấn đề.”

Mà phải giúp Manager biết:

> **“Có vấn đề gì, mức độ ra sao và tôi cần làm gì tiếp theo?”**

## Phân loại

```text
🔴 Critical
🟠 Warning
🟡 Information
```

Mặc định chỉ ưu tiên những vấn đề:

* Thuộc phạm vi Branch.
* Branch Manager có quyền xử lý hoặc cần theo dõi.

Ví dụ:

### 🔴 Critical

* Payment Pending quá thời gian.
* Check-in/Check-out bất thường.
* PT Booking có xung đột nghiêm trọng.

### 🟠 Warning

* Membership sắp hết hạn.
* Payment cần xác nhận.
* Booking bị hủy.

### 🟡 Information

* Member At Risk.
* Guest cần theo dõi.
* Các Membership sẽ hết hạn trong tương lai.

## Cách xử lý khi click — đã chốt Câu 38D

```text
Simple Action
→ Quick Action Modal

Complex / Multiple Data
→ Điều hướng đến màn hình nghiệp vụ
   + áp dụng Filter tự động
```

Ví dụ:

```text
3 khách chưa Check-out
→ Quick Action

25 Membership sắp hết hạn
→ Membership List đã lọc
```

## Cập nhật Action — đã chốt Câu 39C

Action Center sử dụng hai cơ chế:

### Automatic Update

Khi điều kiện nghiệp vụ không còn thì cảnh báo tự biến mất.

### User Tracking Status

Các thông tin cần theo dõi có thể có trạng thái:

```text
Viewed
Monitoring
```

Nguyên tắc:

> **Viewed không đồng nghĩa với Resolved.**

---

# 7. TODAY OPERATION — VẬN HÀNH HÔM NAY

Khu vực này giúp Branch Manager hiểu nhanh tình trạng hoạt động.

## Hiển thị đề xuất

```text
TODAY'S OPERATION

👥 Đang tập:             42
🚪 Check-in:            127
🙋 Guest:                22
📅 PT Sessions:          18
💳 Pending Payment:       3
```

Kèm biểu đồ:

### Check-in theo thời gian

```text
06:00  ██
08:00  ██████
12:00  ████
17:00  ████████████
19:00  ███████████████
21:00  ████
```

## Giá trị thực tế

Branch Manager có thể:

* Phát hiện giờ cao điểm.
* Điều phối Staff.
* Theo dõi lưu lượng khách.
* Phát hiện giờ bất thường.
* Đánh giá hiệu quả vận hành.

---

# 8. REVENUE & BUSINESS PERFORMANCE

Không cần Dashboard tài chính phức tạp như Owner.

Branch Manager cần biết:

```text
DOANH THU HÔM NAY
DOANH THU TRONG KỲ
NGUỒN DOANH THU
XU HƯỚNG
```

## Nguồn doanh thu

```text
Membership
PT Package
Guest
Other Services (mở rộng sau)
```

Doanh thu nên hiển thị:

```text
Gross Revenue
- Refund
= Net Revenue
```

## Comparison — đã chốt Câu 40C

Hệ thống kết hợp:

* So sánh kỳ liền trước.
* So sánh cùng kỳ phù hợp.

Ví dụ:

```text
Check-in hôm nay
→ So với cùng ngày tuần trước

Doanh thu tháng
→ So với tháng trước
```

Dashboard bắt buộc phải ghi rõ:

> “So với tháng trước”, “So với cùng ngày tuần trước”...

---

# 9. MEMBER HEALTH & RETENTION

Đây là khu vực mang lại giá trị dài hạn.

## Active Members

```text
Active Members: 850
```

## Membership sắp hết hạn

Ngưỡng cảnh báo do Owner cấu hình:

```text
🔴 ≤ 3 ngày
🟠 ≤ 7 ngày
🟡 ≤ 30 ngày
```

## Member At Risk

Owner cấu hình số ngày:

```text
Member Active
+
Không Check-in ≥ X ngày
=
At Risk
```

Ví dụ:

```text
42 Member không Check-in trong 14 ngày
```

### Giá trị

Branch Manager có thể chủ động:

* Liên hệ khách.
* Hỗ trợ giải quyết vấn đề.
* Tăng khả năng gia hạn.
* Giảm nguy cơ khách rời bỏ.

---

# 10. PT PERFORMANCE

Dashboard nên theo dõi vận hành PT ở mức Branch.

```text
PT PERFORMANCE

PT Active:       8
Sessions:       120
Completed:      105
Cancelled:       10
Upcoming:         5
```

Mục tiêu:

* Phát hiện PT quá tải.
* PT ít hoạt động.
* Tỷ lệ hủy cao.
* Nhu cầu điều phối lịch.

Trong MVP, tôi khuyến nghị chỉ cần Overview. Phân tích sâu hiệu suất từng PT có thể mở rộng sau.

---

# 11. TREND & COMPARISON — ĐÃ CHỐT

## Performance KPI → Có Trend

* Check-in.
* Revenue.
* Membership mới.
* Renewal.
* Guest.
* PT Sessions.
* Conversion Rate.

## Operational KPI → Không bắt buộc Trend

* Đang trong phòng tập.
* Pending Payment.
* Action Items.
* Khách chưa Check-out.

Nguyên tắc:

```text
Performance
→ Tốt hơn hay xấu hơn?

Operational Status
→ Hiện tại có vấn đề gì?
```

Điều này giúp Dashboard không bị “lạm dụng phần trăm”.

---

# 12. THỨ TỰ ƯU TIÊN UI TÔI ĐỀ XUẤT

Nếu thiết kế Desktop Dashboard, bố cục nên như sau:

```text
┌────────────────────────────────────────────────────────────┐
│ HEADER: Branch | Date | Quick Actions                      │
├────────────────────────────────────────────────────────────┤
│ TOP KPI CARDS (6 – có thể cá nhân hóa)                     │
│ Currently In Gym | Check-in | Revenue | Membership | ...  │
├────────────────────────────────────────────────────────────┤
│ 🔴 ACTION CENTER                                            │
│ Critical | Warning | Information                            │
├───────────────────────────────┬────────────────────────────┤
│ CHECK-IN TREND                │ TODAY OPERATION            │
│ Biểu đồ theo giờ              │ Danh sách trạng thái       │
├───────────────────────────────┼────────────────────────────┤
│ REVENUE TREND                 │ REVENUE BY SOURCE          │
├───────────────────────────────┼────────────────────────────┤
│ MEMBER HEALTH                 │ MEMBERSHIP EXPIRING        │
├───────────────────────────────┼────────────────────────────┤
│ PT PERFORMANCE                │ QUICK INSIGHTS             │
└───────────────────────────────┴────────────────────────────┘
```

---

# 13. QUICK ACTIONS — ĐỀ XUẤT BỔ SUNG

Một điểm rất thực tế mà tôi đề xuất thêm vào Dashboard: **Quick Actions**.

Branch Manager không nên phải vào nhiều menu để thực hiện các nghiệp vụ thường xuyên.

```text
[ + Add Member ]
[ 🏃 Check-in ]
[ 💳 Create Payment ]
[ 📅 PT Booking ]
```

Đây là các hành động vận hành thường xuyên và phù hợp với quyền của Branch Manager.

---

# 14. MVP VÀ ROADMAP

## 🟢 MVP nên triển khai

### Dashboard

* Top KPI.
* Currently In Gym.
* Check-in Today.
* Revenue.
* Membership New/Renewal.
* Guest.
* PT Sessions.
* Action Center.
* Check-in Trend.
* Membership Expiring.
* Basic Member At Risk.
* Basic Revenue Summary.
* So sánh theo thời gian.

## 🟡 Phase 2

* Guest → Member Conversion.
* Renewal Rate.
* Check-in Heatmap.
* PT Performance nâng cao.
* Member Retention.
* Dashboard cá nhân hóa nâng cao.

## 🔵 Phase 3

* Dự báo doanh thu.
* AI phát hiện bất thường.
* Dự đoán Member Churn.
* Gợi ý điều phối nhân sự.

---

# 15. BUSINESS RULE TỔNG QUÁT CỦA DASHBOARD

```text
BR-DASH-01:
Dashboard Branch Manager chỉ hiển thị dữ liệu thuộc Branch được phân công.

BR-DASH-02:
Real-time KPI và Historical KPI phải được phân biệt rõ.

BR-DASH-03:
Top KPI có bộ mặc định nhưng Branch Manager được cá nhân hóa hiển thị.

BR-DASH-04:
Action Center chỉ hiển thị vấn đề thuộc phạm vi trách nhiệm/quyền truy cập.

BR-DASH-05:
Action Items được phân loại theo Critical / Warning / Information.

BR-DASH-06:
Action Item phải có hướng xử lý hoặc điều hướng rõ ràng.

BR-DASH-07:
Điều kiện nghiệp vụ được giải quyết → Action Item tự động cập nhật.

BR-DASH-08:
Viewed/Monitoring không đồng nghĩa với Resolved.

BR-DASH-09:
Performance KPI hỗ trợ Trend & Comparison phù hợp.

BR-DASH-10:
Operational KPI ưu tiên trạng thái hiện tại và cảnh báo.

BR-DASH-11:
Tất cả phép so sánh phải hiển thị rõ kỳ so sánh.

BR-DASH-12:
Dashboard không được tính các dữ liệu Undo/Invalid vào KPI nghiệp vụ chính.
```

---

# ĐÁNH GIÁ CUỐI CÙNG

Theo góc nhìn của tôi, Dashboard Branch Manager của FitFlow sau khi chốt có **3 điểm khác biệt thiết thực**:

### 1. Không chỉ thống kê — mà hỗ trợ hành động

Action Center giúp Manager biết chính xác việc gì cần xử lý.

### 2. Không chỉ nhìn số hiện tại — mà biết xu hướng

Trend & Comparison giúp biết Branch đang cải thiện hay đi xuống.

### 3. Không chỉ quản lý doanh thu — mà quản lý sức khỏe khách hàng

Membership Expiring và At Risk giúp Branch chủ động giữ chân khách.
