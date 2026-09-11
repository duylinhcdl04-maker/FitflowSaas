Hãy redesign và implement module Telegram Notification Integration
cho trang FitFlow Super Admin.

MỤC TIÊU:

Không sử dụng cách cấu hình "Telegram Webhook URL" như hiện tại.

FitFlow chỉ cần Telegram Bot Token + Chat ID để gửi notification
outbound bằng Telegram Bot API sendMessage.

Không yêu cầu Super Admin tự nhập Telegram API URL.

UX PHẢI THEO FLOW:

1. Super Admin click "Kết nối Telegram"
2. Nhập Bot Token
3. Click "Kiểm tra Bot"
4. Backend gọi Telegram getMe()
5. Nếu hợp lệ, hiển thị bot name và username
6. Backend gọi getUpdates() để discover các chat mà bot đã nhận update
7. Hiển thị danh sách chat/group để Super Admin chọn
8. Tự động lấy Chat ID từ chat được chọn
9. Có fallback "Nhập Chat ID thủ công" nếu không discover được
10. Cho phép gửi test message
11. Nếu test thành công mới cho phép lưu connection
12. Sau khi lưu, card hiển thị trạng thái Connected

LƯU Ý:

Telegram Webhook KHÔNG cần thiết cho chức năng gửi notification.
Không gọi module này là "Telegram Webhook".
Tên UI nên là "Telegram Notifications" hoặc "Telegram".

CARD KHI CHƯA KẾT NỐI:

Telegram
○ Chưa kết nối

Nhận cảnh báo hệ thống qua Telegram.

[ Kết nối Telegram ]

CARD KHI ĐÃ KẾT NỐI:

Telegram
● Đang hoạt động

Bot:
FitFlow Alert Bot
@FitFlowAlertBot

Destination:
FitFlow System Alerts
Chat ID •••••••7890

✓ Kết nối hoạt động
Last checked: ...

[ Gửi tin nhắn thử ] [•••]

MENU:

- Cấu hình
- Đổi Chat
- Kiểm tra kết nối
- Xem nhật ký
- Tắt channel
- Xóa kết nối

CONFIGURATION UI:

Sử dụng right-side drawer.

Step 1:
Bot Telegram

Bot Token
[input password/masked]

[ Kiểm tra Bot ]

Sau khi getMe() thành công:

✓ Bot đã được xác thực
FitFlow Alert Bot
@FitFlowAlertBot

Step 2:
Chọn nơi nhận cảnh báo

Hiển thị danh sách chat:

○ FitFlow System Alerts
  Supergroup
  -1001234567890

○ FitFlow DevOps
  Group
  -1009876543210

[ Làm mới danh sách ]

Nếu không tìm thấy chat:

⚠ Chưa tìm thấy cuộc trò chuyện.

Hướng dẫn:
1. Thêm Bot vào Telegram Group
2. Gửi một message trong Group
3. Quay lại FitFlow
4. Click Làm mới danh sách

Có fallback:

[ Nhập Chat ID thủ công ]

Step 3:
Kiểm tra kết nối

[ Gửi tin nhắn kiểm tra ]

Test message:

🟢 FitFlow Telegram Connected

Telegram notification channel đã được kết nối thành công.

Environment: Production
Time: current timestamp

Nếu thành công:

✓ Tin nhắn đã được gửi thành công.

Nếu thất bại:
Map Telegram errors thành lỗi thân thiện:

TELEGRAM_INVALID_TOKEN
TELEGRAM_CHAT_NOT_FOUND
TELEGRAM_FORBIDDEN
TELEGRAM_BOT_KICKED
TELEGRAM_SEND_FAILED
TELEGRAM_TIMEOUT

Không hiển thị raw Telegram error cho user.

SECURITY:

Không bao giờ trả Bot Token đầy đủ về frontend sau khi lưu.

Frontend chỉ nhận:

configured: true
bot.username
chat.name
maskedChatId
status
lastCheckedAt

Bot Token phải được mã hóa khi lưu database.

Không log Bot Token.

Không đưa Bot Token vào frontend localStorage.

Không commit token vào source code.

DATABASE:

Tạo hệ thống generic notification_channels thay vì telegram_webhook.

Fields:

id
type
name
status
config
isActive
lastCheckedAt
lastError
createdAt
updatedAt

type:

EMAIL
TELEGRAM
SLACK
WEBHOOK
IN_APP

Telegram config chứa bot username/chat metadata.
Secret bot token phải được encrypted.

API:

POST /admin/notifications/telegram/verify
POST /admin/notifications/telegram/discover-chats
POST /admin/notifications/telegram/test
POST /admin/notifications/channels
PATCH /admin/notifications/channels/:id
DELETE /admin/notifications/channels/:id
POST /admin/notifications/channels/:id/test

ARCHITECTURE:

Không gọi Telegram API trực tiếp từ các business service.

Sử dụng:

Business Event
→ Alert Rule Engine
→ Notification Service
→ Notification Dispatcher
→ Telegram Adapter
→ Telegram Bot API

Telegram chỉ là một notification channel.

Alert Routing phải được quản lý riêng.

Không hard-code event vào Telegram card.

UI STYLE:

Giữ nguyên visual language của FitFlow hiện tại:

- White background
- Green accent
- Clean SaaS dashboard
- Border nhẹ
- Border radius 12-16px
- Typography rõ ràng
- Lucide icons
- Không glassmorphism
- Không gradient AI-style
- Không emoji trong UI chính
- Status dùng badge/pill
- Loading skeleton
- Empty state
- Error state
- Success state
- Responsive
- Accessible
- Keyboard navigation

Mục tiêu cuối cùng:

Super Admin không cần biết Telegram API hoạt động như thế nào.

Chỉ cần:

Bot Token
→ Verify Bot
→ Chọn Group
→ Test
→ Save

Sau khi cấu hình:

FitFlow Event
→ Alert Rule
→ Routing
→ Telegram
→ sendMessage()
→ Telegram Group