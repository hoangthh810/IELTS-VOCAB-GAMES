# CLAUDE.md — Vocab Arena (IELTS Vocab Games)

## Mục đích & người dùng

- Web game học từ vựng IELTS, mục tiêu **band 6.5**, dành cho **học viên Việt Nam**.
- Toàn bộ giao diện, thông báo, tên boss, mô tả vật phẩm đều bằng **tiếng Việt**; nội dung học (từ, collocation, câu ví dụ) bằng tiếng Anh, nghĩa bằng tiếng Việt.
- Tên hiển thị trong app: **Vocab Arena** (`<title>` và logo).
- Tác giả tự làm, không có backend, không có build step. Chạy hoàn toàn trên trình duyệt, tiến độ lưu ở `localStorage`.

## Cấu trúc file

```
index.html          HTML khung: 7 màn hình .screen + nạp CSS/JS
css/style.css       Toàn bộ CSS
js/data.js          const DATA — dữ liệu 17 chủ đề
js/core.js          ALL/BYID, helper, lưu trữ st/save, huy hiệu, hiệu ứng, âm thanh, show()
js/questions.js     pool(), makeQuiz / makeFill / makeCol
js/practice.js      Trang chủ (chọn chủ đề) + chế độ luyện tập thường
js/boss.js          Phiêu lưu đánh Boss
js/main.js          renderHome() — khởi động app
archive/ielts-vocab-games.html   Bản gốc một-file, chỉ để đối chiếu, KHÔNG sửa
```

| File | Nội dung chính |
|---|---|
| `index.html` | 7 màn hình `.screen` — `#home`, `#game`, `#result`, `#map`, `#battle`, `#victory`, `#defeat` + `#toast`, `#flash` |
| `css/style.css` | Biến màu ở `:root` (sáng/tối theo `prefers-color-scheme` và `data-theme`), CSS cho home, game, result, phần Boss (từ comment `/* ===== boss adventure ===== */`) |
| `js/data.js` | `const DATA = [...]` |
| `js/core.js` | Dữ liệu dẫn xuất (`ALL`, `BYID`), helper (`esc`, `shuffle`, `pick`, `$`, `findMatch`, `hlEx`), storage (`KEY`, `st`, `save`, `dayKey`, `yesterday`, `liveStreak`), `BADGES`/`unlock`, hiệu ứng (`toast`, `confetti`, `plus`, `beep` dùng WebAudio), chuyển màn `show` |
| `js/questions.js` | `STOP`, `colTokens`, `poolOverride`, `pool`, `choose`, `makeQuiz`, `makeFill`, `makeCol` (dùng chung cho chế độ thường và Boss) |
| `js/practice.js` | `sel`, `useWrong`, `renderChips`, `renderHome`, nút âm thanh; `LEN`, `G`, `start`, `next`, `answer`, `finish`, phím tắt |
| `js/boss.js` | `BOSSES`, `ITEMS`, `DMG`, `RPG0`, `cfg`, map, shop, battle (`B`), item, victory/chest, defeat, phím tắt |
| `js/main.js` | `renderHome()` |

### Cách các file JS liên kết

- Dùng `<script src>` **thường** (không `type="module"`, không build tool) để mở được bằng double-click `index.html` qua `file://`. ES module và `fetch` file JSON bị chặn trên `file://`, nên **không** dùng.
- Mọi `const`/`let`/`function` khai báo ở top-level đều là biến toàn cục dùng chung giữa các file.
- **Thứ tự nạp trong `index.html` là bắt buộc**: `data → core → questions → practice → boss → main`. Code chạy ngay khi nạp (top-level) chỉ được dùng thứ đã khai báo ở file trước, ví dụ `core.js` cần `DATA`, `practice.js` cần `st`, `boss.js` gán `st.rpg`. Tham chiếu "ngược" (ví dụ `pool()` trong `questions.js` dùng `sel`/`useWrong` của `practice.js`, `unlock` gọi `renderHome`) chỉ hợp lệ vì nằm trong thân hàm, chạy sau khi mọi file đã nạp.
- Script đặt cuối `<body>` nên DOM đã sẵn sàng khi gắn sự kiện.
- Không khai báo trùng tên top-level giữa các file (sẽ lỗi `Identifier has already been declared`).

Font Be Vietnam Pro lấy từ Google Fonts; không có thư viện JS nào khác.

## Các chế độ chơi

Mỗi lượt chơi thường có **12 câu** (`LEN = 12`). Câu hỏi lấy từ `pool()`: các chủ đề đang chọn, hoặc kho "📕 Từ hay sai" nếu bật chip đó.

| Chế độ | `data-mode` | Hàm | Mô tả |
|---|---|---|---|
| 🎯 Quiz nghĩa | `quiz` | `makeQuiz` | Trắc nghiệm 4 đáp án; 60% Anh→Việt, 40% Việt→Anh. Đáp án nhiễu lấy cùng loại (word/col). |
| ✍️ Điền từ | `fill` | `makeFill` | Câu ví dụ bị che từ cần học, người chơi gõ đáp án. Chỉ dùng `words` mà `findMatch` tìm thấy từ trong câu ví dụ. Có gợi ý chữ cái đầu + số ký tự, nút "Bỏ qua". |
| 🧩 Collocation | `col` | `makeCol` | Che một từ "có nghĩa" (bỏ stop-word, `colTokens`) trong cụm collocation, chọn 1 trong 4 từ. |
| 🌀 Hỗn hợp | `mix` | ngẫu nhiên 1 trong 3 hàm trên mỗi câu | |

Điểm: mỗi câu đúng `10 × hệ số combo`, hệ số = `min(4, 1 + floor(combo/3))`. Điểm cộng thẳng vào XP. Level = `floor(xp/300) + 1`.
Trả lời sai → từ vào `st.wrong`; trả lời đúng một từ đang có trong `st.wrong` → xoá khỏi đó và tăng `st.fixed`.
Phím tắt: `1–4` chọn đáp án, `Enter` để sang câu tiếp.

### ⚔️ Phiêu lưu đánh Boss

- **Bản đồ 18 màn**: màn 1–17 ứng với 17 chủ đề trong `DATA` (màn `i` dùng chủ đề `DATA[i]`), màn 18 là **trùm cuối 🐲 Rồng IELTS Tối Thượng** dùng toàn bộ từ vựng. `LAST = DATA.length` là index của trùm cuối.
- Mở khoá tuần tự: màn `i` mở khi màn `i-1` đã thắng (`unlocked`). Thắng được 1–3 sao theo % máu còn lại (≥70% → 3★, ≥40% → 2★).
- Chỉ số boss tính trong `cfg(i)`: HP `120 + i*20` (trùm cuối 600), sát thương `12 + i*1.2` (trùm cuối 34), thời gian trả lời giảm dần theo màn (`tq` cho quiz/col, `tf` cho điền từ).
- Trận đánh: mỗi câu hỏi random 40% quiz / 30% col / 30% fill. Sát thương theo độ khó `DMG = {quiz:20, col:26, fill:36}`, combo cộng thêm tối đa +50%. Sai / hết giờ / bỏ qua → boss đánh lại; boss dưới 30% HP sẽ "nổi điên" (x1.3 sát thương). Mỗi câu đúng +10 XP.
- **Vật phẩm** (`ITEMS`): 🧪 `potion` hồi 40 HP (50 vàng), 🛡️ `shield` chặn 1 đòn (60), 💡 `half` loại 2 đáp án sai / hiện nửa số chữ (40), 💢 `rage` x2 sát thương đòn đúng kế tiếp (70).
- **Cửa hàng**: mua vật phẩm bằng vàng; "Bùa sinh lực" +15 máu tối đa vĩnh viễn, tối đa cấp 5, giá `120 × (cấp+1)`. Máu người chơi = `100 + hpLv*15`.
- **Rương** sau khi thắng: vàng `25 + i*4 + sao*10 (+30 nếu lần đầu)`, số vật phẩm = số sao (+1 bình máu nếu lần đầu thắng). 3 sao → rương vàng. Thua được 10 vàng an ủi.

### Huy hiệu (`BADGES`)

`first, combo5, combo10, perfect, allmodes, fixer, streak3, streak7, xp500, xp2000, boss1, stars3, dragon` — mở bằng `unlock(id)`.

## Dữ liệu `DATA`

`DATA` (trong `js/data.js`) là mảng **17 chủ đề** (thứ tự hiện tại: Education, Environment, Technology, Health, Work & Career, Travel & Tourism, Crime & Law, City & Society, Friends, National Holidays & Festivals, Home & House, Hobbies & Free Time, Transport & Traffic, Social Welfare, Family, Food & Eating, Media & Advertising). Mỗi chủ đề hiện có **20 words + 15 cols**.

```js
{name:"🎓 Education",          // emoji + tên tiếng Anh, hiển thị trên chip và bản đồ
 words:[                         // [từ, từ loại, nghĩa tiếng Việt, câu ví dụ]
  ["curriculum","n","chương trình học","The national curriculum includes compulsory science lessons."],
  ...],
 cols:[                          // [cụm từ, nghĩa tiếng Việt, câu ví dụ]
  ["acquire knowledge","tiếp thu kiến thức","Reading widely is one of the best ways to acquire knowledge."],
  ...]}
```

Lúc chạy, `DATA` được làm phẳng thành `ALL`, mỗi mục có dạng
`{id, ti, kind:'word'|'col', term, pos, mean, ex}` với `id = ti + 'w' + i` hoặc `ti + 'c' + i` (ví dụ `"3w12"`). `BYID` tra ngược từ id.

### Yêu cầu nội dung

- Câu ví dụ của **word** nên chứa chính từ đó (hoặc dạng biến đổi cùng gốc) để chế độ Điền từ dùng được — `findMatch` tìm theo tiền tố của từ dài hơn 2 ký tự đầu tiên (bỏ `the`, `one's`, `someone's`, `something`, `with`).
- **col** phải có ít nhất một khoảng trắng và một từ "có nghĩa" ngoài stop-word, nếu không sẽ không xuất hiện ở chế độ Collocation.
- Nghĩa tiếng Việt nên ngắn gọn, khác nhau trong cùng chủ đề (đáp án nhiễu so sánh bằng chuỗi).
- Không dùng ký tự `"` chưa escape trong chuỗi JS.

### Cách thêm chủ đề mới

⚠️ **Id từ và tiến độ map đều dựa trên VỊ TRÍ (index)**, nên:

1. **Chỉ thêm chủ đề mới vào CUỐI mảng `DATA`**. Không chèn giữa, không đổi thứ tự, không xoá chủ đề cũ — nếu không, `st.wrong`, `st.topics` và `st.rpg.cleared` của người dùng sẽ trỏ nhầm từ/màn.
2. Tương tự, trong một chủ đề chỉ **thêm từ/collocation vào cuối** `words`/`cols`.
3. Thêm 1 boss mới vào `BOSSES` (`js/boss.js`) **ngay trước** Rồng IELTS (phần tử cuối) — `BOSSES` phải luôn có `DATA.length + 1` phần tử. Mẫu: `{e:'🐸', n:'Tên boss tiếng Việt', l:'Câu thoại khiêu khích'}`.
4. Cập nhật mô tả "18 màn" trong nút `#advBtn` (`index.html`) và CLAUDE.md.
5. Lưu ý: người đã thắng trùm cuối có `st.rpg.cleared[17]`; sau khi thêm chủ đề thứ 18, giá trị đó sẽ được hiểu là đã thắng màn 18 mới, và trùm cuối chuyển sang index 18 (cần thắng lại). Chấp nhận được, nhưng cần biết.

## Lưu tiến độ (`localStorage`)

- **Key**: `ielts-vocab-arena-v1` (hằng `KEY`). Toàn bộ trạng thái là một object JSON `st`, ghi lại bằng `save()` sau mỗi thay đổi. Mọi truy cập `localStorage` đều bọc `try/catch`.
- Khi tải: `Object.assign(st, JSON.parse(...))` lên giá trị mặc định, nên **thêm trường mới chỉ cần thêm default** vào khai báo `st` (hoặc `RPG0` cho phần Boss). Đổi ý nghĩa/kiểu của trường cũ thì cần migrate hoặc đổi key (`-v2`).

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `xp` | number | Tổng XP |
| `streak` | number | Số ngày học liên tiếp |
| `last` | string \| null | Ngày học gần nhất, dạng `YYYY-MM-DD` (`toLocaleDateString('sv')`) |
| `badges` | string[] | Id huy hiệu đã mở |
| `modes` | string[] | Các dạng câu đã chơi (`quiz`/`fill`/`col`) — cho huy hiệu "Toàn năng" |
| `wrong` | `{[id]: number}` | Kho "Từ hay sai": id mục → số lần sai |
| `fixed` | number | Số lần sửa sai thành công (huy hiệu "Sửa sai" ở 10) |
| `best` | number | Điểm cao nhất một lượt chơi thường |
| `sound` | boolean | Bật/tắt âm thanh |
| `topics` | number[] \| null | Index các chủ đề đang chọn (null = tất cả) |
| `rpg.gold` | number | Vàng (mặc định 50) |
| `rpg.cleared` | `{[stageIndex]: 1\|2\|3}` | Số sao tốt nhất mỗi màn đã thắng |
| `rpg.inv` | `{potion, shield, half, rage}` | Số lượng vật phẩm (mặc định 2/1/1/0) |
| `rpg.hpLv` | number | Cấp Bùa sinh lực (0–5) |

Streak được cập nhật khi kết thúc lượt chơi thường (`finish`) và khi thắng/thua trận Boss (`touchStreak`). Hiển thị dùng `liveStreak()` (về 0 nếu bỏ quá 1 ngày).

## Quy ước code

- JS thuần, không framework, không module, không build. Biến toàn cục: `st` (lưu trữ), `G` (lượt chơi thường), `B` (trận Boss), `sel`/`useWrong` (chọn chủ đề), `poolOverride` (Boss ghi đè nguồn câu hỏi).
- Phong cách **rất cô đọng**: arrow function, nhiều câu lệnh trên một dòng, tên ngắn (`st`, `q`, `it`, `c`, `r`). Giữ nguyên phong cách này khi sửa; không tự ý format lại cả file.
- `$(id)` = `document.getElementById`. Render bằng template string + `innerHTML`; **mọi dữ liệu đưa vào HTML phải qua `esc()`**.
- Sự kiện gắn bằng `el.onclick = ...` / event delegation trên container (`#chips`, `#opts`, `#stages`, `#shop`, `#items`).
- Chia khu bằng comment `// ---------- tên ----------` và `// ================= BOSS ADVENTURE =================`.
- Code mới đặt vào đúng file theo trách nhiệm (bảng ở trên). Thêm file JS mới thì thêm thẻ `<script src>` vào `index.html` đúng vị trí trong thứ tự nạp.
- CSS dùng biến màu ở `:root`; màu mới phải khai báo cho cả chế độ sáng và tối (cả block `prefers-color-scheme: dark` lẫn `[data-theme="dark"]`).
- Chuyển màn hình bằng `show(id)`.
- Văn bản hiển thị cho người dùng viết bằng tiếng Việt, giọng thân thiện, có emoji.

## Cách chạy & kiểm tra

- **Chạy**: mở trực tiếp `index.html` bằng trình duyệt (double-click), hoặc phục vụ tĩnh: `npx serve .` / `python -m http.server` rồi mở trang.
- Lưu ý: trình duyệt lưu `localStorage` theo origin, nên tiến độ khi mở qua `file://` và qua `http://localhost` là **hai kho riêng**.
- Không có test tự động. Sau mỗi thay đổi, kiểm tra thủ công:
  1. Mở DevTools Console — không có lỗi khi tải trang (kể cả lỗi 404 do sai đường dẫn file JS/CSS).
  2. Chơi thử đủ 4 chế độ (Quiz, Điền từ, Collocation, Hỗn hợp) tới màn kết quả; thử phím tắt 1–4 và Enter.
  3. Trả lời sai vài câu → chip "📕 Từ hay sai" xuất hiện và chơi được từ kho đó.
  4. Phiêu lưu: vào map, đánh màn 1, dùng từng vật phẩm, thắng → mở rương; thua → màn defeat; mua đồ ở cửa hàng.
  5. Tải lại trang → XP, huy hiệu, vàng, sao vẫn giữ nguyên.
  6. Kiểm tra giao diện sáng/tối và màn hình điện thoại (~375px).
- Khi sửa `DATA`, chạy nhanh trong Console để kiểm tra dữ liệu dùng được:
  ```js
  ALL.filter(x=>x.kind==='word'&&!findMatch(x.ex,x.term)).map(x=>x.term)   // word không dùng được cho Điền từ
  ALL.filter(x=>x.kind==='col'&&!(x.term.includes(' ')&&colTokens(x.term).length)).map(x=>x.term) // col không dùng được
  BOSSES.length === DATA.length + 1                                          // phải là true
  ```
- Reset tiến độ: `localStorage.removeItem('ielts-vocab-arena-v1')` rồi tải lại.

## Git

- Remote: `https://github.com/hoangthh810/IELTS-VOCAB-GAMES.git`, nhánh `main`.
- Commit đầu tiên chứa file gốc chưa sửa — dùng làm mốc để quay lại. Bản gốc cũng được giữ ở `archive/ielts-vocab-games.html`.
