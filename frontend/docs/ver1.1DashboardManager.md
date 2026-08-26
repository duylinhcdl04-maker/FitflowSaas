# ĐẶC TẢ BỐ CỤC — DASHBOARD BRANCH MANAGER

Tài liệu này thay thế **Mục 12** trong bản phân tích gốc. Các mục 1–11 và 14–15 giữ nguyên, có bổ sung ở phần Business Rule.

Phiên bản: 1.0 · Phạm vi: Web desktop-first, hỗ trợ tablet

---

## 1. QUYẾT ĐỊNH BỐ CỤC CỐT LÕI

Toàn bộ đặc tả này dựa trên một quyết định duy nhất:

> **Dashboard chia làm hai tầng vật lý tách biệt: tầng thời gian thực và tầng hiệu suất theo kỳ.**

Lý do: BR-DASH-02 yêu cầu phân biệt Real-time KPI và Historical KPI. Nếu chỉ phân biệt ở tầng dữ liệu mà trộn chung trên giao diện, người dùng chọn "Tháng trước" sẽ không có cách nào biết thẻ nào tuân theo bộ lọc. Ghi chú nhỏ dưới thẻ không giải quyết được — vì mắt người đọc theo vùng, không đọc theo chú thích.

Ranh giới hai tầng là **yếu tố cấu trúc đặc trưng** của dashboard này. Nó phải nhìn thấy được ngay, không cần giải thích.

| | Tầng 1 — Vận hành | Tầng 2 — Hiệu suất |
|---|---|---|
| Câu hỏi trả lời | Hiện đang thế nào? Có gì cần xử lý? | Tốt hơn hay xấu hơn? |
| Nguồn dữ liệu | Trạng thái hiện tại | Tổng hợp theo kỳ |
| Bộ lọc ngày | **Không áp dụng** | Áp dụng toàn tầng |
| Tần suất làm mới | 30 giây (polling) hoặc realtime | Khi đổi bộ lọc |
| Có Trend/% | Không | Bắt buộc, kèm nhãn kỳ so sánh |
| Vị trí | Trên fold | Dưới fold |

---

## 2. KHUNG ĐIỀU HƯỚNG

**Chọn top navigation ngang, bỏ sidebar dọc.**

Hệ thống có 7 mục điều hướng (Tổng quan, Check-in, Hội viên & Khách, Gói tập & Thanh toán, PT & Lịch tập, Nhân sự, Báo cáo). Dưới ngưỡng 8 mục thì sidebar dọc 280px là lãng phí: nó chiếm 19% chiều rộng màn 1440px để hiển thị 7 dòng chữ.

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Tổng quan  Check-in  Hội viên  Gói tập  PT  Nhân sự  BC │ 56px
│                                    [⌘K tìm]  [🔔]  [Avatar ▾]  │
├────────────────────────────────────────────────────────────────┤
│ Cơ sở 2 Hà Nội · Đang mở cửa · Thứ Ba 25/08/2026    [Làm mới]  │ 44px
└────────────────────────────────────────────────────────────────┘
```

Hàng thứ hai là **branch context bar** — luôn hiện, sticky khi cuộn. Branch Manager chỉ quản một chi nhánh (BR-DASH-01) nên đây là nhãn tĩnh, không phải dropdown chọn chi nhánh. Không hiển thị dropdown khi người dùng không có lựa chọn nào.

Khi mở rộng lên nhiều chi nhánh trong tương lai, hàng này chuyển thành dropdown mà không phá vỡ bố cục.

---

## 3. HỆ LƯỚI VÀ BREAKPOINT

Base unit: **4px**. Mọi khoảng cách là bội số của 4.

| Breakpoint | Chiều rộng | Container | Cột lưới | Hành vi |
|---|---|---|---|---|
| `xl` | ≥ 1440px | 1360px, canh giữa | 12 | Bố cục đầy đủ |
| `lg` | 1200–1439px | 100% − 48px | 12 | Bố cục đầy đủ |
| `md` | 900–1199px | 100% − 32px | 8 | Tầng 2 xếp dọc |
| `sm` | 600–899px | 100% − 24px | 4 | Mọi thứ xếp dọc, KPI 2 cột |
| `xs` | < 600px | 100% − 16px | 4 | Xem mục 9 |

Gutter: 16px ở `md` trở xuống, 20px ở `lg`/`xl`.

Container tối đa 1360px. Không để dashboard giãn hết màn 27 inch — dòng dữ liệu dài quá 1400px làm mắt mất dấu khi quét ngang.

---

## 4. DESIGN TOKEN

### 4.1 Màu

Vấn đề của bản hiện tại: emerald vừa là màu thương hiệu, vừa là màu nút chính, vừa là màu trạng thái thành công. Khi mọi thứ đều xanh lá thì không gì nổi bật.

**Nguyên tắc: emerald chỉ dành cho nhận diện và hành động chính. Không dùng emerald cho trạng thái.**

```
/* Nền và mực */
--canvas:        #F6F7F5   /* nền trang */
--surface:       #FFFFFF   /* thẻ, vùng nội dung */
--surface-sunk:  #F1F2EF   /* vùng chìm, header bảng */

--ink:           #131A18   /* chữ chính */
--ink-2:         #5A6360   /* chữ phụ */
--ink-3:         #8A928F   /* chú thích, placeholder */

--line:          #E4E7E3   /* đường kẻ mặc định */
--line-strong:   #CBD1CC   /* đường kẻ nhấn */

/* Thương hiệu — chỉ dùng cho logo, nav active, nút primary duy nhất */
--brand:         #0E7C5A
--brand-hover:   #0B6549
--brand-tint:    #E3F2EC

/* Ngữ nghĩa — KHÔNG có màu xanh lá trong bộ này */
--danger:        #C2413A   --danger-tint:  #FBEDEC
--warning:       #B0741A   --warning-tint: #FCF3E3
--info:          #2C6CA8   --info-tint:    #EAF1F8
--neutral:       #8A928F   --neutral-tint: #F1F2EF   /* trạng thái đã xử lý / đang theo dõi */

/* Chỉ báo live — chấm nhấp nháy duy nhất được dùng emerald ngoài nhận diện */
--live:          #0E7C5A
```

Chênh lệch dương (`▲ 8%`) dùng `--brand`. Chênh lệch âm dùng `--danger`. Vì bộ ngữ nghĩa không có xanh lá nên không xảy ra xung đột.

**Quy tắc một nút chính:** mỗi màn hình chỉ có tối đa một nút nền `--brand`. Mọi nút khác là viền hoặc ghost. Bản hiện tại có 5 nút emerald cùng lúc — kết quả là không nút nào là nút chính.

### 4.2 Typography

Chữ Việt có dấu chồng hai tầng, nên font phải có chiều cao dòng thoáng và dấu được thiết kế riêng, không phải dấu ghép tự động.

```
--font-ui:   'Be Vietnam Pro', system-ui, sans-serif
--font-num:  'IBM Plex Mono', ui-monospace, monospace
```

`--font-num` dùng cho **mọi con số trong bảng và hàng đợi** vì nó có chữ số đều bề rộng (tabular). Số liệu xếp chồng theo cột phải thẳng hàng thập phân — đây là khác biệt giữa dashboard nghiệp vụ và dashboard trang trí. Với KPI lớn có thể dùng `--font-ui` kèm `font-variant-numeric: tabular-nums`.

| Vai trò | Size / Line | Weight | Ghi chú |
|---|---|---|---|
| KPI value | 28 / 34 | 600 | Tabular |
| Section title | 16 / 24 | 600 | |
| Body / hàng dữ liệu | 14 / 20 | 400 | |
| Label KPI | 13 / 18 | 500 | |
| Meta, chú thích, nhãn kỳ | 12 / 16 | 400 | `--ink-3` |

Chỉ 3 trọng lượng: 400, 500, 600. Không dùng 700 — quá nặng cho giao diện dày dữ liệu.

**Sentence case toàn bộ.** Không viết hoa toàn bộ. Bản hiện tại dùng `LỆNH THAO TÁC NHANH`, `KHÁCH ĐANG Ở PHÒNG TẬP` — chữ hoa toàn phần làm mất dấu tiếng Việt và giảm tốc độ đọc khoảng 15%.

### 4.3 Khoảng cách và bo góc

```
--space-1: 4px    --space-2: 8px    --space-3: 12px
--space-4: 16px   --space-5: 20px   --space-6: 24px
--space-8: 32px   --space-10: 40px

--radius-sm: 6px    /* nút, chip, input */
--radius-md: 10px   /* thẻ, vùng */
--radius-full: 999px /* chỉ dùng cho avatar và chấm trạng thái */
```

Đường kẻ: `1px solid var(--line)`. Không dùng đổ bóng cho thẻ tĩnh — chỉ dùng cho lớp nổi (dropdown, drawer, modal).

---

## 5. ĐẶC TẢ TỪNG VÙNG

### 5.1 Tổng thể

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                     56px │
│ BRANCH CONTEXT BAR                                          44px │
├──────────────────────────────────────────────────────────────────┤
│ ● TẦNG 1 · thời gian thực · không chịu bộ lọc ngày          28px │  ← dải nhãn
│ ┌────────┬────────┬────────┬────────┬──────────────────────────┐ │
│ │ Đang   │ Check- │ Chờ    │ PT hôm │ Lưu lượng theo giờ       │ │  92px
│ │ tập 42 │ in 127 │ TT 3   │ nay 18 │ ▁▃▂▂▆█▇▂                 │ │
│ └────────┴────────┴────────┴────────┴──────────────────────────┘ │
│                                                                  │
│ Hàng đợi xử lý · 5 việc                      Sắp theo mức độ ▾   │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ● 2 giao dịch pending quá 30 phút            [Xác nhận]      │ │  56px
│ │ ● 1 khách chưa check-out sau 22:00           [Xử lý]         │ │  /hàng
│ │ ● 25 membership hết hạn trong 7 ngày         [Xem 25]        │ │
│ │ ○ 42 member không check-in 14 ngày           Đang theo dõi   │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ TẦNG 2 · hiệu suất theo kỳ                    [Tháng này ▾] 44px │  ← dải nhãn
│ ┌ Doanh thu │ Hội viên │ PT ────────────────────────────────────┐ │
│ │                                                              │ │
│ │  [biểu đồ 8 cột]              │  [breakdown nguồn]           │ │  240px
│ │                                                              │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

Toàn bộ tầng 1 nằm gọn trong 900px chiều cao — vừa một màn 1080p sau khi trừ chrome trình duyệt. Đây là ràng buộc thiết kế bắt buộc, không phải mong muốn.

### 5.2 Dải nhãn tầng — yếu tố cấu trúc đặc trưng

Hai dải nhãn là thứ khiến dashboard này khác các dashboard SaaS thông thường. Chúng không trang trí — chúng mã hoá một sự thật nghiệp vụ.

**Dải tầng 1:**
- Chiều cao 28px, nền `--brand-tint`, chữ `--brand` 12px
- Bên trái: chấm 6px `--live` với animation pulse 2s (tôn trọng `prefers-reduced-motion`: bỏ animation, giữ chấm tĩnh)
- Nội dung: `Thời gian thực · không chịu bộ lọc ngày`
- Bên phải: `Cập nhật 12 giây trước`

**Dải tầng 2:**
- Chiều cao 44px, nền `--surface-sunk`, có đường kẻ trên `--line-strong` 1px
- Bên trái: `Hiệu suất theo kỳ` 13px `--ink-2`
- Bên phải: **bộ lọc ngày đặt tại đây, không đặt trên header**

Vị trí bộ lọc là điểm mấu chốt. Đặt nó cạnh nội dung nó điều khiển thì quan hệ tự hiển nhiên. Đặt trên header thì người dùng phải suy đoán — và sẽ đoán sai.

Bộ lọc giữ nguyên 7 lựa chọn ở mục 4 tài liệu gốc. Mặc định: `Tháng này`. Lựa chọn được lưu vào localStorage theo user, khôi phục khi quay lại.

### 5.3 Dải KPI thời gian thực

**Bỏ mô hình thẻ nổi, chuyển sang ô chia bằng đường kẻ.**

Thẻ nổi (nền trắng + viền + bo góc + khoảng đệm lớn) tốn khoảng 40% diện tích cho khung. Ô chia đường kẻ cho cùng lượng thông tin trong 60% chiều cao. Bản hiện tại còn có lỗi thẻ "Lượt check-in" mang nền và viền khác 3 thẻ còn lại — không có lý do nghiệp vụ nào cho sự khác biệt đó.

Đặc tả mỗi ô:

```
padding: 12px 16px
border-right: 1px solid var(--line)   /* ô cuối không có */

Label     13px / 500 / --ink-2        margin-bottom: 4px
Value     28px / 600 / --ink          tabular-nums
Sub       12px / 400 / --ink-3        margin-top: 2px
```

Bốn ô KPI + một ô biểu đồ lưu lượng, tỷ lệ `1fr 1fr 1fr 1fr 1.6fr`.

**Bốn KPI ở tầng 1 (cố định, không cá nhân hoá):**

| KPI | Value | Sub | Màu value |
|---|---|---|---|
| Đang trong phòng tập | `42` | `Member 35 · Guest 7` | `--ink` |
| Check-in hôm nay | `127` | `Undo 2` | `--ink` |
| Chờ thanh toán | `3` | `Quá 30 phút` | `--danger` nếu > 0, `--ink-3` nếu = 0 |
| PT hôm nay | `18` | `Xong 10 · Sắp tới 6 · Huỷ 2` | `--ink` |

Membership mới, Gia hạn, Guest, Doanh thu **không nằm ở tầng 1** — chúng là Performance KPI theo phân loại tại mục 11 của tài liệu gốc, nên thuộc tầng 2. Giữ chúng ở đầu trang sẽ vi phạm chính nguyên tắc bạn đặt ra và làm loãng bốn con số thực sự cần theo dõi liên tục.

**Không có Trend ở tầng 1.** Đúng theo mục 11: Operational KPI không hiển thị phần trăm.

**Ô biểu đồ lưu lượng theo giờ:**
- 8 cột, mốc 06 08 10 12 14 16 18 20
- Chiều cao vùng vẽ 40px, cột rộng `1fr`, gap 3px, bo góc 2px trên
- Cột trong 2 khung giờ cao nhất tô `--brand`, còn lại `--line-strong`
- Hover hiện tooltip: `18:00–20:00 · 34 lượt`
- Không trục, không nhãn số — đây là sparkline nhận dạng hình dạng, không phải biểu đồ phân tích. Phân tích chi tiết nằm ở màn Báo cáo.

### 5.4 Hàng đợi xử lý — thay thế Action Center ba cột

Đây là thay đổi lớn nhất so với tài liệu gốc.

**Vấn đề của mô hình ba cột Critical / Warning / Information:** mức độ nghiêm trọng bị dùng làm trục bố cục. Mỗi mức chiếm một cột cố định kể cả khi rỗng, dẫn tới tình trạng badge đỏ `CRITICAL` hiển thị bên cạnh số `0` — báo động giả, và sau vài ngày người dùng sẽ học được cách phớt lờ màu đỏ.

**Giải pháp: severity là khoá sắp xếp, không phải cột.** Một danh sách duy nhất, sắp giảm dần theo mức độ rồi theo thời gian phát sinh. Mục nào không còn điều kiện thì biến mất hoàn toàn.

Cấu trúc mỗi hàng:

```
┌────────────────────────────────────────────────────────────┐
│ ●   2 giao dịch pending quá 30 phút          [Xác nhận]    │  56px
│     Xác nhận thủ công · phát sinh 09:12                    │
└────────────────────────────────────────────────────────────┘
  ↑   ↑                                          ↑
 6px  Tiêu đề 14/500 + meta 12/400          Nút hành động
 chấm                                        32px cao
```

```
padding: 10px 16px
border-bottom: 1px solid var(--line)
hover: background var(--surface-sunk), cursor pointer
```

**Chấm trạng thái 6px thay cho badge + viền trái + chip số.** Bản hiện tại mã hoá mức độ ba lần cùng lúc trên một thẻ. Một lần là đủ.

| Mức | Màu chấm | Màu tiêu đề |
|---|---|---|
| Critical | `--danger` | `--ink` |
| Warning | `--warning` | `--ink` |
| Information | `--info` | `--ink` |
| Đang theo dõi (Monitoring) | `--neutral` viền rỗng | `--ink-2` |

Mục ở trạng thái Monitoring bị làm mờ và chấm chuyển sang viền rỗng — thể hiện đúng BR-DASH-08: đã xem không đồng nghĩa đã xử lý, nhưng cũng không nên tiếp tục la hét.

**Nhãn nút phải phản ánh loại điều hướng** (theo phân nhánh 38D):

| Loại | Nhãn nút | Hành vi |
|---|---|---|
| Quick Action | Động từ: `Xác nhận`, `Xử lý`, `Đóng ca` | Mở modal, xử lý tại chỗ |
| Điều hướng có filter | `Xem 25`, `Mở danh sách` | Chuyển màn nghiệp vụ, filter áp sẵn |
| Monitoring | Không có nút, chỉ chữ `Đang theo dõi` | Click hàng để xem chi tiết |

Người dùng biết trước cái gì sẽ xảy ra khi bấm. Nút mở modal và nút chuyển trang không được trông giống nhau.

**Số lượng hiển thị:** tối đa 6 hàng. Nếu nhiều hơn, hiện `Xem thêm 4 việc` ở cuối, mở rộng tại chỗ chứ không phân trang.

**Header vùng:**
```
Hàng đợi xử lý  [5 việc]                    Sắp theo mức độ ▾
16/600          chip đỏ nhỏ                 12/400 --ink-3
```
Chip đếm chỉ hiện khi có ít nhất một mục Critical hoặc Warning. Nếu chỉ còn mục Information thì chip dùng `--neutral-tint`.

### 5.5 Tầng 2 — Hiệu suất theo kỳ

**Gộp 8 module biểu đồ ở tài liệu gốc thành một vùng có tab.**

Bố cục cũ xếp 4 hàng × 2 cột = 8 module. Trên màn 1080p, đó là 3 màn hình cuộn. Branch Manager mở dashboard khoảng 5 lần một ngày, trong đó chỉ 1 lần cần nhìn xu hướng — không đáng chiếm 3 màn cuộn cho phần còn lại.

Ba tab, mỗi tab là một cặp `biểu đồ chính | breakdown`:

```
┌ Doanh thu ─│ Hội viên │ PT ──────────────────────────────────┐
│                                                              │
│  142.800.000 ₫   ▲ 8% so với tháng trước                     │
│                                                              │
│  ▁▃▂▅▄██                        │  Membership    98,2tr      │
│  T1 T2 T3 T4 T5 T6 T7           │  PT package    36,4tr      │
│                                 │  Guest         12,6tr      │
│                                 │  ─────────────────────     │
│                                 │  Refund        −4,4tr      │
│                                 │  Net          142,8tr      │
└──────────────────────────────────────────────────────────────┘
```

Tỷ lệ cột: `1.5fr | 1fr`, phân cách bằng `border-left: 1px solid var(--line)`.

| Tab | Biểu đồ chính | Breakdown |
|---|---|---|
| Doanh thu | Cột theo ngày/tuần tuỳ kỳ | Nguồn thu + Gross/Refund/Net |
| Hội viên | Đường: Active members theo thời gian | Mới · Gia hạn · Hết hạn · At risk |
| PT | Cột nhóm: Completed / Cancelled | PT active · Tổng buổi · Tỷ lệ huỷ |

**Nhãn kỳ so sánh là bắt buộc và phải nằm cạnh con số**, không nằm ở chú thích cuối vùng (BR-DASH-11). Viết đầy đủ: `so với tháng trước`, `so với cùng ngày tuần trước` — không viết tắt thành `MoM`, `WoW`.

Quy tắc chọn kỳ so sánh (theo 40C):

| Kỳ đang chọn | So với |
|---|---|
| Hôm nay / Hôm qua | Cùng thứ tuần trước |
| Tuần này / Tuần trước | Tuần liền trước |
| Tháng này / Tháng trước | Tháng liền trước |
| Custom range | Khoảng liền trước cùng độ dài |

---

## 6. QUICK ACTIONS — ĐẶT LẠI VỊ TRÍ

Mục 13 tài liệu gốc đề xuất một thanh Quick Actions với 4 nút. Bản hiện tại đang có thanh đó, cộng thêm nút `Check-in quầy` trên header và mục `Check-in quầy` trên sidebar — cùng một hành động xuất hiện ba lần.

**Đề xuất: bỏ thanh Quick Actions ngang, thay bằng một nút gộp ở branch context bar.**

```
[ + Thao tác nhanh ▾ ]
  ├ Đăng ký hội viên
  ├ Check-in quầy
  ├ Tạo thanh toán
  └ Đặt lịch PT
```

Lý do: Branch Manager hiếm khi tự thực hiện các thao tác này — đó là việc của lễ tân. Dành một dải ngang 80px trên fold cho hành động không phải của persona này là đánh đổi sai. Gộp vào dropdown giữ được khả năng truy cập mà không tốn diện tích.

Nếu đo được rằng manager thực sự dùng thường xuyên, có thể nâng một hành động lên thành nút riêng — nhưng chỉ một, và phải dựa trên số liệu.

---

## 7. TRẠNG THÁI GIAO DIỆN

Đây là phần thường bị bỏ sót và cũng là nơi bản hiện tại lộ rõ nhất — toàn bộ ảnh chụp đang ở trạng thái dữ liệu rỗng nhưng giao diện không hề thừa nhận điều đó.

### 7.1 Đang tải

Dùng skeleton theo đúng hình dạng nội dung, không dùng spinner toàn trang.

- KPI: khối xám `--surface-sunk` cao 28px, rộng 60%, bo 4px
- Hàng đợi: 3 hàng skeleton
- Biểu đồ: khối xám nguyên vùng

Thời lượng shimmer 1.4s. Nếu quá 3 giây, thay bằng dòng chữ `Đang tải dữ liệu chi nhánh…` để người dùng biết hệ thống chưa treo.

### 7.2 Giá trị bằng 0 ở KPI

**Số 0 vẫn hiển thị bình thường, không tô màu cảnh báo.** Chỉ số phụ đổi nội dung:

```
Chờ thanh toán
0                          ← --ink-3, không phải --danger
Không có giao dịch chờ
```

### 7.3 Hàng đợi rỗng

Đây là trạng thái tốt, phải trông như trạng thái tốt.

```
┌──────────────────────────────────────────────┐
│                                              │
│              ✓                               │
│      Không có việc cần xử lý                 │
│      Mọi cảnh báo trong chi nhánh đã được    │
│      giải quyết.                             │
│                                              │
└──────────────────────────────────────────────┘
```
Chiều cao cố định 140px. Icon `--brand` 24px. Tiêu đề 14/500 `--ink-2`. Mô tả 13/400 `--ink-3`.

Không hiển thị ba thẻ rỗng mang màu Critical/Warning/Info như bản hiện tại.

### 7.4 Chi nhánh mới, chưa có dữ liệu lịch sử

Tầng 2 không hiển thị biểu đồ trống:

```
Chưa đủ dữ liệu để so sánh
Chi nhánh cần ít nhất 7 ngày hoạt động để hiển thị xu hướng.
Đã ghi nhận 3/7 ngày.
```

### 7.5 Lỗi tải

Lỗi cục bộ theo vùng, không sập cả trang. Vùng lỗi hiển thị:

```
Không tải được dữ liệu doanh thu.  [Thử lại]
```

Nói rõ vùng nào lỗi và cho hành động khắc phục. Không dùng `Error:`, không hiển thị mã lỗi kỹ thuật, không viết ở ngôi thứ nhất.

---

## 8. TẢI DỮ LIỆU VÀ LÀM MỚI

Thứ tự ưu tiên request khi vào trang:

```
1. Hàng đợi xử lý          ← quan trọng nhất, tải trước
2. KPI thời gian thực
3. Biểu đồ lưu lượng
4. Tầng 2 (lazy, khi vào viewport)
```

Tầng 2 dùng lazy load qua IntersectionObserver. Người dùng chỉ cuộn xuống trong khoảng 1/5 số lần truy cập — không nên trả chi phí query tổng hợp cho 4/5 lần còn lại.

Làm mới:

| Vùng | Cơ chế | Chu kỳ |
|---|---|---|
| KPI thời gian thực | Polling | 30s |
| Hàng đợi | Polling | 30s |
| Biểu đồ lưu lượng | Polling | 5 phút |
| Tầng 2 | Chỉ khi đổi bộ lọc hoặc bấm làm mới | — |

Khi tab trình duyệt ở background, dừng polling. Khi quay lại, gọi ngay một lần rồi tiếp tục chu kỳ.

**Không nhảy số đột ngột.** Khi polling trả về giá trị mới, animate số trong 400ms và nháy nền `--brand-tint` 600ms ở ô thay đổi. Người dùng cần nhận ra cái gì vừa đổi.

**Không đẩy hàng khi hàng đợi cập nhật.** Nếu có mục mới trong lúc người dùng đang đọc, chèn một thanh ở đầu danh sách: `2 việc mới · Tải lại`. Danh sách chỉ đổi khi người dùng chủ động bấm. Danh sách tự nhảy trong lúc người dùng chuẩn bị click là lỗi nghiêm trọng ở giao diện xử lý hàng đợi.

---

## 9. RESPONSIVE

Dashboard này là công cụ desktop. Nhưng Branch Manager sẽ mở trên điện thoại khi không ở chi nhánh, nên cần một bản rút gọn có chủ đích — không phải bản desktop bị bóp lại.

**Ở `xs` (< 600px), chỉ giữ tầng 1:**

```
┌─────────────────────┐
│ Cơ sở 2 Hà Nội      │
│ ● Thời gian thực    │
├──────────┬──────────┤
│ Đang tập │ Check-in │
│    42    │   127    │
├──────────┼──────────┤
│ Chờ TT   │ PT       │
│    3     │    18    │
├──────────┴──────────┤
│ Hàng đợi · 5 việc   │
│ ● 2 giao dịch...    │
│ ● 1 khách chưa...   │
│ ● 25 membership...  │
├─────────────────────┤
│ Xem hiệu suất →     │
└─────────────────────┘
```

Tầng 2 chuyển thành một link sang trang riêng. Nút hành động trong hàng đợi cao tối thiểu 44px để bấm được bằng ngón tay. Biểu đồ lưu lượng ẩn.

---

## 10. BUSINESS RULE BỔ SUNG

Thêm vào mục 15 của tài liệu gốc:

```
BR-DASH-13:
Action Item có count = 0 không được render.
Không hiển thị placeholder rỗng mang màu cảnh báo.

BR-DASH-14:
Mỗi Action Item phải khai báo trước navigationType
(QUICK_ACTION | FILTERED_LIST) để giao diện chọn đúng nhãn nút.

BR-DASH-15:
Real-time KPI và Performance KPI phải nằm ở hai vùng giao diện
tách biệt, có nhãn phân vùng rõ ràng. Bộ lọc thời gian đặt trong
vùng Performance, không đặt ở header toàn trang.

BR-DASH-16:
Mức độ nghiêm trọng chỉ được mã hoá bằng MỘT tín hiệu thị giác
duy nhất trên mỗi Action Item.

BR-DASH-17:
Hàng đợi xử lý không tự thay đổi thứ tự hoặc nội dung khi người
dùng đang thao tác. Cập nhật phải qua xác nhận chủ động.

BR-DASH-18:
Mỗi màn hình chỉ có tối đa một nút primary. Các hành động còn lại
dùng kiểu secondary hoặc ghost.
```

---

## 11. ĐIỀU CHỈNH PHẠM VI MVP

### Nên hoãn: cá nhân hoá KPI (phương án 42C)

Tính năng này kéo theo: lưu preference theo user, giao diện kéo thả, migration khi bộ KPI chuẩn thay đổi, xử lý trường hợp user ghim KPI sau đó bị thu hồi quyền. Đó là khối lượng đáng kể cho một tính năng chưa có dữ liệu nào chứng minh là cần.

**Đề xuất:** chốt bộ KPI mặc định, chạy 2–3 tháng, đo tần suất tương tác từng KPI rồi mới quyết. Nếu vẫn muốn giữ trong MVP, chỉ cho **ẩn/hiện** ở tầng 2 — không cho sắp xếp lại, không cho đụng vào tầng 1.

Bốn KPI tầng 1 phải cố định vì chúng là nền tảng vận hành. Cho phép manager ẩn `Chờ thanh toán` là cho phép họ tự làm mù mình trước một cảnh báo tài chính.

### Nên thêm vào MVP: lịch sử hành động

Hàng đợi cần một tab phụ `Đã xử lý` liệt kê các mục đã đóng trong 7 ngày, kèm người xử lý và thời điểm. Không có nó thì manager không thể trả lời câu hỏi "hôm qua ai đã duyệt giao dịch này" — và đó là câu hỏi sẽ xuất hiện trong tuần đầu vận hành.

---

## 12. NHỮNG ĐIỀU KHÔNG NÊN LÀM

Ghi lại để tránh lặp lại trong các màn hình sau:

1. **Không đặt tiêu đề trang cỡ lớn kèm phụ đề mô tả.** `Trung tâm Điều hành Chi nhánh` + một dòng giải thích chiếm 120px chiều cao mà không mang dữ liệu. Người dùng đã biết mình đang ở đâu — nav đã nói rồi.
2. **Không lặp cùng một hành động ở ba nơi.**
3. **Không dùng chữ hoa toàn phần cho tiếng Việt.**
4. **Không dùng phần trăm cho chỉ số vận hành.** `+14.2%` số người trong phòng tập so với hôm qua không dẫn tới hành động nào.
5. **Không để thẻ trong cùng một nhóm có kiểu dáng khác nhau** nếu không có khác biệt về ngữ nghĩa.
6. **Không dùng màu thương hiệu làm màu trạng thái.**
7. **Không thiết kế chỉ cho trạng thái có dữ liệu đầy đủ.** Trạng thái rỗng, đang tải và lỗi phải được thiết kế cùng lúc với trạng thái chính.

---

## PHỤ LỤC — CHECKLIST BÀN GIAO FE

- [ ] Container tối đa 1360px, mọi spacing là bội số 4px
- [ ] Hai dải nhãn tầng hiển thị đúng, bộ lọc ngày nằm trong dải tầng 2
- [ ] Bốn KPI tầng 1 cố định, không có phần trăm
- [ ] Hàng đợi là một danh sách sắp theo mức độ, không phải ba cột
- [ ] Chấm trạng thái 6px là tín hiệu severity duy nhất
- [ ] Nhãn nút phân biệt modal và điều hướng
- [ ] Mục count = 0 không render
- [ ] Bốn trạng thái (đủ dữ liệu / rỗng / đang tải / lỗi) đều có thiết kế
- [ ] Tầng 2 lazy load, có tab, nhãn kỳ so sánh đầy đủ chữ
- [ ] Polling dừng khi tab ở background
- [ ] Hàng đợi không tự nhảy, cập nhật qua thanh xác nhận
- [ ] Đúng một nút primary trên toàn màn hình
- [ ] Bản `xs` chỉ giữ tầng 1, vùng chạm tối thiểu 44px
- [ ] `prefers-reduced-motion` được tôn trọng ở chấm live và animation số
- [ ] Focus keyboard nhìn thấy được trên mọi hàng và nút của hàng đợi