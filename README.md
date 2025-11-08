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

### Bước 6: Xóa File Cấu Hình (Bảo Mật!)

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
├── register-addresses.js         # Script đăng ký chính
├── export-addresses.js           # Script xuất địa chỉ
├── wallet-input.sample.json      # File mẫu
├── wallet-input.json             # File cấu hình của bạn (tạo rồi xóa!)
├── registration-results.json     # Kết quả đăng ký
├── wallets.txt                   # Danh sách địa chỉ (sau khi export)
├── README.md                     # File hướng dẫn này
└── node_modules/                 # Thư viện (sau khi npm install)
```

---

## 🎯 Tính Năng

✅ **Hoàn Toàn Độc Lập** - Không cần server Next.js!
✅ **Nhiều Ví** - Đăng ký không giới hạn số lượng ví trong 1 lần chạy
✅ **Hỗ Trợ 15 hoặc 24 Từ** - Cả 2 định dạng seed phrase
✅ **Đặt Tên Tùy Chỉnh** - Gắn nhãn cho từng ví
✅ **Số Lượng Linh Hoạt** - Mỗi ví có thể có số địa chỉ khác nhau
✅ **Theo Dõi Tiến Trình** - Hiển thị real-time trên console
✅ **Xử Lý Lỗi** - Tiếp tục chạy ngay cả khi một số địa chỉ bị lỗi
✅ **Kết Quả Chi Tiết** - File JSON với đầy đủ thông tin
✅ **Xuất Danh Sách** - Export địa chỉ thành công ra file text

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

---

## ⏱️ Hiệu Năng

- **Tạo địa chỉ**: ~0.1 giây/địa chỉ
- **Đăng ký**: ~1.5 giây/địa chỉ (có rate limit)
- **Ví dụ**: 40 địa chỉ = khoảng 1-2 phút

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

$ # Xóa file chứa seed phrase
$ del wallet-input.json
```

---

## 🚀 Các Lệnh Nhanh

```bash
# Cài đặt lần đầu
npm install

# Chạy đăng ký
npm run register

# Xuất danh sách địa chỉ
npm run export

# Dọn dẹp (QUAN TRỌNG!)
# Cách 1: Dùng File Explorer
# - Mở thư mục scripts
# - Tìm file wallet-input.json
# - Click chuột phải > Delete

# Cách 2: Dùng lệnh
del wallet-input.json
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
2. **Giữ lại file kết quả**: `registration-results.json` và `wallets.txt` an toàn để backup
3. **Luôn mở terminal đúng thư mục**: Phải ở trong thư mục `scripts`
4. **Kiểm tra kết quả**: Xem file `registration-results.json` sau khi hoàn thành
5. **Dùng file wallets.txt**: Tiện để import vào công cụ khác

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Đọc kỹ phần "Xử Lý Lỗi Thường Gặp" ở trên
2. Kiểm tra kết nối internet
3. Đảm bảo Node.js đã được cài đặt (chạy `node --version`)
4. Đảm bảo đã chạy `npm install`
