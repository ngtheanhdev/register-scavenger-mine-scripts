# Script Đăng Ký Địa Chỉ Midnight

Script **độc lập** để đăng ký địa chỉ ví Cardano với Midnight Scavenger API.

**Không phụ thuộc vào ứng dụng chính** - chạy hoàn toàn độc lập!

## 📋 Yêu Cầu

- Node.js phiên bản 20.x trở lên
- Cụm từ khôi phục (seed phrase) của ví Cardano (15 hoặc 24 từ)
- Kết nối internet

## 🚀 Hướng Dẫn Nhanh

### Bước 1: Tải và Chuẩn Bị Thư Mục

**Cách 1: Nếu bạn đã có mã nguồn**
1. Mở File Explorer
2. Tìm đến thư mục `scripts` trong dự án
3. Click vào thanh địa chỉ (address bar) phía trên
4. Gõ `cmd` và nhấn Enter
5. Terminal sẽ mở ra ngay tại thư mục này

**Cách 2: Nếu bạn cần tải về**
```bash
# Clone repository
git clone [URL-repository]

# Di chuyển vào thư mục scripts
cd scavenger-mine/scripts
```

### Bước 2: Cài Đặt (Chỉ Cần Làm 1 Lần)

```bash
npm install
```

Lệnh này sẽ cài đặt:
- `lucid-cardano` - Thư viện làm việc với ví
- `axios` - Thư viện gọi API

### Bước 3: Chuẩn Bị File Cấu Hình

**Cách 1: Sử Dụng Script Chuyển Đổi (Khuyến Nghị cho Nhiều Ví)**

Nếu bạn có nhiều seed phrase được tổ chức theo PC, bạn có thể sử dụng script chuyển đổi tự động:

1. Tạo file `seed.txt` trong thư mục scripts với cấu trúc sau:
   ```
   Work-Chrome
   1. word1
   2. word2
   3. word3
   4. word4
   5. word5
   6. word6
   7. word7
   8. word8
   9. word9
   10. word10
   11. word11
   12. word12
   13. word13
   14. word14
   15. word15
   =====================
   Work-FPT
   1. word1
   2. word2
   3. word3
   ...
   15. word15
   =====================
   ```

   **Lưu ý:** Mỗi từ (word) của seed phrase trên một dòng riêng biệt

2. Chạy script chuyển đổi:
   ```bash
   npm run convert
   ```

3. Script sẽ tự động tạo file `wallet-input.json` với:
   - Tự động kết hợp các từ thành cụm seed phrase hoàn chỉnh
   - Mặc định 10 địa chỉ cho mỗi seed phrase
   - Tên ví sử dụng tên bạn đặt (ví dụ: "Work-Chrome", "Work-FPT")
   - Hỗ trợ 12, 15, 18, 21, hoặc 24 từ
   - Bỏ qua các dòng có `seed_x` (placeholder)

**Cách 2: Tạo File Thủ Công**

1. Mở thư mục `scripts`, bạn sẽ thấy file `wallet-input.sample.json`
2. **Tạo bản sao** của file này và đặt tên là `wallet-input.json`:
   - Click chuột phải vào file `wallet-input.sample.json`
   - Chọn "Copy"
   - Click chuột phải vào khoảng trống
   - Chọn "Paste"
   - Đổi tên file mới thành `wallet-input.json`

3. **Chỉnh sửa** file `wallet-input.json`:
   - Click đúp vào file để mở (hoặc mở bằng Notepad)
   - Điền thông tin ví của bạn theo mẫu bên dưới
   - Lưu lại (Ctrl+S)

**Định dạng file wallet-input.json:**
```json
{
  "wallets": [
    {
      "name": "Ví Chính",
      "seedPhrase": "cụm từ khôi phục 15 hoặc 24 từ của bạn",
      "addressCount": 40
    },
    {
      "name": "Ví Phụ",
      "seedPhrase": "cụm từ khôi phục khác",
      "addressCount": 20
    }
  ]
}
```

### Bước 4: Chạy Đăng Ký

```bash
npm run register
```

Script sẽ:
- Tạo địa chỉ từ cụm từ khôi phục
- Đăng ký từng địa chỉ với API
- Lưu kết quả vào file `registration-results.json`

### Bước 5: Xuất Danh Sách Địa Chỉ

Sau khi đăng ký thành công, bạn có thể xuất danh sách các địa chỉ đã đăng ký thành công ra file text:

```bash
npm run export
```

Lệnh này sẽ:
- Đọc file `registration-results.json`
- Lọc ra các địa chỉ đã đăng ký thành công
- Lưu vào file `wallets.txt` (mỗi địa chỉ một dòng)

File `wallets.txt` có thể dùng để import vào các công cụ khác.

### Bước 6: Theo Dõi Challenge Submissions (Tùy Chọn)

Sau khi đã có file `wallets.txt`, bạn có thể theo dõi số lượng challenge đã submit cho từng địa chỉ:

```bash
npm run track
```

Lệnh này sẽ:
- Đọc danh sách địa chỉ từ `wallets.txt`
- Lấy thông tin challenge hiện tại từ API
- Lấy số lượng solution và night allocation cho từng địa chỉ
- Lưu kết quả vào file `wallet-tracker.csv`
- Nếu đã chạy trước đó, sẽ thêm cột mới cho ngày hiện tại

**Output:** File `wallet-tracker.csv` chứa:
- Mỗi dòng là một địa chỉ
- Các cột: Day X Solution, Day X Night (X là số ngày)
- Tổng Night allocation cho từng địa chỉ
- Tổng Solution và Total Night ở cuối file

**Lưu ý:** Script này có thể chạy mỗi ngày để tracking tiến trình. Dữ liệu cũ sẽ được giữ lại và merge với dữ liệu mới.

### Bước 7: Xóa File Cấu Hình (Bảo Mật!)

**QUAN TRỌNG:** Sau khi chạy xong, phải xóa file chứa seed phrase ngay lập tức!

1. Mở thư mục `scripts`
2. Tìm file `wallet-input.json`
3. Click chuột phải vào file
4. Chọn "Delete" (hoặc nhấn phím Delete)
5. Xác nhận xóa

**HOẶC** dùng lệnh:
```bash
del wallet-input.json
```

---

## 📁 Các File Trong Thư Mục

```
scripts/
├── package.json                  # Cấu hình dependencies
├── seed-to-wallet-converter.js   # Script chuyển đổi seed.txt -> wallet-input.json
├── register-addresses.js         # Script đăng ký chính
├── export-addresses.js           # Script xuất địa chỉ
├── track-challenges.js           # Script theo dõi challenge submissions
├── seed.txt.sample               # File mẫu cho seed.txt
├── seed.txt                      # File seed phrases của bạn (tạo rồi xóa!)
├── wallet-input.sample.json      # File mẫu
├── wallet-input.json             # File cấu hình của bạn (tạo rồi xóa!)
├── registration-results.json     # Kết quả đăng ký
├── wallets.txt                   # Danh sách địa chỉ (sau khi export)
├── wallet-tracker.csv            # Kết quả tracking (sau khi track)
├── .gitignore                    # Bỏ qua các file nhạy cảm
├── README.md                     # File hướng dẫn này
└── node_modules/                 # Thư viện (sau khi npm install)
```

---

## 🎯 Tính Năng

### Đăng Ký Địa Chỉ
✅ **Hoàn Toàn Độc Lập** - Không cần server Next.js!
✅ **Nhiều Ví** - Đăng ký không giới hạn số lượng ví trong 1 lần chạy
✅ **Hỗ Trợ 15 hoặc 24 Từ** - Cả 2 định dạng seed phrase
✅ **Đặt Tên Tùy Chỉnh** - Gắn nhãn cho từng ví
✅ **Số Lượng Linh Hoạt** - Mỗi ví có thể có số địa chỉ khác nhau
✅ **Theo Dõi Tiến Trình** - Hiển thị real-time trên console
✅ **Xử Lý Lỗi** - Tiếp tục chạy ngay cả khi một số địa chỉ bị lỗi
✅ **Kết Quả Chi Tiết** - File JSON với đầy đủ thông tin

### Quản Lý và Tracking
✅ **Xuất Danh Sách** - Export địa chỉ thành công ra file text
✅ **Theo Dõi Challenge** - Track số lượng solution và night allocation theo ngày
✅ **Lịch Sử Tracking** - Dữ liệu cũ được giữ lại khi track ngày mới
✅ **Export CSV** - Dễ dàng import vào Excel/Google Sheets

---

## 📖 Định Dạng File Cấu Hình

### Một Ví Đơn
```json
{
  "seedPhrase": "cụm từ khôi phục 15 từ của bạn",
  "addressCount": 40
}
```

### Nhiều Ví
```json
{
  "wallets": [
    {
      "name": "Ví 1",
      "seedPhrase": "từ1 từ2 ... từ15",
      "addressCount": 40
    },
    {
      "name": "Ví 2",
      "seedPhrase": "mười lăm từ khác",
      "addressCount": 20
    }
  ]
}
```

**Giải Thích Các Trường:**
- `name` (tùy chọn): Tên gọi cho ví
- `seedPhrase` (bắt buộc): Cụm từ khôi phục BIP39 gồm 15 hoặc 24 từ
- `addressCount` (bắt buộc): Số lượng địa chỉ cần tạo và đăng ký

---

## 📊 File Kết Quả

### registration-results.json

File này chứa toàn bộ thông tin chi tiết về quá trình đăng ký:

```json
{
  "totalWallets": 2,
  "totalAddresses": 60,
  "totalSuccessfulRegistrations": 60,
  "totalFailedRegistrations": 0,
  "completedAt": "2025-11-08T...",
  "wallets": [
    {
      "walletName": "Ví 1",
      "seedPhraseWords": 15,
      "totalAddresses": 40,
      "successfulRegistrations": 40,
      "failedRegistrations": 0,
      "addresses": [
        {
          "index": 0,
          "bech32": "addr1qx...",
          "publicKeyHex": "80bc1e...",
          "registered": true,
          "registrationTime": "2025-11-08T..."
        }
        // ... địa chỉ khác
      ],
      "completedAt": "2025-11-08T..."
    }
    // ... ví khác
  ]
}
```

### wallets.txt

File này được tạo sau khi chạy lệnh export, chứa danh sách các địa chỉ đã đăng ký thành công:

```
addr1qx...
addr1qy...
addr1qz...
...
```

Mỗi dòng là một địa chỉ, dễ dàng copy/paste hoặc import vào công cụ khác.

### wallet-tracker.csv

File này được tạo sau khi chạy lệnh track, chứa lịch sử challenge submissions theo ngày:

```csv
Wallet Address,Day 1 Solution,Day 1 Night,Day 2 Solution,Day 2 Night,Day 3 Solution,Day 3 Night,Total Night per address
addr1qx...,5,125.5,5,125.5,4,100.4,351.4
addr1qy...,5,125.5,5,125.5,5,125.5,376.5
addr1qz...,4,100.4,5,125.5,5,125.5,351.4
...
Total Solution,200,5010,205,5135.5,198,4960.2,15105.7
Total Night,200,5010,205,5135.5,198,4960.2,15105.7
```

**Giải thích:**
- **Mỗi dòng**: Một địa chỉ wallet
- **Day X Solution**: Số lượng challenge đã submit trong ngày X
- **Day X Night**: Night allocation nhận được trong ngày X
- **Total Night per address**: Tổng Night allocation của địa chỉ đó
- **Total Solution**: Tổng số solution của tất cả địa chỉ theo từng cột
- **Total Night**: Tổng Night allocation của tất cả địa chỉ theo từng cột

File này có thể mở bằng Excel, Google Sheets, hoặc bất kỳ công cụ CSV nào.

---

## ⏱️ Hiệu Năng

- **Tạo địa chỉ**: ~0.1 giây/địa chỉ
- **Đăng ký**: ~1.5 giây/địa chỉ (có rate limit)
- **Tracking**: ~0.5 giây/địa chỉ (có rate limit)
- **Ví dụ**:
  - 40 địa chỉ đăng ký = khoảng 1-2 phút
  - 40 địa chỉ tracking = khoảng 20-30 giây

---

## 🔒 Bảo Mật

### ⚠️ CỰC KỲ QUAN TRỌNG

1. **XÓA file `wallet-input.json` ngay sau khi chạy xong!**
   - Vào thư mục scripts
   - Tìm file `wallet-input.json`
   - Click chuột phải > Delete
   - Hoặc dùng lệnh: `del wallet-input.json`

2. **KHÔNG BAO GIỜ commit `wallet-input.json` lên git!**
   - File đã được thêm vào `.gitignore`
   - Chứa seed phrase dạng text thuần
   - Nếu lộ = mất toàn bộ tài sản trong ví

3. **File kết quả AN TOÀN để giữ lại**
   - `registration-results.json` chỉ chứa địa chỉ công khai
   - `wallets.txt` chỉ chứa danh sách địa chỉ
   - Không có private key hay seed phrase

### Thực Hành Tốt

✅ **NÊN:**
- Xóa file input ngay sau khi dùng
- Lưu seed phrase offline (giấy, hardware wallet)
- Backup file `registration-results.json` và `wallets.txt` (an toàn)
- Dùng mật khẩu mạnh để mã hóa

❌ **KHÔNG NÊN:**
- Không bao giờ commit seed phrase lên version control
- Không bao giờ chia sẻ seed phrase
- Không lưu seed phrase trên máy tính lâu dài
- Không chụp màn hình seed phrase

---

## 🐛 Xử Lý Lỗi Thường Gặp

### "Cannot find module 'lucid-cardano'"

**Nguyên nhân:** Chưa cài đặt dependencies

**Cách sửa:**
1. Mở terminal tại thư mục scripts
2. Chạy lệnh: `npm install`
3. Đợi cài đặt xong rồi thử lại

### "Input file not found"

**Nguyên nhân:** Không tìm thấy file `wallet-input.json`

**Cách sửa:**
1. Kiểm tra bạn đang ở đúng thư mục `scripts`
2. Tạo file `wallet-input.json` từ `wallet-input.sample.json`:
   - Copy file mẫu
   - Đổi tên thành `wallet-input.json`
   - Điền seed phrase vào

### "Invalid seed phrase length"

**Nguyên nhân:** Seed phrase không đúng định dạng

**Cách sửa:**
- Phải chính xác 15 hoặc 24 từ
- Các từ cách nhau bằng 1 khoảng trắng
- Không có khoảng trắng thừa ở đầu/cuối
- Ví dụ đúng: `word1 word2 word3 ... word15`

### "Failed to register address"

**Nguyên nhân:** Lỗi kết nối hoặc API

**Cách sửa:**
- Kiểm tra kết nối internet
- API Midnight có thể tạm thời gặp sự cố
- Script sẽ tự động thử lại và tiếp tục với địa chỉ khác

### "Addresses don't match Yoroi"

**Nguyên nhân:** Seed phrase không khớp hoặc sai định dạng

**Cách sửa:**
- Đảm bảo dùng đúng seed phrase
- Địa chỉ đầu tiên (index 0) phải khớp với địa chỉ nhận đầu tiên trong Yoroi
- Yoroi dùng cùng HD derivation path

---

## 🔧 Sử Dụng Nâng Cao

### Chạy Từ Thư Mục Khác

```bash
# Từ thư mục gốc của dự án
cd scripts
npm run register

# Hoặc dùng đường dẫn đầy đủ
node scripts/register-addresses.js
node scripts/export-addresses.js
```

### Tùy Chỉnh Cấu Hình

Chỉnh sửa file `register-addresses.js` để thay đổi:
- `API_BASE`: URL của Midnight API
- `RATE_LIMIT_MS`: Thời gian chờ giữa các lần đăng ký (mặc định 1500ms)

---

## 📝 Ví Dụ Một Phiên Làm Việc

```bash
$ npm install
$ # Tạo file wallet-input.json và điền seed phrase
$ npm run register

═══════════════════════════════════════════════════════════════
  Script Đăng Ký Địa Chỉ Midnight
  Phiên Bản Độc Lập - Không Cần Server
═══════════════════════════════════════════════════════════════

📂 Đọc cấu hình từ: wallet-input.json
✅ Đã tải cấu hình:
   Tổng số ví: 1
   1. Ví Chính: 15 từ, 40 địa chỉ

⏱️  Thời gian ước tính: ~1 phút (40 địa chỉ × 1.5s mỗi địa chỉ)

═══════════════════════════════════════════════════════════════
Đang xử lý: Ví Chính
Seed phrase: 15 từ
Số địa chỉ: 40
═══════════════════════════════════════════════════════════════

📍 Đang tạo 40 địa chỉ...
   ✓ Đã tạo 10/40 địa chỉ
   ✓ Đã tạo 20/40 địa chỉ
   ✓ Đã tạo 30/40 địa chỉ
   ✓ Đã tạo 40/40 địa chỉ
✅ Đã tạo xong 40 địa chỉ

🚀 Đang đăng ký 40 địa chỉ...
   ✅ [1/40] Đã đăng ký: addr1qx...
   ✅ [2/40] Đã đăng ký: addr1qy...
   ...
   ✅ [40/40] Đã đăng ký: addr1qz...

✅ [Ví Chính] Hoàn thành: 40/40 thành công

💾 Đang lưu kết quả vào: registration-results.json
✅ Đã lưu kết quả thành công

═══════════════════════════════════════════════════════════════
  📊 Tổng Kết Đăng Ký
═══════════════════════════════════════════════════════════════
  Tổng số ví:             1
  Tổng số địa chỉ:        40
  ✅ Thành công:          40
  ✗ Thất bại:             0
  Tỷ lệ thành công:       100.0%
═══════════════════════════════════════════════════════════════

⚠️  CẢNH BÁO BẢO MẬT:
   Vui lòng XÓA file wallet-input.json ngay lập tức!
   Seed phrase không bao giờ nên lưu dạng text thuần.

🎉 Tất cả địa chỉ đã được đăng ký thành công!

$ npm run export

═══════════════════════════════════════════════════════════════
  Script Xuất Địa Chỉ
═══════════════════════════════════════════════════════════════

📂 Đọc kết quả từ: registration-results.json
✅ Tìm thấy 40 địa chỉ đã đăng ký thành công

💾 Đang xuất ra: wallets.txt
✅ Đã xuất thành công 40 địa chỉ

$ npm run track

═══════════════════════════════════════════════════════════════
  Midnight Challenge Tracker
  Track wallet challenge submissions
═══════════════════════════════════════════════════════════════

📖 Loaded 40 wallets

🌐 Fetching current challenge day...
🗓  Current challenge day: 5

📂 Reading existing tracking data...
✅ Found 8 existing day columns

🚀 Fetching wallet statistics...

   [1/40] addr1qx... -> Solution: 5 | Night: 125.5000
   [2/40] addr1qy... -> Solution: 5 | Night: 125.5000
   ...
   [40/40] addr1qz... -> Solution: 4 | Night: 100.4000

✅ Fetched all wallet statistics

🔄 Merging data...
💾 Generating CSV file...
✅ Successfully saved to: wallet-tracker.csv

═══════════════════════════════════════════════════════════════
  📊 Tracking Summary
═══════════════════════════════════════════════════════════════
  Total wallets tracked:  40
  Current day:            5
  Total day columns:      5
  Output file:            wallet-tracker.csv
═══════════════════════════════════════════════════════════════

🎉 Challenge tracking completed successfully!

$ # Xóa file chứa seed phrase
$ del wallet-input.json
```

---

## 🚀 Các Lệnh Nhanh

```bash
# Cài đặt lần đầu
npm install

# Chuyển đổi seed.txt thành wallet-input.json (tùy chọn)
npm run convert

# Chạy đăng ký
npm run register

# Xuất danh sách địa chỉ
npm run export

# Theo dõi challenge submissions (tùy chọn)
npm run track

# Dọn dẹp (QUAN TRỌNG!)
# Cách 1: Dùng File Explorer
# - Mở thư mục scripts
# - Tìm file seed.txt và wallet-input.json
# - Click chuột phải > Delete

# Cách 2: Dùng lệnh
del seed.txt wallet-input.json
```

---

## 📦 Tính Di Động

Thư mục `scripts/` này **hoàn toàn độc lập**:

1. Copy toàn bộ thư mục `scripts/` sang bất kỳ đâu
2. Chạy `npm install` trong thư mục đó
3. Tạo file `wallet-input.json`
4. Chạy `npm run register`
5. Chạy `npm run export`

**Không phụ thuộc vào ứng dụng chính!**

---

## 💡 Mẹo Hay

1. **Test với 1 địa chỉ trước**: Đặt `addressCount: 1` để thử nghiệm
2. **Giữ lại file kết quả**: `registration-results.json`, `wallets.txt` và `wallet-tracker.csv` an toàn để backup
3. **Luôn mở terminal đúng thư mục**: Phải ở trong thư mục `scripts`
4. **Kiểm tra kết quả**: Xem file `registration-results.json` sau khi hoàn thành
5. **Dùng file wallets.txt**: Tiện để import vào công cụ khác
6. **Tracking định kỳ**: Chạy `npm run track` mỗi ngày để theo dõi tiến trình challenge
7. **Mở CSV bằng Excel**: File `wallet-tracker.csv` có thể mở bằng Excel để xem báo cáo đẹp hơn
8. **Lưu lịch sử**: File CSV sẽ tự động merge dữ liệu mới với dữ liệu cũ mỗi lần chạy

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Đọc kỹ phần "Xử Lý Lỗi Thường Gặp" ở trên
2. Kiểm tra kết nối internet
3. Đảm bảo Node.js đã được cài đặt (chạy `node --version`)
4. Đảm bảo đã chạy `npm install`
