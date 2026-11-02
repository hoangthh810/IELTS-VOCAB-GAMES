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
js/data.js          const DATA — dữ liệu 19 chủ đề
js/core.js          ALL/BYID, helper, lưu trữ st/save, huy hiệu, hiệu ứng, âm thanh, show()
js/questions.js     pool(), makeQuiz / makeFill / makeCol
js/practice.js      Trang chủ (chọn chủ đề) + chế độ luyện tập thường
js/boss.js          Phiêu lưu đánh Boss
js/firebase-config.js  const FIREBASE_CONFIG (null = tắt đăng nhập/đồng bộ)
js/sync.js          Đăng nhập Google + đồng bộ tiến độ lên Firestore (tuỳ chọn)
js/main.js          renderHome(); initSync() — khởi động app
privacy.html        Trang chính sách quyền riêng tư (link ở footer trang chủ)
icon.svg            Favicon
firebase.json       Cấu hình Firebase Hosting + đường dẫn rules
firestore.rules     Quy tắc bảo mật Firestore
archive/ielts-vocab-games.html   Bản gốc một-file, chỉ để đối chiếu, KHÔNG sửa
```

| File | Nội dung chính |
|---|---|
| `index.html` | 7 màn hình `.screen` — `#home`, `#game`, `#result`, `#map`, `#battle`, `#victory`, `#defeat` + `#toast`, `#flash` |
| `css/style.css` | Biến màu ở `:root` (sáng/tối theo `prefers-color-scheme` và `data-theme`), CSS cho home, game, result, phần Boss (từ comment `/* ===== boss adventure ===== */`) |
| `js/data.js` | `const DATA = [...]` |
| `js/core.js` | Dữ liệu dẫn xuất (`ALL`, `BYID`), helper (`esc`, `shuffle`, `pick`, `$`, `findMatch`, `hlEx`), storage (`KEY`, `st`, `save`, `dayKey`, `yesterday`, `liveStreak`), phát âm (`speak`, `spk`, `ipaTag`, `termHtml`), `BADGES`/`unlock`, hiệu ứng (`toast`, `confetti`, `plus`, `beep` dùng WebAudio), chuyển màn `show` |
| `js/questions.js` | `STOP`, `colTokens`, `poolOverride`, `pool`, `choose`, `makeQuiz`, `makeFill`, `makeCol` (dùng chung cho chế độ thường và Boss) |
| `js/practice.js` | `sel`, `useWrong`, `renderChips`, `renderHome`, nút âm thanh; `LEN`, `G`, `start`, `next`, `answer`, `finish`, phím tắt |
| `js/boss.js` | `BOSSES`, `ITEMS`, `DMG`, `RPG0`, `cfg`, map, shop, battle (`B`), item, victory/chest, defeat, phím tắt |
| `js/sync.js` | `initSync`, `mergeSt`, `pullAndMerge`, `queueUpload`/`flushUpload`, `signIn`/`signOut`, `renderAcct` (ô `#acct` trên trang chủ) |
| `js/main.js` | `renderHome(); initSync();` |

### Cách các file JS liên kết

- Dùng `<script src>` **thường** (không `type="module"`, không build tool) để mở được bằng double-click `index.html` qua `file://`. ES module và `fetch` file JSON bị chặn trên `file://`, nên **không** dùng.
- Mọi `const`/`let`/`function` khai báo ở top-level đều là biến toàn cục dùng chung giữa các file.
- **Thứ tự nạp trong `index.html` là bắt buộc**: `data → firebase-config → core → questions → practice → boss → sync → main`. Code chạy ngay khi nạp (top-level) chỉ được dùng thứ đã khai báo ở file trước, ví dụ `core.js` cần `DATA`, `practice.js` cần `st`, `boss.js` gán `st.rpg`. Tham chiếu "ngược" (ví dụ `pool()` trong `questions.js` dùng `sel`/`useWrong` của `practice.js`, `unlock` gọi `renderHome`) chỉ hợp lệ vì nằm trong thân hàm, chạy sau khi mọi file đã nạp.
- Script đặt cuối `<body>` nên DOM đã sẵn sàng khi gắn sự kiện.
- Không khai báo trùng tên top-level giữa các file (sẽ lỗi `Identifier has already been declared`).

Font Be Vietnam Pro lấy từ Google Fonts. Thư viện JS duy nhất là Firebase SDK bản *compat* (`firebase-app/auth/firestore-compat.js`, phiên bản `FB_VER` trong `sync.js`), được `sync.js` nạp động từ `www.gstatic.com` **chỉ khi** có `FIREBASE_CONFIG` và trang chạy qua http(s).

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

- **Bản đồ 20 màn**: màn 1–19 ứng với 19 chủ đề trong `DATA` (màn `i` dùng chủ đề `DATA[i]`), màn 20 là **trùm cuối 🐲 Rồng IELTS Tối Thượng** dùng toàn bộ từ vựng. `LAST = DATA.length` là index của trùm cuối.
- Mở khoá tuần tự: màn `i` mở khi màn `i-1` đã thắng (`unlocked`). Thắng được 1–3 sao theo % máu còn lại (≥70% → 3★, ≥40% → 2★).
- Chỉ số boss tính trong `cfg(i)`: HP `120 + i*20` (trùm cuối 600), sát thương `12 + i*1.2` (trùm cuối 34), thời gian trả lời giảm dần theo màn (`tq` cho quiz/col, `tf` cho điền từ).
- Trận đánh: mỗi câu hỏi random 40% quiz / 30% col / 30% fill. Sát thương theo độ khó `DMG = {quiz:20, col:26, fill:36}`, combo cộng thêm tối đa +50%. Sai / hết giờ / bỏ qua → boss đánh lại; boss dưới 30% HP sẽ "nổi điên" (x1.3 sát thương). Mỗi câu đúng +10 XP.
- **Vật phẩm** (`ITEMS`): 🧪 `potion` hồi 40 HP (50 vàng), 🛡️ `shield` chặn 1 đòn (60), 💡 `half` loại 2 đáp án sai / hiện nửa số chữ (40), 💢 `rage` x2 sát thương đòn đúng kế tiếp (70).
- **Cửa hàng**: mua vật phẩm bằng vàng; "Bùa sinh lực" +15 máu tối đa vĩnh viễn, tối đa cấp 5, giá `120 × (cấp+1)`. Máu người chơi = `100 + hpLv*15`.
- **Rương** sau khi thắng: vàng `25 + i*4 + sao*10 (+30 nếu lần đầu)`, số vật phẩm = số sao (+1 bình máu nếu lần đầu thắng). 3 sao → rương vàng. Thua được 10 vàng an ủi.

### 🔊 Phát âm & phiên âm

- Nút loa `.spk` đọc từ/cụm từ bằng **Web Speech API** (`speechSynthesis`) có sẵn trong trình duyệt: ưu tiên giọng `en-GB`, không có thì lấy giọng tiếng Anh bất kỳ, tốc độ 0.9. Không cần mạng hay thư viện. Trình duyệt không hỗ trợ (`canSpeak = false`) thì nút loa không được render.
- Phiên âm IPA (Anh-Anh, kiểu Oxford Learner's) chỉ có ở **từ đơn**; collocation không có phiên âm nhưng vẫn có nút loa.
- Nơi hiển thị — dùng `termHtml(it)` (từ in đậm + phiên âm + loa):
  - Câu **Quiz Anh→Việt**: loa cạnh từ ở `qMain`, phiên âm ở `qSub`.
  - **Phần đáp án** sau mỗi câu (chế độ thường và Boss) và danh sách **"Từ cần ôn lại"** ở màn kết quả / màn thua.
  - **Không** hiện ở câu Quiz Việt→Anh, Điền từ, Collocation vì sẽ lộ đáp án.
- Một listener `click` chung trên `document` bắt mọi `.spk` (đọc `data-say`). Nút loa không phụ thuộc nút bật/tắt âm thanh hiệu ứng (`st.sound`).
- Trong trận Boss, bấm loa ở phần đáp án sẽ huỷ tự chuyển câu sau 1,8 giây (`B.auto`) để kịp nghe; bấm "Tiếp tục" hoặc Enter để đi tiếp.

### Huy hiệu (`BADGES`)

`first, combo5, combo10, perfect, allmodes, fixer, streak3, streak7, xp500, xp2000, boss1, stars3, dragon` — mở bằng `unlock(id)`.

## Dữ liệu `DATA`

`DATA` (trong `js/data.js`) là mảng **19 chủ đề** (thứ tự hiện tại: Education, Environment, Technology, Health, Work & Career, Travel & Tourism, Crime & Law, City & Society, Friends, National Holidays & Festivals, Home & House, Hobbies & Free Time, Transport & Traffic, Social Welfare, Family, Food & Eating, Media & Advertising, Government, Sports). Mỗi chủ đề hiện có **20 words + 15 cols**.

```js
{name:"🎓 Education",          // emoji + tên tiếng Anh, hiển thị trên chip và bản đồ
 words:[                         // [từ, từ loại, nghĩa tiếng Việt, câu ví dụ, phiên âm IPA]
  ["curriculum","n","chương trình học","The national curriculum includes compulsory science lessons.","/kəˈrɪkjələm/"],
  ...],
 cols:[                          // [cụm từ, nghĩa tiếng Việt, câu ví dụ]
  ["acquire knowledge","tiếp thu kiến thức","Reading widely is one of the best ways to acquire knowledge."],
  ...]}
```

Lúc chạy, `DATA` được làm phẳng thành `ALL`, mỗi mục có dạng
`{id, ti, kind:'word'|'col', term, pos, mean, ex, ipa}` (collocation và word thiếu phiên âm có `ipa = ''`) với `id = ti + 'w' + i` hoặc `ti + 'c' + i` (ví dụ `"3w12"`). `BYID` tra ngược từ id.

### Yêu cầu nội dung

- Câu ví dụ của **word** nên chứa chính từ đó (hoặc dạng biến đổi cùng gốc) để chế độ Điền từ dùng được — `findMatch` tìm theo tiền tố của từ dài hơn 2 ký tự đầu tiên (bỏ `the`, `one's`, `someone's`, `something`, `with`).
- **col** phải có ít nhất một khoảng trắng và một từ "có nghĩa" ngoài stop-word, nếu không sẽ không xuất hiện ở chế độ Collocation.
- Nghĩa tiếng Việt nên ngắn gọn, khác nhau trong cùng chủ đề (đáp án nhiễu so sánh bằng chuỗi).
- Mỗi **word** có phần tử thứ 5 là phiên âm IPA Anh-Anh, có dấu `/.../`, dùng ký hiệu Oxford (`əʊ`, `ɒ`, `ɜː`, `eə`, `(r)` cuối từ). Từ có cách đọc khác nhau theo từ loại thì ghi cả hai, ví dụ `"/ˈɡrædʒuət/ (n), /ˈɡrædʒueɪt/ (v)"`. Thiếu phiên âm thì app vẫn chạy, chỉ không hiện phiên âm.
- Không dùng ký tự `"` chưa escape trong chuỗi JS.

### Cách thêm chủ đề mới

⚠️ **Id từ và tiến độ map đều dựa trên VỊ TRÍ (index)**, nên:

1. **Chỉ thêm chủ đề mới vào CUỐI mảng `DATA`**. Không chèn giữa, không đổi thứ tự, không xoá chủ đề cũ — nếu không, `st.wrong`, `st.topics` và `st.rpg.cleared` của người dùng sẽ trỏ nhầm từ/màn.
2. Tương tự, trong một chủ đề chỉ **thêm từ/collocation vào cuối** `words`/`cols`.
3. Thêm 1 boss mới vào `BOSSES` (`js/boss.js`) **ngay trước** Rồng IELTS (phần tử cuối) — `BOSSES` phải luôn có `DATA.length + 1` phần tử. Mẫu: `{e:'🐸', n:'Tên boss tiếng Việt', l:'Câu thoại khiêu khích'}`.
4. Cập nhật mô tả "20 màn" trong nút `#advBtn` (`index.html`) và CLAUDE.md.
5. Lưu ý: thêm chủ đề làm trùm cuối dời sang index mới. Ví dụ ai đã thắng trùm cuối khi còn 17 chủ đề có `st.rpg.cleared[17]`; sau khi thêm Government (index 17) và Sports (index 18), giá trị đó được hiểu là đã thắng màn Government, còn trùm cuối chuyển sang index 19 (cần thắng lại). Chấp nhận được, nhưng cần biết.

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

Key phụ `ielts-vocab-arena-owner`: uid của tài khoản sở hữu tiến độ đang nằm trong máy (không có = khách).

## Đăng nhập & đồng bộ (Firebase)

- **Không bắt buộc.** Mặc định là chế độ khách, chỉ lưu `localStorage`. Ô `#acct` chỉ hiện khi `FIREBASE_CONFIG` khác `null` **và** trang mở qua http(s); mở bằng `file://` hoặc mất mạng thì app vẫn chạy như khách.
- Chỉ đăng nhập bằng **Google** (`signInWithPopup`, popup bị chặn thì chuyển sang `signInWithRedirect`).
- Dữ liệu trên mây: document `users/{uid}` = `{data: JSON.stringify(st), xp, updatedAt}`. `firestore.rules` chỉ cho chính chủ đọc/ghi, chỉ chấp nhận đúng 3 trường đó, `data` là chuỗi < 200 KB.
- **Khi đăng nhập / mở app đang đăng nhập** (`pullAndMerge`): tải bản trên mây, gộp với tiến độ trong máy bằng `mergeSt` rồi tải lên nếu khác. Nếu kết quả khác `st` hiện tại thì ghi vào `localStorage` và **tải lại trang** (để `sel`, `st.rpg`… khởi tạo lại sạch sẽ).
  - `mergeSt` dùng max/hợp: XP, best, fixed, vàng, cấp máu, số vật phẩm, số sao từng màn lấy max; huy hiệu, modes, từ hay sai lấy hợp; streak lấy theo ngày `last` mới hơn; `sound`, `topics` lấy theo máy đang dùng. Gộp lại lần nữa không đổi gì (nên không bị vòng lặp reload, không nhân đôi vàng).
  - Tiến độ trong máy chỉ được gộp nếu là của khách hoặc của chính tài khoản đó (`OWNER_KEY`); tiến độ của tài khoản khác thì bỏ qua và lấy bản trên mây.
- **Khi đang đăng nhập**: `save()` gọi `onSaved` → `queueUpload` (gom 2 giây rồi tải lên); khi tab bị ẩn thì tải lên ngay.
- **Đăng xuất**: tải lên lần cuối, rồi xoá tiến độ trong máy và tải lại → máy trở về khách mới (tránh người sau thấy/gộp nhầm tiến độ).
- So sánh tiến độ dùng `canon()` (sắp xếp key và mảng) thay vì `JSON.stringify` thường.

## Quy ước code

- JS thuần, không framework, không module, không build. Biến toàn cục: `st` (lưu trữ), `G` (lượt chơi thường), `B` (trận Boss), `sel`/`useWrong` (chọn chủ đề), `poolOverride` (Boss ghi đè nguồn câu hỏi).
- Phong cách **rất cô đọng**: arrow function, nhiều câu lệnh trên một dòng, tên ngắn (`st`, `q`, `it`, `c`, `r`). Giữ nguyên phong cách này khi sửa; không tự ý format lại cả file.
- `$(id)` = `document.getElementById`. Render bằng template string + `innerHTML`; **mọi dữ liệu đưa vào HTML phải qua `esc()`**.
- Sự kiện gắn bằng `el.onclick = ...` / event delegation trên container (`#chips`, `#opts`, `#stages`, `#shop`, `#items`, `#acct`).
- Thay đổi cấu trúc `st` phải cập nhật cả `mergeSt` trong `sync.js` (trường mới chưa có quy tắc gộp sẽ lấy theo bản trên mây).
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
  ALL.filter(x=>x.kind==='word'&&!x.ipa).map(x=>x.term)                     // word thiếu phiên âm
  BOSSES.length === DATA.length + 1                                          // phải là true
  ```
- Reset tiến độ: `localStorage.removeItem('ielts-vocab-arena-v1')` rồi tải lại.
- Thử đăng nhập: phải chạy qua `http://localhost` (ví dụ `npx firebase-tools serve` hoặc `python -m http.server`), `localhost` có sẵn trong Authorized domains của Firebase. Kiểm tra: đăng nhập → ô tài khoản báo "✅ Đã đồng bộ"; chơi 1 lượt → xem document `users/{uid}` trên Firebase console cập nhật; mở trình duyệt khác đăng nhập cùng tài khoản → thấy cùng tiến độ; đăng xuất → về khách 0 XP.

## Deploy (Firebase Hosting)

- Link miễn phí: `https://<project-id>.web.app` (và `.firebaseapp.com`).
- Lần đầu: `npx firebase-tools login` (người dùng tự chạy, cần trình duyệt), tạo `.firebaserc` với `{"projects":{"default":"<project-id>"}}`.
- Deploy: `npx firebase-tools deploy --only hosting,firestore:rules`.
- `firebase.json` deploy cả thư mục gốc, trừ `archive/`, `CLAUDE.md`, file ẩn và file cấu hình Firebase. HTML/JS/CSS gửi kèm `Cache-Control: no-cache` để người dùng luôn nhận bản mới.
- Trước khi public: thay `EMAIL_LIEN_HE` trong `privacy.html`.

## Git

- Remote: `https://github.com/hoangthh810/IELTS-VOCAB-GAMES.git`, nhánh `main`.
- Commit đầu tiên chứa file gốc chưa sửa — dùng làm mốc để quay lại. Bản gốc cũng được giữ ở `archive/ielts-vocab-games.html`.
