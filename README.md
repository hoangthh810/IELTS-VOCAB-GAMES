# 🐱 Vocab Arena

Web game học từ vựng IELTS (mục tiêu **band 9.0**) cho người Việt, chủ đề quán cà phê mèo 🐾.

👉 Chơi ngay: **https://ielts-vocab-b4905.web.app**

- 19 chủ đề IELTS, **570 từ** (190 từ nâng cao có nhãn **C1/C2**) và **285 collocation**, kèm nghĩa tiếng Việt, câu ví dụ, phiên âm, từ đồng nghĩa.
- Không cần cài đặt hay tạo tài khoản, chạy được trên điện thoại và máy tính.

## Bắt đầu trong 1 phút

1. **Chọn chủ đề** ở mục "1. Chọn chủ đề" (Education, Environment…).
2. **Chọn trò chơi**: 🎯 Quiz nghĩa, ✍️ Điền từ, 🧩 Collocation, 🔁 Đồng nghĩa hoặc 🌀 Hỗn hợp. Mỗi lượt 12 câu, 15 giây mỗi câu.
3. Trả lời đúng liên tiếp để tăng combo. Từ trả lời sai vào **📕 Từ hay sai** và lịch ôn tập để học lại.
4. Học mỗi ngày để giữ 🔥 chuỗi ngày, làm 🎯 nhiệm vụ để kiếm vàng.

## Các tính năng

| Tính năng | Dùng để làm gì |
|---|---|
| 🔥 Chuỗi ngày học | Học mỗi ngày để mèo "tung chưởng"; 🧊 Bùa giữ chuỗi (150 vàng, tối đa 2) tự cứu chuỗi khi lỡ 1 ngày |
| 🐾 Mèo cưng | Học càng nhiều mèo càng vui; cho mèo ăn bằng vàng; học đủ ngày để mèo lên cấp |
| 🎯 Nhiệm vụ hôm nay | 3 nhiệm vụ mỗi ngày, xong được thưởng vàng |
| 📅 Ôn tập ngắt quãng | Ôn đúng lúc sắp quên, bằng câu hỏi hoặc flashcard |
| ⚔️ Phiêu lưu đánh Boss | 20 màn, trả lời đúng để tấn công, nhận vàng và vật phẩm, trùm cuối Rồng IELTS 🐲 |
| 🎀 Tủ đồ & nhân vật | Dùng vàng mua đồ và nhân vật mới: mèo, cún, thỏ, cáo, gấu trúc, rồng |
| 📁 Bộ từ của riêng bạn | Dán từ Excel / Quizlet hoặc nhờ AI định dạng, tối đa 2000 từ |
| 🎧 Nghe & viết | Nghe từ rồi gõ lại, chọn giọng Anh-Anh, Anh-Mỹ, Anh-Úc… |
| 🎤 Luyện nói | Đọc to, máy chấm phát âm (cần micro, dùng Chrome hoặc Edge) |
| 📊 Thống kê | XP mỗi ngày, lịch học, tiến độ từng chủ đề, từ hay sai nhất |
| 🏆 Xếp hạng | Thi đua XP tuần và tổng XP (cần đăng nhập) |
| ⚔️ Thách bạn bè | Gửi link để bạn bè chơi cùng đề và so điểm |

## Lưu tiến độ

- Tiến độ tự lưu trên trình duyệt đang dùng.
- **Đăng nhập Google** (ô ở đầu trang chủ) để đồng bộ và học tiếp trên máy khác. Vàng, vật phẩm, đồ đã mua được gộp đúng giữa các máy.
- Xoá dữ liệu trình duyệt khi chưa đăng nhập sẽ mất tiến độ.

## Mẹo

- Phím tắt: `1–4` chọn đáp án, `Enter` sang câu tiếp; flashcard: `Space` lật thẻ, `1/2/3` chấm.
- Bấm 🌙 / ☀️ ở góc trên để đổi giao diện sáng / tối.
- Không thấy bản mới? Nhấn `Ctrl + F5`.

## Dành cho người phát triển

Web tĩnh bằng HTML/CSS/JS thuần, không framework, không build:

```bash
python -m http.server     # rồi mở http://localhost:8000
```

(hoặc mở thẳng `index.html`; đăng nhập Google chỉ chạy qua http/https)

```
index.html      các màn hình của app
css/style.css   toàn bộ giao diện (sáng / tối)
js/data.js      từ vựng 19 chủ đề      js/syn.js   từ đồng nghĩa
js/*.js         mỗi file một tính năng (practice, boss, closet, quests, stats…)
```

Push lên nhánh `main` sẽ tự deploy lên Firebase Hosting qua GitHub Actions. Quy ước code, cấu trúc dữ liệu và cách thêm chủ đề xem [CLAUDE.md](CLAUDE.md).
