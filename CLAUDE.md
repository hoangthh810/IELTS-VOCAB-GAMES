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
js/decks.js         Bộ từ tự nhập: đọc file/dán bảng, màn #decks, gắn từ vào ALL/BYID
js/questions.js     pool(), makeQuiz / makeFill / makeCol
js/practice.js      Trang chủ (chọn chủ đề) + chế độ luyện tập thường (cả lượt ôn bằng câu hỏi)
js/srs.js           Ôn tập ngắt quãng (Leitner) + flashcard
js/scene.js         Cảnh đánh boss 2D trên canvas (bối cảnh + quái cho cả 20 màn)
js/boss.js          Phiêu lưu đánh Boss
js/firebase-config.js  const FIREBASE_CONFIG (null = tắt đăng nhập/đồng bộ)
js/board.js         Bảng xếp hạng (Firestore leaderboard)
js/remind.js        Nhắc học mỗi ngày trên lịch (link Google Calendar / file .ics)
js/sync.js          Đăng nhập Google + đồng bộ tiến độ lên Firestore (tuỳ chọn)
js/main.js          renderHome(); initSync() — khởi động app
privacy.html        Trang chính sách quyền riêng tư (link ở footer trang chủ)
icon.svg            Logo mặt mèo (favicon + logo đầu trang chủ)
firebase.json       Cấu hình Firebase Hosting + đường dẫn rules
firestore.rules     Quy tắc bảo mật Firestore
archive/ielts-vocab-games.html   Bản gốc một-file, chỉ để đối chiếu, KHÔNG sửa
```

| File | Nội dung chính |
|---|---|
| `index.html` | Các màn hình `.screen` — `#home`, `#decks` (bộ từ của tôi), `#cards` (flashcard), `#board` (xếp hạng), `#game`, `#result`, `#map`, `#battle`, `#victory`, `#defeat` + `#toast`, `#flash` |
| `css/style.css` | Biến màu ở `:root` (sáng/tối theo `prefers-color-scheme` và `data-theme`), CSS cho home, game, result, phần Boss (từ comment `/* ===== boss adventure ===== */`) |
| `js/data.js` | `const DATA = [...]` |
| `js/core.js` | Dữ liệu dẫn xuất (`ALL`, `BYID`), helper (`esc`, `shuffle`, `pick`, `$`, `findMatch`, `hlEx`), storage (`KEY`, `st`, `save`, `dayKey`, `yesterday`, `liveStreak`), phát âm (`speak`, `spk`, `ipaTag`, `termHtml`), `BADGES`/`unlock`, hiệu ứng (`toast`, `confetti`, `plus`), âm thanh tiếng mèo `beep(kind)` (`CAT` gồm `ok`/`no`/`badge`/`end`, tạo bằng WebAudio qua `meow`/`purr`, không có file âm thanh), chuyển màn `show` |
| `js/decks.js` | `CORE_N`, `DECK_MAX`, `ST_MAX`, `isDeck`, `liveDecks`, `topicKeys`, `topicName`, `loadDecks`, `parseDeck`/`csvRow`/`guessSep`, `readText`, `download`/`toCsv`, `openDecks`, `renderDecks`, `previewImport`, `saveImport`, `deleteDeck` |
| `js/questions.js` | `STOP`, `colTokens`, `canFill`/`canCol`/`poolTypes` (dạng câu mà một nguồn từ làm được), `poolOverride`, `pool`, `choose`, `makeQuiz`, `makeFill`, `makeCol` (dùng chung cho chế độ thường và Boss) |
| `js/practice.js` | `sel`, `useWrong`, `renderChips`, `renderHome`, nút âm thanh; `LEN`, `G`, `start`, `next`, `answer`, `finish`, phím tắt |
| `js/scene.js` | `sceneStart`, sự kiện `sceneHeroAttack/BossAttack/Heal/BossDie/HeroDie`, vòng lặp vẽ, hạt, đạn, HUD; `pose` (chuyển động chung của quái), `drawHero`; `WORLDS` (bối cảnh: `school`, `city`, `ocean`, `castle`) và `KINDS` (quái: `owl`, `book`, `slime`, `golem`, `jelly`, `octo`, `whelp`, `dragon`) |
| `js/boss.js` | `BOSSES`, `ITEMS`, `DMG`, `RPG0`, `cfg`, map, shop, battle (`B`), item, victory/chest, defeat, phím tắt; đấu trường `startArena`, `leaveBattle` |
| `js/srs.js` | `SRS_DAYS`, `srsGrade`, `srsDue`, `srsStats`, `srsSession`, `srsType`, `renderSrs`; flashcard: `C`, `startCards`, `showCard`, `flipCard`, `gradeCard`, `endCards` |
| `js/board.js` | `lbOn`, `lbName`, `lbUpload`, `openBoard`, `renderBoard` |
| `js/remind.js` | `gcalUrl`, `icsFile`, `renderRemind` |
| `js/sync.js` | `initSync`, `mergeSt`, `pullAndMerge`, `queueUpload`/`flushUpload`, `signIn`/`signOut`, `renderAcct` (ô `#acct` trên trang chủ) |
| `js/main.js` | `renderHome(); initSync();` |

### Cách các file JS liên kết

- Dùng `<script src>` **thường** (không `type="module"`, không build tool) để mở được bằng double-click `index.html` qua `file://`. ES module và `fetch` file JSON bị chặn trên `file://`, nên **không** dùng.
- Mọi `const`/`let`/`function` khai báo ở top-level đều là biến toàn cục dùng chung giữa các file.
- **Thứ tự nạp trong `index.html` là bắt buộc**: `data → firebase-config → core → decks → questions → practice → srs → scene → boss → sync → board → remind → main`. Code chạy ngay khi nạp (top-level) chỉ được dùng thứ đã khai báo ở file trước, ví dụ `core.js` cần `DATA`, `practice.js` cần `st`, `boss.js` gán `st.rpg`. Tham chiếu "ngược" (ví dụ `pool()` trong `questions.js` dùng `sel`/`useWrong` của `practice.js`, `unlock` gọi `renderHome`) chỉ hợp lệ vì nằm trong thân hàm, chạy sau khi mọi file đã nạp.
- Script đặt cuối `<body>` nên DOM đã sẵn sàng khi gắn sự kiện.
- Không khai báo trùng tên top-level giữa các file (sẽ lỗi `Identifier has already been declared`).

Font Be Vietnam Pro lấy từ Google Fonts. Thư viện JS duy nhất là Firebase SDK bản *compat* (`firebase-app/auth/firestore-compat.js`, phiên bản `FB_VER` trong `sync.js`), được `sync.js` nạp động từ `www.gstatic.com` **chỉ khi** có `FIREBASE_CONFIG` và trang chạy qua http(s).

## Các chế độ chơi

Mỗi lượt chơi thường có **12 câu** (`LEN = 12`), ít hơn nếu nguồn từ có ít hơn 12 từ dùng được cho chế độ đó (bộ tự nhập nhỏ, kho từ hay sai). Câu hỏi lấy từ `pool()`: các chủ đề (kể cả bộ tự nhập) đang chọn, hoặc kho "📕 Từ hay sai" nếu bật chip đó. `choose` lặp lại từ trong nguồn khi đã hỏi hết, chỉ mượn từ chủ đề khác khi nguồn không có từ nào dùng được.

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
- Mở khoá tuần tự: màn `i` mở khi màn `i-1` đã thắng (`unlocked`). **Admin** (email trong `ADMINS` ở `js/sync.js`, đăng nhập Google và email đã xác minh) thấy mọi màn mở để chơi thử; tiến độ lưu không bị đổi. Chỉ là tiện ích kiểm thử phía trình duyệt, không phải cơ chế bảo mật. Thắng được 1–3 sao theo % máu còn lại (≥70% → 3★, ≥40% → 2★).
- **Chương**: mỗi chương 5 màn thường đánh cùng một loại quái + 1 màn **👑 BOSS** (`boss:true` trong `BOSSES`): chương 1 lớp học 🦉→📖 (màn 1–6), chương 2 thành phố 🟢→🗿 (7–12), chương 3 đáy biển 🪼→🐙 (13–18), chương 4 lâu đài 🐉 (19) → 🐲 trùm cuối (20). Mỗi phần tử `BOSSES` có `e` (emoji trên bản đồ), `n` (tên), `l` (câu khiêu khích theo chủ đề màn), `k` (loại quái trong `KINDS`), `w` (bối cảnh trong `WORLDS`).
- Chỉ số tính trong `cfg(i)`: HP `120 + i*20`, sát thương `12 + i*1.2`; màn BOSS nhân HP ×1,5 và sát thương ×1,2; trùm cuối 900 HP, sát thương 40; thời gian trả lời giảm dần theo màn (`tq` cho quiz/col, `tf` cho điền từ).
- Trận đánh: mỗi câu hỏi random 40% quiz / 30% col / 30% fill. Sát thương theo độ khó `DMG = {quiz:20, col:26, fill:36}`, combo cộng thêm tối đa +50%. Sai / hết giờ / bỏ qua → boss đánh lại; boss dưới 30% HP sẽ "nổi điên" (x1.3 sát thương). Mỗi câu đúng +10 XP.
- **Vật phẩm** (`ITEMS`): 🧪 `potion` hồi 40 HP (50 vàng), 🛡️ `shield` chặn 1 đòn (60), 💡 `half` loại 2 đáp án sai / hiện nửa số chữ (40), 💢 `rage` x2 sát thương đòn đúng kế tiếp (70).
- **Cửa hàng**: mua vật phẩm bằng vàng; "Bùa sinh lực" +15 máu tối đa vĩnh viễn, tối đa cấp 5, giá `120 × (cấp+1)`. Máu người chơi = `100 + hpLv*15`.
- **🏟️ Đấu trường luyện tập** (`startArena(did)`, nút trên bản đồ và nút "⚔️ Đấu" ở màn bộ từ): đánh quái bằng một bộ tự nhập. Ngoại hình lấy ngẫu nhiên từ `BOSSES` (trừ trùm cuối), độ khó theo số từ (`lv = min(18, floor(số từ / 8))`), câu khiêu khích trong `ARENA_LINES`, bảng đen lớp học hiện từ của bộ (`B.c.board`). Cấu hình trận có `arena` (id bộ) và `pool`. Thắng: XP như thường, vàng `10 + sao*5`, **không** vật phẩm, **không** ghi `cleared`, không mở huy hiệu boss; thua: không có vàng an ủi. Nút quay lại về màn bộ từ (`leaveBattle`).
- **Rương** sau khi thắng: vàng `25 + i*4 + sao*10 (+30 nếu lần đầu, +40 nếu là màn BOSS)`, số vật phẩm = số sao (+1 bình máu nếu lần đầu thắng). 3 sao → rương vàng. Thua được 10 vàng an ủi.

### 🔊 Phát âm & phiên âm

- Nút loa `.spk` đọc từ/cụm từ bằng **Web Speech API** (`speechSynthesis`) có sẵn trong trình duyệt: ưu tiên giọng `en-GB`, không có thì lấy giọng tiếng Anh bất kỳ, tốc độ 0.9. Không cần mạng hay thư viện. Trình duyệt không hỗ trợ (`canSpeak = false`) thì nút loa không được render.
- Phiên âm IPA (Anh-Anh, kiểu Oxford Learner's) chỉ có ở **từ đơn**; collocation không có phiên âm nhưng vẫn có nút loa.
- Nơi hiển thị — dùng `termHtml(it)` (từ in đậm + phiên âm + loa):
  - Câu **Quiz Anh→Việt**: loa cạnh từ ở `qMain`, phiên âm ở `qSub`.
  - **Phần đáp án** sau mỗi câu (chế độ thường và Boss) và danh sách **"Từ cần ôn lại"** ở màn kết quả / màn thua.
  - **Không** hiện ở câu Quiz Việt→Anh, Điền từ, Collocation vì sẽ lộ đáp án.
- Một listener `click` chung trên `document` bắt mọi `.spk` (đọc `data-say`). Nút loa không phụ thuộc nút bật/tắt âm thanh hiệu ứng (`st.sound`).
- Trong trận Boss, bấm loa ở phần đáp án sẽ huỷ tự chuyển câu sau 1,8 giây (`B.auto`) để kịp nghe; bấm "Tiếp tục" hoặc Enter để đi tiếp.

### 🎬 Cảnh đánh boss 2D

- Mọi màn đều vẽ trên canvas 2D (`js/scene.js`): bối cảnh lấy theo `BOSSES[i].w` trong `WORLDS`, quái theo `BOSSES[i].k` trong `KINDS`. Thiếu một trong hai thì tự quay về khung emoji cũ.
- Tất cả hình vẽ bằng code, không có file ảnh. Kích thước logic 640×320 (`SW`,`SH`), mặt đất `GY`, nhân vật ở `HX`, quái ở `BX`; canvas nhân `devicePixelRatio` (tối đa 2). Bảng đen lớp học hiện từ vựng của chủ đề màn đó.
- `sceneStart(i)` được gọi trong `startBattle`; bật class `.arena.scene` (ẩn emoji và dòng máu DOM, **ghim khung ở đầu màn hình** bằng `position:sticky` để khi trang cuộn xuống phần đáp án vẫn thấy hoạt ảnh). Thanh máu, tên quái (kèm nhãn 👑 BOSS / 🐲 TRÙM CUỐI), lời thoại được vẽ trên canvas (`drawHud`). Vòng `requestAnimationFrame` tự dừng khi rời màn `#battle`.
- `boss.js` gọi cảnh qua các hàm `scene*` khi `SC` khác null; khi null thì dùng lại `floatAt`/`anim` cũ. Có cảnh thì quái chết sau 650ms (đợi đạn trúng), màn thắng sau 2,3s, màn thua sau 2s.
- Đòn đúng bắn **chính từ tiếng Anh vừa trả lời** thành đạn phép (tím; combo vàng; thuốc cuồng nộ đỏ). Sai/hết giờ: quái bắn 3 viên theo `shot` của loại (`paper` giấy điểm F, `goo` nhớt, `rock` đá, `zap` tia điện, `ink` mực, `fire` lửa). Khiên: bong bóng xanh chặn đạn. Dưới 30% máu: đỏ lên, mắt đỏ, bốc hơi, viền đỏ.
- `pose()` lo chuyển động chung (bay vào, lơ lửng, lao lên khi đánh, giật lùi + chớp sáng khi trúng, xoay thu nhỏ khi chết); hàm `draw` của từng loại chỉ vẽ hình tại gốc toạ độ = chân quái, mặt quay sang trái, dùng `p.atk` (0..1) cho động tác đánh và `p.rage`.
- Trường của `KINDS`: `cy`/`top` (tâm/đỉnh thân, toạ độ y âm), `mx`,`my` (điểm bắn ra), `sp`/`bob`/`lift` (nhịp, biên độ lơ lửng, độ cao), `shadow`, `scale`, `shot`, `pk`/`parts` (kiểu và màu mảnh vỡ). Quái phải vừa khung: đỉnh không chạm thanh máu (y ≥ ~60 trên canvas), không tràn mép phải.
- `prefers-reduced-motion` tắt rung màn hình.
- Thêm loại quái: viết `draw<Tên>(c,s,p)` rồi thêm vào `KINDS`. Thêm bối cảnh: `bg<Tên>(c,i)` (vẽ 1 lần) + `live<Tên>(c,s)` (chi tiết động) rồi thêm vào `WORLDS`.

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
3. Thêm 1 boss mới vào `BOSSES` (`js/boss.js`) **ngay trước** Rồng IELTS (phần tử cuối) — `BOSSES` phải luôn có `DATA.length + 1` phần tử. Mẫu: `{e:'🐉', n:'Rồng Con Hiếu Chiến', k:'whelp', w:'castle', l:'Câu thoại khiêu khích theo chủ đề'}` — chọn `k`/`w` có sẵn, hoặc mở chương mới (5 màn cùng `k` + 1 màn `boss:true`).
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
| `srs` | `{[id]: {b, d, t}}` | Lịch ôn: hộp Leitner 0–7, ngày đến hạn `YYYY-MM-DD`, thời điểm chấm gần nhất (ms) |
| `wk` | `{k, base}` | Tuần ISO hiện tại (`2026W45`) và tổng XP lúc bắt đầu tuần → XP tuần = `xp - base` (`weekKey`, `rollWeek`, `weekXp` trong `core.js`) |
| `lb` | `{name, on, t}` | null | Biệt danh trên bảng xếp hạng, có hiện trên bảng không, thời điểm đổi |
| `decks` | `{[did]: {n, t, items}}` | Bộ từ tự nhập: tên, thời điểm sửa (ms), `items = [[từ, nghĩa, ví dụ, phiên âm, từ loại], ...]`; bộ đã xoá thành `{del:1, t}` |

Streak được cập nhật khi kết thúc lượt chơi thường (`finish`) và khi thắng/thua trận Boss (`touchStreak`). Hiển thị dùng `liveStreak()` (về 0 nếu bỏ quá 1 ngày).

Key phụ `ielts-vocab-arena-theme`: `light`/`dark` nếu người dùng bấm nút 🌙/☀️ (`#themeBtn`), không có = theo hệ thống. Chỉ lưu trên máy, không đồng bộ. Một `<script>` nhỏ trong `<head>` của `index.html` và `privacy.html` đặt `data-theme` trước khi trang vẽ (tránh nháy màu); `renderTheme`/`isDark` trong `practice.js` đổi icon nút và `<meta name=theme-color>`.

Key phụ `ielts-vocab-arena-remind`: giờ nhắc học đã chọn (`HH:MM`), chỉ lưu trên máy.

Key phụ `ielts-vocab-arena-owner`: uid của tài khoản sở hữu tiến độ đang nằm trong máy (không có = khách).

## 📅 Ôn tập ngắt quãng (spaced repetition)

- Hộp Leitner: `SRS_DAYS = [0,1,3,7,14,30,60,120]` ngày. **Mọi** câu trả lời (luyện tập, trận boss, ôn tập, flashcard) gọi `srsGrade(id, g)`: sai/Quên (`g=0`) → hộp 0, đến hạn hôm nay; đúng/Nhớ (`g=1`) +1 hộp; Dễ (`g=2`) +2 hộp. Thẻ chưa đến hạn trả lời đúng thì không tăng hộp (tránh lên hộp nhiều lần trong một ngày). Hộp ≥ 5 tính là "đã thuộc".
- Lượt ôn (`srsSession`): tối đa `SRS_MAX = 20` thẻ đến hạn (hạn sớm nhất, hộp thấp trước), thiếu thì thêm tối đa `SRS_NEW = 10` từ mới của chủ đề đang chọn.
- **Ôn bằng câu hỏi**: `start('srs')` dùng vòng chơi thường với `G.queue`/`G.len`; mỗi câu đặt `poolOverride = [thẻ]` rồi gọi `makeQuiz/makeFill/makeCol` theo `srsType` (word: quiz/điền từ, col: quiz/collocation).
- **Flashcard** (màn `#cards`): mặt trước từ + phiên âm + loa, lật ra nghĩa + ví dụ; chấm Quên/Nhớ/Dễ (nút hiện khoảng ôn tiếp theo). Thẻ Quên được hỏi lại cuối lượt. Nhớ/Dễ +5 XP. Phím: Space lật, 1/2/3 chấm.
- Khu "📅 Ôn tập ngắt quãng" trên trang chủ (`renderSrs`, gọi trong `renderHome`) hiện số thẻ đến hạn / đang học / đã thuộc.

## 📁 Bộ từ tự nhập

- Màn `#decks`, mở bằng thẻ `#deckBtn` ở mục riêng "📁 Bộ từ của riêng bạn" trên trang chủ (ngay trước "1. Chọn chủ đề"; `renderHome` ghi số bộ/số từ vào `#deckSub`). Nhập bằng cách dán vào ô văn bản (copy bảng Excel/Google Sheets, xuất Quizlet đều ngăn cách bằng Tab) hoặc chọn file `.csv`/`.txt`. File đọc bằng UTF-8, lỗi thì thử `windows-1258` (CSV của Excel trên Windows tiếng Việt). `.xlsx` không đọc được, báo người dùng lưu thành CSV UTF-8. Có file mẫu (`SAMPLE`) và nút tải bộ từ về dạng CSV (có BOM để Excel mở đúng tiếng Việt).
- Nút **✖ Huỷ** (`clearImport`) bỏ phần đang nhập chưa lưu; bộ đã lưu thì xoá bằng nút 🗑️ Xoá. Khung "🤖 Nhờ AI định dạng giúp" có `AI_PROMPT` + nút copy: người dùng dán prompt kèm file vào ChatGPT/Gemini/Claude, AI trả về các dòng `từ | nghĩa | ví dụ | phiên âm`. Sửa định dạng nhập thì sửa cả prompt.
- `parseDeck`: tự chọn ký tự ngăn cách (Tab, `|` (đọc được cả bảng markdown), `;`, `,`, ` - `, `:`, `=`; chọn tay được), CSV có ngoặc kép, bỏ dòng tiêu đề, tự đảo cột nếu cột 1 là tiếng Việt. Cột 1 từ, cột 2 nghĩa, các cột sau tự nhận: `/…/` hoặc `[…]` là phiên âm, `n`/`v`/`adj`… là từ loại, còn lại là câu ví dụ. Bỏ dòng thiếu từ/nghĩa và từ trùng (không phân biệt hoa thường, kể cả với từ đã có trong bộ). Giới hạn độ dài từng trường. Có xem trước trước khi lưu.
- Từ có khoảng trắng là collocation (`kind:'col'`, không hiện phiên âm), còn lại là word. Thiếu câu ví dụ thì vẫn chơi Quiz, flashcard, ôn tập; chế độ Điền từ/Collocation chỉ cho chọn khi nguồn có từ dùng được (`poolTypes`), Hỗn hợp chỉ trộn các dạng làm được.
- **Id**: bộ có id `did` (chuỗi base36), chủ đề là `'u' + did` (giá trị `it.ti`, nằm trong `sel`/`st.topics` cạnh số index của `DATA`), từ là `'u' + did + '.' + index`. Chỉ **thêm vào cuối** `items`, không xoá/chèn từ trong bộ (id dựa trên vị trí). `loadDecks()` xoá rồi gắn lại từ của các bộ vào cuối `ALL` và `BYID` (`ALL.slice(0, CORE_N)` là từ có sẵn; trùm cuối và các màn bản đồ chỉ dùng phần này).
- Xoá bộ: thành `{del:1, t}` (giữ để máy khác không gộp bộ cũ trở lại), xoá luôn `st.srs`/`st.wrong` của bộ đó. Chỗ hiển thị số từ hay sai / thẻ ôn đều lọc theo `BYID` nên id mồ côi không bị đếm.
- Giới hạn: `DECK_MAX = 2000` từ cho mọi bộ; `st` sau khi lưu phải ≤ `ST_MAX = 900000` byte (rules cho phép chuỗi `data` < 950000 ký tự, document Firestore tối đa 1 MiB).
- XP từ bộ tự nhập tính vào bảng xếp hạng như bình thường.

## ⏰ Nhắc học trên lịch

- Không truy cập lịch của người dùng. `remind.js` tạo link Google Calendar (`action=TEMPLATE`, `recur=RRULE:FREQ=DAILY`, `ctz` = múi giờ trình duyệt) hoặc file `.ics` (VEVENT 15 phút lặp mỗi ngày + VALARM đúng giờ, giờ địa phương "floating", gập dòng 75 byte, CRLF). Giờ bắt đầu: hôm nay nếu chưa qua giờ đã chọn, không thì ngày mai.

## 🏆 Bảng xếp hạng

- Chỉ khi đã đăng nhập. Firestore `leaderboard/{uid}` = `{name, xp, w_<YYYYWww>: XP tuần, updatedAt}`; chỉ ghi trường của tuần hiện tại nên tab Tuần là `orderBy('w_<tuần>')` (index một trường tự có, không cần composite index). Tab Tổng là `orderBy('xp')`. Lấy 50 dòng.
- `lbUpload` chạy cùng mỗi lần đồng bộ (`flushUpload`, `pullAndMerge`) và khi mở bảng; tắt "Hiện tôi trên bảng" thì xoá dòng.
- Biệt danh mặc định = từ cuối của tên Google (tên gọi của người Việt), tối đa 20 ký tự; không lưu email/ảnh.
- `firestore.rules`: ai đăng nhập cũng đọc được; chỉ chủ dòng ghi/xoá; đúng các trường `name, xp, updatedAt` + đúng 1 trường `w_YYYYWww`; `xp` là số nguyên 0..10 triệu, không được giảm; XP tuần ≤ tổng XP; `updatedAt` phải là thời gian máy chủ. **Không chống gian lận tuyệt đối**: người rành kỹ thuật vẫn tự ghi XP lớn được (cần Cloud Functions/gói Blaze để kiểm tra phía máy chủ).
- Kiểm thử rules: Firestore Emulator (cần Java 21 cho firebase-tools mới; với Java 17 dùng `firebase-tools@13`, và bỏ biến môi trường `VSCODE_CWD` khi chạy trong VS Code).

## Đăng nhập & đồng bộ (Firebase)

- **Không bắt buộc.** Mặc định là chế độ khách, chỉ lưu `localStorage`. Ô `#acct` chỉ hiện khi `FIREBASE_CONFIG` khác `null` **và** trang mở qua http(s); mở bằng `file://` hoặc mất mạng thì app vẫn chạy như khách.
- Chỉ đăng nhập bằng **Google** (`signInWithPopup`, popup bị chặn thì chuyển sang `signInWithRedirect`).
- Dữ liệu trên mây: document `users/{uid}` = `{data: JSON.stringify(st), xp, updatedAt}`. `firestore.rules` chỉ cho chính chủ đọc/ghi, chỉ chấp nhận đúng 3 trường đó, `data` là chuỗi < 950000 ký tự.
- **Khi đăng nhập / mở app đang đăng nhập** (`pullAndMerge`): tải bản trên mây, gộp với tiến độ trong máy bằng `mergeSt` rồi tải lên nếu khác. Nếu kết quả khác `st` hiện tại thì ghi vào `localStorage` và **tải lại trang** (để `sel`, `st.rpg`… khởi tạo lại sạch sẽ).
  - `mergeSt` dùng max/hợp: XP, best, fixed, vàng, cấp máu, số vật phẩm, số sao từng màn lấy max; huy hiệu, modes, từ hay sai lấy hợp; bộ từ lấy bản có `t` mới hơn của từng bộ (bộ đã xoá thắng nếu xoá sau), rồi bỏ `srs`/`wrong` của bộ đã xoá; streak lấy theo ngày `last` mới hơn; `sound`, `topics` lấy theo máy đang dùng. Gộp lại lần nữa không đổi gì (nên không bị vòng lặp reload, không nhân đôi vàng).
  - Tiến độ trong máy chỉ được gộp nếu là của khách hoặc của chính tài khoản đó (`OWNER_KEY`); tiến độ của tài khoản khác thì bỏ qua và lấy bản trên mây.
- **Khi đang đăng nhập**: `save()` gọi `onSaved` → `queueUpload` (gom 2 giây rồi tải lên); khi tab bị ẩn thì tải lên ngay.
- **Đăng xuất**: tải lên lần cuối, rồi xoá tiến độ trong máy và tải lại → máy trở về khách mới (tránh người sau thấy/gộp nhầm tiến độ).
- So sánh tiến độ dùng `canon()` (sắp xếp key và mảng) thay vì `JSON.stringify` thường.

## Quy ước code

- JS thuần, không framework, không module, không build. Biến toàn cục: `st` (lưu trữ), `G` (lượt chơi thường), `B` (trận Boss), `sel`/`useWrong` (chọn chủ đề), `poolOverride` (Boss ghi đè nguồn câu hỏi).
- Phong cách **rất cô đọng**: arrow function, nhiều câu lệnh trên một dòng, tên ngắn (`st`, `q`, `it`, `c`, `r`). Giữ nguyên phong cách này khi sửa; không tự ý format lại cả file.
- `$(id)` = `document.getElementById`. Render bằng template string + `innerHTML`; **mọi dữ liệu đưa vào HTML phải qua `esc()`**.
- Sự kiện gắn bằng `el.onclick = ...` / event delegation trên container (`#chips`, `#opts`, `#stages`, `#shop`, `#items`, `#acct`).
- Thay đổi cấu trúc `st` nên thêm quy tắc gộp trong `mergeSt` (`sync.js`). Trường chưa có quy tắc: lấy bản trên mây, và nếu bản trên mây chưa có trường đó thì lấy của máy (dòng `for(const k in b)…`, chống vòng lặp tải lại trang sau khi cập nhật app).
- Chia khu bằng comment `// ---------- tên ----------` và `// ================= BOSS ADVENTURE =================`.
- Code mới đặt vào đúng file theo trách nhiệm (bảng ở trên). Thêm file JS mới thì thêm thẻ `<script src>` vào `index.html` đúng vị trí trong thứ tự nạp.
- **Giao diện "quán cà phê mèo"**: logo mèo (`icon.svg`, ảnh `.brand-ic` ở header), nền kem có hoạ tiết dấu chân mèo (`--paw`, ảnh SVG nhúng), màu chính cam (`--accent`). Chế độ tối nền nâu đen ấm, cam sáng.
- CSS dùng biến màu ở `:root`; màu mới phải khai báo cho cả chế độ sáng và tối (cả block `prefers-color-scheme: dark` lẫn `[data-theme="dark"]`, hai block này giống hệt nhau). Biến: `--bg`, `--card`, `--card2` (nền phụ trong thẻ), `--ink`, `--muted`, `--line`, `--accent`/`--accent-soft`/`--accent-ink` (chữ màu cam trên nền nhạt), `--on-accent` (chữ trên nền màu đặc: trắng ở chế độ sáng, nâu đậm ở chế độ tối — **không** viết `color:#fff` cho nút màu), `--pink`, `--yellow`/`--yellow-soft`/`--yellow-ink`, `--good*`, `--bad*`, `--shadow` (bóng mềm của thẻ), `--press` (gờ dưới kiểu nút bấm 3D), `--paw`.
- Kiểm tra giao diện ở 360/375px và ~1024px, cả sáng lẫn tối: không phần tử nào tràn ngang (`document.documentElement.scrollWidth` ≤ chiều rộng màn hình).
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
  7. Bộ từ: nhập vài dòng (dán từ Excel và file CSV), chọn chip bộ đó chơi Quiz/Hỗn hợp, flashcard, ⚔️ Đấu; xoá bộ → chip, số từ hay sai, thẻ ôn biến mất.
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
- **Tự động (GitHub Actions)**: push lên `main` → `.github/workflows/firebase-hosting-merge.yml` deploy **hosting** lên kênh live (~1 phút). Mở Pull Request → `firebase-hosting-pull-request.yml` tạo link xem trước tạm thời và comment vào PR. Dùng secret `FIREBASE_SERVICE_ACCOUNT_IELTS_VOCAB_B4905` trong repo GitHub. Không có bước build/`npm ci` (app không có `package.json`).
- Workflow **không** deploy `firestore.rules`. Sửa rules thì chạy tay: `npx firebase-tools deploy --only firestore:rules`.
- Deploy tay toàn bộ: `npx firebase-tools deploy --only hosting,firestore:rules`.
- `firebase.json` deploy cả thư mục gốc, trừ `archive/`, `CLAUDE.md`, `skills-lock.json`, mọi file/thư mục bắt đầu bằng dấu chấm (`**/.*` và `**/.*/**` — cần cả hai, nếu không `.git/` sẽ bị tải lên) và file cấu hình Firebase. File mới không phải của web đặt ở gốc repo thì phải thêm vào `ignore`. HTML/JS/CSS gửi kèm `Cache-Control: no-cache` để người dùng luôn nhận bản mới.
- Project: `ielts-vocab-b4905` → https://ielts-vocab-b4905.web.app

## Git

- Remote: `https://github.com/hoangthh810/IELTS-VOCAB-GAMES.git`, nhánh `main`.
- Commit đầu tiên chứa file gốc chưa sửa — dùng làm mốc để quay lại. Bản gốc cũng được giữ ở `archive/ielts-vocab-games.html`.
