# UI Redesign: Food Case Opener

Tài liệu này là yêu cầu cho agent chỉnh lại giao diện của project. **Chỉ đổi giao diện (CSS, markup, component trình bày). Không đổi logic, dữ liệu, routing, API, state.**

## 0. Cách làm việc

1. Đọc cấu trúc project trước: framework, cách viết style (Tailwind, CSS module, styled-components, CSS thuần...), các component dùng chung. Làm theo cách project đang dùng, không thêm thư viện UI mới.
2. Bắt đầu từ **design tokens** (mục 2) và các component dùng chung (nút, tab, thẻ món ăn, header). Sau đó mới sửa từng trang.
3. Sửa từng trang một, kiểm tra trang chạy được rồi mới sang trang tiếp theo.
4. Mọi chữ tiếng Việt giữ nguyên nội dung hiện có, trừ chỗ ghi rõ ở dưới. Phải hiển thị đúng dấu (font có subset `vietnamese`).

## 1. Vấn đề của UI hiện tại (cần bỏ)

UI hiện tại trông như được sinh tự động. Phải loại bỏ:

- Nền đen tuyền (#000 / #0b0b0b) kèm gradient cam và cyan, hiệu ứng glow/bóng phát sáng.
- Chữ tiêu đề dùng gradient hoặc đổi màu một từ để nhấn (vd: "MỞ HÒM **ẨM THỰC**").
- Mọi thứ là card bo góc lớn (>= 12px), giống hệt nhau, xếp lưới đều.
- Badge dạng pill ở khắp nơi: "CS2 VIBE", "CONTAINER CASE", "5 Món ăn", "Easy/Medium/Hard", "Giải pháp cho câu hỏi...".
- Nhãn mã kiểu "CASE #03" chỉ để trang trí.
- Emoji làm icon trong tiêu đề (📦, 📖...).
- Nhiều màu nhấn cùng lúc (cam, cyan, xanh lá, đỏ, vàng).
- Hero căn giữa với khối chữ to và đoạn mô tả dài.

## 2. Design tokens

Đặt thành CSS variables (hoặc theme của framework đang dùng).

```css
:root {
  --bg: #17191d;        /* nền trang, xám than, KHÔNG dùng đen tuyền */
  --panel: #20232a;     /* nền khối */
  --line: #30343d;      /* viền 1px */
  --text: #ece9e2;
  --muted: #8d929c;
  --gold: #e4ae39;      /* màu nhấn DUY NHẤT cho hành động chính */
  --on-gold: #1a1408;   /* chữ trên nền vàng */

  /* Độ hiếm, lấy cảm hứng từ skin CS2. Chỉ dùng để biểu thị độ khó/giá trị */
  --r1: #4b69ff;  /* Easy */
  --r2: #8847ff;  /* Medium */
  --r3: #d32ce6;  /* dự phòng, món đặc biệt */
  --r4: #eb4b4b;  /* Hard */
  --r5: #e4ae39;  /* hiếm nhất, hạn chế dùng */

  --radius: 3px;        /* bo góc nhỏ cho mọi thứ */
}
```

Bản sáng (tùy chọn nhưng nên có), tự bật theo `prefers-color-scheme: light`:

```css
--bg: #f1efea; --panel: #fbfaf7; --line: #d8d4ca;
--text: #1d1f24; --muted: #6b707a;
```

Quy tắc màu:

- `--gold` chỉ dùng cho nút hành động chính (Mở hòm), gạch chân tab đang chọn, số đếm tủ lạnh. Không dùng làm màu trang trí.
- Bỏ hoàn toàn cyan khỏi trang Tủ Lạnh. Trạng thái "đã có / chưa có" thể hiện bằng dấu tích và độ đậm chữ, không cần màu riêng.
- Màu độ hiếm chỉ xuất hiện ở **viền dưới 4px** của thẻ món ăn và ô trên vòng quay. Không tô nền, không glow.

## 3. Typography

- Tiêu đề, logo, nút lớn: **Barlow Condensed** (600/700). Hỗ trợ tiếng Việt, load từ Google Fonts với `subset=vietnamese`.
- Nội dung: **Inter** (400/500/600).
- Fallback: `'Barlow Condensed', Impact, sans-serif` và `Inter, system-ui, sans-serif`.
- Cỡ chữ: tiêu đề trang `clamp(40px, 7vw, 68px)`, tiêu đề mục 30px, nội dung 15px, chữ phụ 13px. Tiêu đề line-height ~1.
- **Không** viết hoa toàn bộ cho nhãn. Dùng sentence case ("Tủ lạnh", không phải "TỦ LẠNH").
- Không dùng font monospace cho nhãn. Chỉ dùng mono nếu hiển thị dữ liệu dạng bảng thật sự cần canh cột.
- Độ dài dòng của đoạn mô tả tối đa ~52 ký tự theo `ch` (`max-width: 52ch`).

## 4. Nguyên tắc chung

- Căn trái cho tiêu đề và nội dung. Không căn giữa hero.
- Bo góc `var(--radius)` (3px) cho mọi thứ: nút, thẻ, input, tab. Không có pill, không có bo tròn lớn (trừ ảnh/đĩa tròn nếu đó là hình tròn thật).
- Viền 1px `var(--line)`. Không đổ bóng. Không glow. Không gradient làm trang trí.
- Chỉ **một** màu nhấn. Mỗi màn hình tối đa một nút vàng nổi bật.
- Bỏ emoji khỏi tiêu đề và nút. Nếu cần icon, dùng icon nét đơn (Lucide/Phosphor, hoặc bộ icon project đang có), cỡ 16-18px, màu `--muted`.
- Ít chuyển động. Chỉ giữ animation khi nó phản hồi hành động của người dùng (quay hòm, mở/đóng panel). Không fade-in/slide-up cho từng section, không hover-scale cho mọi card.
- Tôn trọng `prefers-reduced-motion`.
- Responsive tới 360px. Focus bàn phím luôn nhìn thấy (`outline: 2px solid var(--gold); outline-offset: 2px`).
- Mỗi card chỉ có tối đa **một** thông tin phụ. Bỏ các badge thừa.

## 5. Component dùng chung

### Header
- Cao 56px, viền dưới 1px `--line`, nền `--bg`.
- Trái: logo chữ "Food Case Opener" (Barlow Condensed 700, 22px). **Bỏ ô logo cam, bỏ badge "CS2 VIBE", bỏ dòng slogan.**
- Phải: menu chữ thường (Hòm món ăn, Công thức, Quản lý, Tủ lạnh). Mục đang chọn: chữ `--text` và gạch chân 2px `--gold`. Mục khác: `--muted`.
- "Tủ lạnh" kèm số lượng dạng chữ vàng đậm (vd: `Tủ lạnh 10`), **không** dùng pill/badge.
- Mobile: ẩn các mục không active, giữ mục đang chọn và Tủ lạnh.

### Nút
- Chính: nền `--gold`, chữ `--on-gold`, Barlow Condensed 700 20px, padding 11px 30px, bo 3px, không bóng. Không thêm mũi tên "→".
- Phụ: nền trong suốt, viền `--line`, chữ `--text`. Hover: viền `--muted`.
- Nguy hiểm (vd: Dọn sạch tủ lạnh): chữ `--r4`, không nền, không viền.

### Tab / chip chọn
- Viền 1px `--line`, bo 3px, chữ `--muted`. Đang chọn: nền `--panel`, chữ `--text`, viền `--muted`.

### Thẻ món ăn (dùng ở Kho Công Thức và ô trong Tủ lạnh nếu có)
- Nền `--panel`, viền 1px `--line`, **viền dưới 4px màu độ hiếm**, bo 3px.
- Ảnh vuông hoặc 4:3, **đồng nhất tỉ lệ cho mọi món**, bo 2-3px, không viền, không badge chồng lên ảnh.
- Tên món (600, 14-15px), một dòng phụ: `25 phút, khoảng 35k`. Viết dạng chữ, không dùng icon đồng hồ nhỏ, không dùng ký hiệu `~`.
- Độ khó thể hiện bằng màu viền dưới, **không** dùng badge chữ Easy/Medium/Hard nữa. Thêm chú thích một dòng ở đầu trang: "Viền màu là độ khó: xanh dễ, tím vừa, đỏ khó".
- Không hiệu ứng hover phóng to hay đổ bóng. Hover chỉ đổi màu viền sang `--muted`.

### Ánh xạ độ khó sang màu
| Độ khó | Biến màu |
|---|---|
| Easy | `--r1` |
| Medium | `--r2` |
| Hard | `--r4` |

## 6. Từng trang

### 6.1 Hòm Món Ăn (trang chủ)

Đây là trang quan trọng nhất. Cấu trúc từ trên xuống:

1. **Tab chọn hòm** (3 hòm hiện tại: Sinh viên tiết kiệm, Cấp tốc dưới 20 phút, Mâm cơm mẹ nấu), mỗi tab ghi số món trong ngoặc. Thay thế cho 3 card to hiện tại.
2. **Tên hòm đang chọn** làm tiêu đề (Barlow Condensed, cỡ lớn), một dòng mô tả bên dưới.
3. **Vòng quay roulette** chiếm toàn chiều ngang nội dung:
   - Khung nền `--panel`, viền 1px, bo 4px, cao ~176px, `overflow: hidden`.
   - Vạch giữa 2px màu `--text`, đặt giữa khung.
   - Hai mép trái/phải mờ dần về `--panel` (gradient chỉ dùng để che mép).
   - Mỗi ô: rộng 132px, cao 148px, nền `--bg`, ảnh/đĩa món + tên, viền dưới 4px màu độ hiếm.
   - Khi quay xong, ô trúng được viền 2px cùng màu độ hiếm.
   - Giữ nguyên logic quay hiện tại. Chỉ đổi hình thức. Animation: `transform` ~5 giây, easing `cubic-bezier(.12,.72,.08,1)`; reduced-motion thì chuyển tức thì.
4. **Hàng hành động**: nút vàng "Mở hòm" bên trái, dòng kết quả bên cạnh (vd: "Hôm nay ăn **Cơm chiên trứng xúc xích**, nấu khoảng 15 phút, tốn 25k."). Sau khi quay xong, nút đổi thành "Mở hòm khác".
5. **Mục "Nấu được ngay với tủ lạnh"**: lưới thẻ món ăn nhỏ (`repeat(auto-fill, minmax(150px, 1fr))`, gap 8px) cho các món trong hòm đang chọn.

Bỏ: hero căn giữa, badge "Giải pháp cho câu hỏi...", đoạn mô tả dài, nút "Làm mới" nếu không cần thiết, nhãn CASE #.

### 6.2 Kho Công Thức

- Tiêu đề "Kho công thức món ăn" (sentence case, không emoji), mô tả một dòng, ô tìm kiếm nằm cùng hàng tiêu đề ở bên phải (viền 1px, bo 3px).
- Lưới thẻ món ăn theo mục 5. Ảnh cùng tỉ lệ. Bỏ badge độ khó trên ảnh, thay bằng viền dưới màu.
- Link "Chi tiết →" đổi thành chữ "Xem công thức" dạng link chữ `--text`, gạch chân khi hover. Không mũi tên.
- Nếu muốn nhịp bố cục bớt đều: món đầu tiên (mới nhất/nổi bật) có thể rộng gấp đôi trên desktop.

### 6.3 Tủ Lạnh

- Tiêu đề "Tủ lạnh của bạn" và một dòng mô tả ngắn. Số lượng nguyên liệu hiển thị cạnh tiêu đề, không dùng khối to bên phải.
- Bỏ nền gradient xanh và viền cyan. Dùng `--panel` + viền `--line`.
- Hai cột: bên trái form "Thêm đồ vào tủ" (tên, số lượng, đơn vị, nút phụ hoặc nút vàng "Cất vào tủ"), bên phải "Chọn nhanh nguyên liệu".
- Chip nguyên liệu: dùng style chip ở mục 5. Đã có trong tủ: có dấu tích và chữ `--text`; chưa có: chữ `--muted`. Số lượng/đơn vị viết chữ thường cạnh tên, không dùng font mono cyan.
- Danh sách "Nguyên liệu đang có": lưới thẻ nhỏ, tên + số lượng + nút `-` `+` kiểu nút phụ vuông. Nút xóa dùng icon nét đơn.
- "Dọn sạch tủ lạnh" theo kiểu nút nguy hiểm, kèm hộp xác nhận nếu logic hiện tại đã có.

### 6.4 Quản Lý và các trang còn lại

Chưa có ảnh chụp. Áp dụng đúng token, component và nguyên tắc chung ở trên: form một cột hoặc hai cột, input viền 1px nền `--panel`, bảng dạng danh sách có đường kẻ ngang `--line`, không card lồng card.

## 7. Ảnh món ăn

- Mọi ảnh món cắt cùng tỉ lệ (vuông hoặc 4:3) bằng `object-fit: cover`.
- Nếu chưa có ảnh: placeholder là hình đĩa tròn đơn giản, nền `--bg`, không dùng ảnh stock ngẫu nhiên khác phong cách.
- Khuyến nghị cho người dùng: chụp cùng góc (từ trên xuống), cùng nền, cùng tông màu để cả bộ ảnh đồng bộ.

## 8. Tiêu chí hoàn thành

- [ ] Không còn nền đen tuyền, gradient trang trí, glow, bóng đổ.
- [ ] Chỉ còn một màu nhấn (`--gold`); màu độ hiếm chỉ ở viền dưới thẻ/ô.
- [ ] Không còn badge pill, emoji trong tiêu đề, nhãn "CASE #", "CS2 VIBE", "CONTAINER CASE".
- [ ] Tiêu đề không có gradient, không nhấn một từ bằng màu khác.
- [ ] Bo góc thống nhất 3-4px.
- [ ] Hòm Món Ăn có tab chọn hòm, vòng quay full-width, nút "Mở hòm" vàng.
- [ ] Ảnh món đồng nhất tỉ lệ; độ khó thể hiện bằng viền dưới màu.
- [ ] Hiển thị đúng dấu tiếng Việt ở mọi font.
- [ ] Chạy tốt từ 360px đến desktop, không cuộn ngang ở thân trang.
- [ ] Focus bàn phím rõ, hỗ trợ `prefers-reduced-motion`.
- [ ] Logic, dữ liệu, routing, API không thay đổi. Test/build hiện có vẫn pass.
