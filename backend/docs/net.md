Đúng. Nếu bạn đang ở giai đoạn **phân tích nghiệp vụ và thiết kế kiến trúc cho SaaS quản lý phòng gym**, thì trước khi viết code Offline Mode, bạn nên lập một **bộ câu hỏi tình huống sự cố**.

Mục tiêu là: **mỗi câu hỏi phải dẫn tới một rule nghiệp vụ hoặc một cơ chế kỹ thuật cụ thể**.

Dưới đây là bộ câu hỏi mình khuyên dùng cho FitFlow.

---

# 1. Nhóm câu hỏi về mất Internet

### Kết nối

1. Nếu mất Internet, hệ thống có tiếp tục cho nhân viên đăng nhập không?
2. Nếu user đã đăng nhập trước đó nhưng mất mạng thì có tiếp tục sử dụng được không?
3. Nếu đang mở hệ thống mà mạng bị mất thì UI phải chuyển sang trạng thái nào?
4. Hệ thống cần cho phép sử dụng offline trong bao lâu?
5. Sau bao lâu không đồng bộ thì hệ thống phải cảnh báo?
6. Nếu thiết bị offline 1 giờ, 1 ngày hoặc 3 ngày thì có khác nhau không?
7. Nếu mạng chập chờn liên tục thì xác định Online/Offline như thế nào?
8. Nếu Internet có nhưng API server không phản hồi thì xử lý giống mất Internet hay khác?
9. Nếu API phản hồi rất chậm thì timeout bao nhiêu giây?
10. Khi mạng trở lại, hệ thống tự động đồng bộ hay yêu cầu nhân viên thao tác?

---

# 2. Nhóm câu hỏi về dữ liệu Offline

11. Những nghiệp vụ nào được phép thực hiện offline?
12. Những nghiệp vụ nào bắt buộc phải Online?
13. Dữ liệu nào cần được cache trên máy?
14. Cache dữ liệu của bao nhiêu hội viên?
15. Có cache toàn bộ hội viên của chi nhánh hay chỉ những người thường xuyên sử dụng?
16. Dữ liệu offline được lưu bao lâu?
17. Nếu dữ liệu cache đã cũ thì có được phép sử dụng không?
18. Nếu thông tin hội viên trên server đã thay đổi nhưng máy vẫn đang offline thì xử lý thế nào?
19. Nếu một thao tác offline thất bại khi đồng bộ thì làm gì?
20. Có cho phép nhân viên tiếp tục tạo thao tác mới khi còn thao tác cũ chưa sync không?

---

# 3. Nhóm câu hỏi về Check-in

Đây là nghiệp vụ rất quan trọng với gym.

21. Mất mạng có cho phép check-in không?
22. Nếu check-in offline thì thời gian check-in lấy theo thời gian máy hay server?
23. Nếu đồng hồ máy tính bị sai thì sao?
24. Nếu hội viên đã hết hạn nhưng dữ liệu offline chưa cập nhật thì có cho check-in không?
25. Nếu hội viên bị khóa tài khoản trên server trong lúc máy offline thì sao?
26. Nếu một hội viên check-in trên 2 máy cùng lúc thì xử lý thế nào?
27. Nếu cùng một hội viên được check-in 2 lần do mạng lag thì có tạo 2 attendance không?
28. Khi đồng bộ, nếu server phát hiện hội viên không còn hợp lệ thì record offline được xử lý thế nào?
29. Có cho phép nhân viên sửa/xóa check-in offline không?
30. Owner có cần xem lịch sử các thao tác được tạo offline không?

---

# 4. Nhóm câu hỏi về thanh toán

Đây là nhóm **rủi ro cao nhất**.

31. Nếu đang thanh toán mà mất mạng thì hệ thống hiển thị gì?
32. Nếu request thanh toán đã tới server nhưng response không về thì trạng thái là gì?
33. Nếu nhân viên không biết giao dịch thành công hay thất bại thì có được phép bấm thanh toán lại không?
34. Làm sao chống việc khách bị trừ tiền 2 lần?
35. Mỗi giao dịch có cần một `transactionId` duy nhất không?
36. Có cần `idempotencyKey` để chống duplicate payment không?
37. Nếu thanh toán tiền mặt trong lúc offline thì có cho phép không?
38. Nếu thanh toán QR trong lúc offline thì xử lý thế nào?
39. Nếu thanh toán ngân hàng thành công nhưng FitFlow không nhận được callback thì sao?
40. Nếu khách đưa tiền nhưng hệ thống chưa sync thì trạng thái payment là gì?
41. Khi nào một payment được coi là `SUCCESS`?
42. Ai được phép xác nhận một payment `UNKNOWN`?
43. Nếu payment bị `UNKNOWN` trong 30 phút thì hệ thống làm gì?
44. Nếu server có payment nhưng client không có response thì khi mạng trở lại xử lý thế nào?
45. Nếu client có payment nhưng server không có thì sao?
46. Nếu hai máy cùng tạo payment cho một khách thì xử lý thế nào?
47. Có cho phép refund khi offline không?
48. Có cho phép sửa số tiền thanh toán offline không?

---

# 5. Nhóm câu hỏi về Timeout

Đây chính là vấn đề bạn nói "overtime" — thường nên gọi là **timeout**.

49. Request API timeout sau bao nhiêu giây?
50. Timeout có đồng nghĩa với transaction thất bại không?
51. Nếu timeout thì có tự động retry không?
52. Retry bao nhiêu lần?
53. Mỗi lần retry có tạo transaction mới không?
54. Nếu request đầu tiên đã thành công nhưng response bị mất thì retry xử lý thế nào?
55. Nếu request đang `PROCESSING` thì user có được đóng màn hình không?
56. Nếu user refresh trang trong lúc request đang xử lý thì sao?
57. Nếu user đóng trình duyệt thì transaction còn được xử lý không?
58. Nếu máy mất điện ngay sau khi bấm thanh toán thì sao?
59. Nếu browser crash sau khi request được gửi thì làm sao biết transaction đã thành công?

---

# 6. Nhóm câu hỏi về Double Click / Duplicate

Đây là lỗi rất hay gặp trong hệ thống thực tế.

60. Nếu nhân viên bấm "Thanh toán" 2 lần liên tục thì sao?
61. Nếu bấm "Gia hạn" 3 lần thì sao?
62. Nếu bấm "Check-in" nhiều lần thì sao?
63. Nếu request chậm khiến button chưa phản hồi thì UI có disable button không?
64. Backend có cơ chế chống duplicate không?
65. Database có unique constraint cho những nghiệp vụ quan trọng không?
66. Frontend chống duplicate hay backend chống duplicate?
67. Nếu frontend đã chống nhưng hacker gọi API trực tiếp thì sao?

**Nguyên tắc:** frontend chỉ giúp UX; **backend/database mới là lớp bảo vệ cuối cùng**.

---

# 7. Nhóm câu hỏi về Sync

68. Khi Internet trở lại, thao tác nào được sync trước?
69. Sync theo thứ tự thời gian hay theo mức độ ưu tiên?
70. Nếu có 100 thao tác pending thì xử lý thế nào?
71. Có giới hạn số request sync đồng thời không?
72. Nếu sync một operation thất bại thì có dừng toàn bộ queue không?
73. Có retry tự động không?
74. Retry bao nhiêu lần?
75. Sau nhiều lần thất bại thì chuyển sang `FAILED` hay `CONFLICT`?
76. Ai được quyền xử lý thao tác `FAILED`?
77. Owner có nhìn thấy các thao tác chưa đồng bộ không?
78. Có log toàn bộ quá trình sync không?
79. Có cần Audit Log cho thao tác offline không?

---

# 8. Nhóm câu hỏi về Conflict

Đây là phần cực kỳ quan trọng khi có **nhiều máy tại cùng chi nhánh**.

80. Hai máy cùng offline và cùng sửa một hội viên thì sao?
81. Máy A đổi số điện thoại.
82. Máy B đổi ngày sinh.
83. Khi sync thì giữ dữ liệu nào?

Tiếp tục:

84. Nếu máy A gia hạn membership offline?
85. Máy B cũng gia hạn membership offline?
86. Cả hai cùng sync thì sao?
87. Hai máy cùng check-in một khách thì sao?
88. Hai máy cùng tạo payment thì sao?
89. Server hay client quyết định dữ liệu cuối cùng?
90. Có cần trạng thái `CONFLICT` không?
91. Có cho phép nhân viên tự giải quyết conflict không?
92. Owner có cần màn hình "Conflict Resolution" không?

---

# 9. Nhóm câu hỏi về thời gian

Đây là vấn đề nhiều hệ thống bỏ sót.

93. Offline thì lấy thời gian từ đâu?
94. Server time hay device time?
95. Nếu máy lễ tân chỉnh giờ về quá khứ thì sao?
96. Nếu chỉnh giờ về tương lai thì sao?
97. Check-in offline lúc 23:59 nhưng sync lúc 00:05 thì ngày nào?
98. Membership hết hạn trong lúc offline thì sao?
99. Nếu gói tập hết hạn trong khoảng thời gian offline thì hệ thống có cho check-in không?
100. Có cần lưu cả:

```text
deviceCreatedAt
serverReceivedAt
serverProcessedAt
```

hay không?

---

# 10. Nhóm câu hỏi về Multi-tenant

Với SaaS như FitFlow, nhóm này **bắt buộc phải đặt ra**.

101. Offline data thuộc tenant nào?
102. Offline data thuộc branch nào?
103. Device nào đang tạo dữ liệu?
104. Nếu một thiết bị được chuyển sang chi nhánh khác thì dữ liệu pending cũ xử lý thế nào?
105. Nếu user bị khóa quyền trong lúc offline thì sao?
106. Nếu user bị xóa trong lúc offline thì sao?
107. Nếu branch bị khóa thì thiết bị offline có tiếp tục hoạt động không?
108. Nếu tenant hết hạn subscription thì các máy đang offline xử lý thế nào?
109. Có cho phép một device sync dữ liệu của tenant khác không?
110. Backend xác minh `tenantId` như thế nào?

---

# 11. Nhóm câu hỏi về Browser / Máy tính

111. Nếu nhân viên xóa cache trình duyệt thì dữ liệu offline có mất không?
112. Nếu xóa IndexedDB thì sao?
113. Nếu đổi trình duyệt Chrome → Edge thì dữ liệu pending có còn không?
114. Nếu máy tính bị restart thì sao?
115. Nếu máy mất điện thì sao?
116. Nếu browser crash thì sao?
117. Nếu user mở cùng tài khoản trên 2 tab thì sao?
118. Nếu user mở cùng tài khoản trên 2 máy thì sao?
119. Có cần đăng ký Device không?
120. Có giới hạn số thiết bị trên một branch không?

---

# 12. Nhóm câu hỏi về Server

121. Nếu NestJS downtime thì client xử lý thế nào?
122. Nếu PostgreSQL downtime thì sao?
123. Nếu Redis downtime thì sao?
124. Nếu Railway deployment đang diễn ra thì sao?
125. Nếu API trả HTTP 500 thì retry hay không?
126. Nếu API trả 401 thì xử lý thế nào?
127. Nếu API trả 403 thì sao?
128. Nếu API trả 409 Conflict thì UI hiển thị gì?
129. Nếu API trả 429 Too Many Requests thì sao?
130. Nếu API response quá chậm thì timeout bao lâu?

---

# 13. Nhóm câu hỏi về mạng chập chờn

Không chỉ:

> Có mạng / mất mạng.

Mà phải xét:

```text
Online
↓
Slow
↓
Timeout
↓
Offline
↓
Online
```

131. Thế nào được gọi là mạng chậm?
132. Thế nào được gọi là timeout?
133. Bao nhiêu lần timeout thì chuyển Offline?
134. Khi mạng trở lại có cần kiểm tra health endpoint không?
135. Nếu ping Google được nhưng API không truy cập được thì sao?
136. Nếu API truy cập được nhưng database đang lỗi thì sao?

---

# 14. Nhóm câu hỏi về bảo mật

137. Dữ liệu offline có được mã hóa không?
138. Nếu máy lễ tân bị đánh cắp thì dữ liệu cache có bị đọc được không?
139. Token đăng nhập được lưu ở đâu?
140. Offline user có thể thực hiện đến mức quyền nào?
141. Có cần giới hạn nghiệp vụ offline theo role không?
142. Owner có được phép thao tác offline không?
143. Admin có được phép thao tác offline không?
144. Có lưu audit log cho thao tác offline không?

---

# 15. Nhóm câu hỏi về UX

145. User có biết hệ thống đang Offline không?
146. UI có hiển thị:

```text
🟢 Online
🟠 Offline
🔄 Syncing
🔴 Sync failed
```

không?

147. Có hiển thị số lượng pending operation không?
148. User có xem được thao tác nào chưa sync không?
149. Có nút "Sync now" không?
150. Khi sync lỗi, có giải thích nguyên nhân cho nhân viên không?
151. Có cảnh báo trước khi nhân viên thực hiện nghiệp vụ không hỗ trợ offline?
152. Nếu thanh toán đang `UNKNOWN`, UI phải hướng dẫn nhân viên làm gì?

---

# 16. Những câu hỏi "khó" nhất mà bạn nên giải quyết trước

Nếu bạn chưa muốn xử lý 150 câu hỏi ngay, mình khuyên **10 câu này phải có câu trả lời trước khi code**:

### ① Mất mạng thì nghiệp vụ nào vẫn hoạt động?

```text
CHECK-IN
CHECK-OUT
PAYMENT
MEMBERSHIP
PT BOOKING
...
```

### ② Khi request timeout, trạng thái transaction là gì?

```text
SUCCESS
FAILED
UNKNOWN
PROCESSING
```

### ③ Làm sao chống thanh toán 2 lần?

### ④ Làm sao chống user double-click?

### ⑤ Khi mạng trở lại, sync theo cơ chế nào?

### ⑥ Nếu 2 máy cùng offline và thao tác trên cùng dữ liệu thì sao?

### ⑦ Nếu server đã xử lý nhưng client không nhận được response thì sao?

### ⑧ Nếu client đã lưu offline nhưng server không chấp nhận khi sync thì sao?

### ⑨ Offline data lưu ở đâu và bảo mật thế nào?

### ⑩ Làm sao đảm bảo **Tenant A không bao giờ sync dữ liệu sang Tenant B**?

---

# 17. Mình đặc biệt khuyên bạn lập bảng "Scenario → Expected Result"

Thay vì chỉ đặt câu hỏi, hãy biến chúng thành **bộ test nghiệp vụ**.

Ví dụ:

| Scenario                          | Expected Result               |
| --------------------------------- | ----------------------------- |
| Mất mạng khi check-in             | Lưu local → Pending           |
| Mất mạng khi thanh toán tiền mặt  | Pending payment               |
| Mất mạng khi QR payment           | Không xác nhận thanh toán     |
| Timeout payment                   | `UNKNOWN`                     |
| Double click payment              | Chỉ 1 transaction             |
| Server xử lý nhưng client timeout | Query transaction             |
| Internet trở lại                  | Auto sync                     |
| Sync thất bại                     | Retry                         |
| Retry nhiều lần                   | `FAILED`                      |
| Hai máy cùng check-in             | Server chống duplicate        |
| Hai máy cùng sửa member           | Conflict resolution           |
| Máy mất điện                      | Không mất pending operation   |
| Browser crash                     | Queue vẫn tồn tại             |
| User refresh                      | Transaction vẫn truy vấn được |
| Tenant bị khóa                    | Không cho sync nghiệp vụ mới  |
| Device chuyển branch              | Không sync nhầm branch        |

---

## 18. Và nên có một "Failure Matrix" cho toàn hệ thống

Bạn có thể lấy cấu trúc này làm tài liệu nghiệp vụ chính:

```text
                 FITFLOW FAILURE MATRIX

┌────────────────────┬────────────┬─────────────┬─────────────┐
│ Failure            │ Client     │ Server      │ Expected    │
├────────────────────┼────────────┼─────────────┼─────────────┤
│ Internet lost      │ Offline    │ Normal      │ Local queue │
│ API timeout        │ Unknown    │ Processing? │ Reconcile   │
│ API 500            │ Retry      │ Error       │ Retry       │
│ DB unavailable     │ Retry      │ Down        │ Pending     │
│ Double click       │ Prevent    │ Validate    │ 1 record    │
│ Payment timeout    │ UNKNOWN    │ UNKNOWN     │ Reconcile   │
│ Browser crash      │ Recover    │ Normal      │ Resume      │
│ Power failure      │ Recover    │ Normal      │ Resume      │
│ Two devices        │ Queue      │ Conflict    │ Resolve     │
│ Tenant disabled    │ Block      │ Reject      │ No sync     │
└────────────────────┴────────────┴─────────────┴─────────────┘
```

