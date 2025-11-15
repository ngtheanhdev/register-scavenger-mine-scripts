# Script Bổ Trợ Midnight Scavenger Mine

Các script bổ trợ cho phase Scavenger Mine của Midnight dựa trên các API chính thức.

## Yêu Cầu Hệ Thống

### Node.js
- **Phiên bản**: Node.js 20.x trở lên

**Kiểm tra phiên bản Node.js đã cài:**
```bash
node --version
```
- Nếu lệnh trên hiển thị phiên bản Nodejs thì máy bạn đã có. Nếu không, bạn có thể tải về tại: https://nodejs.org/

### Git (Tùy chọn)
**Kiểm tra xem máy có Git chưa:**
```bash
git --version
```

Nếu lệnh trên hiển thị phiên bản Git thì máy bạn đã có Git. Nếu không, bạn có thể tải repository này dưới dạng file ZIP.

## Cài Đặt

### Bước 1: Tải Repository

**Cách 1: Dùng Git (nếu đã có Git)**
```bash
git clone https://github.com/ngtheanhdev/register-scavenger-mine-scripts.git
cd register-scavenger-mine-scripts
```

**Cách 2: Tải file ZIP (cho máy không có Git)**
1. Click vào nút màu xanh "Code" ở phía trên đầu
3. Chọn "Download ZIP"
4. Sau khi tải về, giải nén (unzip) file ZIP
5. Mở thư mục đã giải nén

### Bước 2: Cài Đặt Dependencies

Mở terminal/command prompt tại thư mục vừa tải (giải nén) và chạy:

```bash
npm install
```

## Mô tả nhanh các lệnh có trong repository này

```bash
# Chuyển đổi file seed.txt thành file wallet-input.json
npm run convert

# Đăng ký địa chỉ ví với Midnight API
# Scrip sẽ tạo ra file registration-results.json
# Yêu cầu cần có file wallet-input.json trước khi chạy
npm run register

# Xuất danh sách địa chỉ đã đăng ký thành công
# Scrip sẽ tạo ra file wallets.txt
# Yêu cầu cần có file registration-results.json trước khi chạy
npm run export

# Theo dõi số lượng challenge submissions theo address
# Scrip sẽ tạo ra file wallet-tracker.csv
# Yêu cầu cần có file wallets.txt trước khi chạy
npm run track

# Xem thống kê chi tiết từ dữ liệu tracking từ file
# Scrip sẽ in ra màn hình kết quả và tạo ra file statistics-report.txt để xem
# Yêu cầu cần có file wallet-tracker.csv trước khi chạy
npm run stats

# Hợp nhất (consolidate) allocation từ nhiều địa chỉ donor về một địa chỉ recipient
# Script sẽ tạo ra file donation-signatures.json và consolidation-results.json
# Yêu cầu cần có file wallet-donor-input.json và địa chỉ recipient
npm run donate <địa_chỉ_recipient>
```

## Mô Tả Chi Tiết Từng Script

### 1. `npm run convert` - Chuyển Đổi Seed Phrases

**Công dụng**: Chuyển đổi file `seed.txt` (định dạng như bên dưới) thành file `wallet-input.json` để sử dụng cho script đăng ký. Vì seed phrase copy từ ví Yoroi ra có định dạng như bên dưới và khó sử dụng nếu muốn copy vào file `wallet-input.json` nên script này giúp giải quyết việc đó. Nếu seed phrase của bạn có dạng `word1 word2 word3 ... word24` thì có thể bỏ qua script này

**File cần có**: `seed.txt`

**Định dạng file seed.txt**:
```
Wallet-1
1. word1
2. word2
3. word3
...
15. word15
=====================
Wallet-2
1. word1
2. word2
...
15. word15
=====================
...
=====================
Wallet-10
1. word1
2. word2
...
24. word24
```

**File seed.txt tham khảo**:
1. File `seed.txt.sample` trong thư mục có thể sử dụng để tham khảo
2. Nếu bạn muốn dùng hãy tạo bản coppy và đổi tên thành `seed.txt`
3. Mở file và điền các seed phrase theo định dạng mẫu
4. Lưu file

**Sau khi 

**File kết quả**: `wallet-input.json`

**Lưu ý**:
- Script này là **tùy chọn**. Nếu bạn muốn tạo `wallet-input.json` thủ công (xem script số 2), có thể bỏ qua script này.
- Hỗ trợ 15 hoặc 24 từ
- Tên ví sẽ giữ nguyên như bạn đặt trong file (ví dụ: "Wallet-1", "PC-21", v.v.)
- Mặc định addressCount là 10 cho mỗi seed phrase (addressCount là gì xem script sau)
- **Nhớ xóa file `seed.txt` sau khi chuyển đổi xong** để bảo mật

---

### 2. `npm run register` - Đăng Ký Địa Chỉ

**Công dụng**: Tạo số địa chỉ ví tương ứng với seed phrase và đăng ký chúng với Midnight Scavenger API.

**File cần có**: `wallet-input.json`

**Định dạng file wallet-input.json**:
```json
{
  "wallets": [
    {
      "name": "Ví Chính",
      "seedPhrase": "từ1 từ2 từ3 ... từ15",
      "addressCount": 40
    },
    {
      "name": "Ví Phụ",
      "seedPhrase": "từ1 từ2 ... từ24",
      "addressCount": 20
    }
  ]
}
```

**Ý nghĩa các trường trong file**:
- name : tùy chọn, để gì cũng được mục đích là cho dễ phân biệt và dễ nhớ
- seedPhrase : seedphrase để tạo ra các địa chỉ ví
- addressCount: số địa chỉ tạo ra từ seed phrase tương ứng

**Hướng dẫn tạo file**:
*Cách 1: Dùng script convert (xem script số 1)*
- Tạo file `seed.txt` và chạy `npm run convert`
- File `wallet-input.json` sẽ được tạo tự động
- File này sẽ có số address được tạo từ mỗi seed phrase là 10

*Cách 2: Tạo thủ công*
1. Tìm file `wallet-input.sample.json` trong thư mục
2. Tạo bản sao và đổi tên thành `wallet-input.json`
3. Mở file và điền seed phrase theo định dạng trên
4. Lưu file

**File kết quả**: `registration-results.json`

**Lưu ý**:
- Đây là script giúp bạn đăng ký địa chỉ với Midnight theo số lượng lớn
- **Nhớ xóa file `wallet-input.json` ngay sau khi chạy xong** vì file đó chứa seed phrase dạng text

---

### 3. `npm run export` - Xuất Danh Sách Địa Chỉ

**Công dụng**: Xuất danh sách các địa chỉ đã đăng ký thành công ra file text, mỗi địa chỉ một dòng.

**File cần có**: `registration-results.json` (được tạo từ script số 2)

**File kết quả**: `wallets.txt` (mỗi dòng là một địa chỉ)

**Lưu ý**:
- Chỉ chạy script này **sau khi đã chạy `npm run register` thành công**
- File `wallets.txt` được tạo ra dùng để làm input cho script tracking (số 4)
- File này an toàn để lưu trữ (chỉ chứa địa chỉ công khai)

---

### 4. `npm run track` - Theo Dõi Challenge Submissions

**Công dụng**: Theo dõi số lượng challenge đã submit và night allocation cho từng địa chỉ theo ngày.

**File cần có**: `wallets.txt` (được tạo từ script số 3, hoặc tự chuẩn bị tùy thích)

**File kết quả**: `wallet-tracker.csv`

**Định dạng file kết quả**:
```csv
Wallet Address,Day 1 Solution,Day 1 Night,Day 2 Solution,Day 2 Night,Total Night per address
addr1qx...,5,125.5,5,125.5,251.0
addr1qy...,4,100.4,5,125.5,225.9
...
Total Solution,200,5010,205,5135.5,10145.5
Total Night,200,5010,205,5135.5,10145.5
```

**Lưu ý**:
- Script này là **tùy chọn** - chỉ cần nếu bạn muốn theo dõi tiến độ challenge
- Có thể chạy nhiều lần (mỗi ngày) - dữ liệu cũ sẽ được giữ lại và merge với dữ liệu mới
- File `wallets.txt` có thể chứa địa chỉ nào cũng được không cần bắt buộc là address của các script chạy trước đó

---

### 5. `npm run stats` - Xem Thống Kê

**Công dụng**: Phân tích và hiển thị thống kê chi tiết từ dữ liệu tracking.

**File cần có**: `wallet-tracker.csv` (được tạo từ script số 4)

**File kết quả**:
- Hiển thị trên màn hình console
- `statistics-report.txt` (báo cáo chi tiết)

**Thống kê bao gồm**:
- Tổng số ví
- Top 10 ví có nhiều/ít Night và Solution nhất
- Trung bình Night và Solution trên mỗi ví
- Phân bố Night allocation theo khoảng
- Xu hướng theo từng ngày

**Lưu ý**:
- Chỉ chạy script này **sau khi đã chạy `npm run track` thành công**
- Script này là **tùy chọn** - chỉ cần nếu bạn muốn xem phân tích chi tiết

---

### 6. `npm run donate <địa_chỉ_recipient>` - Hợp Nhất Allocation

**Công dụng**: Hợp nhất (consolidate) Scavenger Mine allocation từ nhiều địa chỉ donor về một địa chỉ recipient duy nhất. Điều này giúp bạn quản lý NIGHT dễ dàng hơn từ một ví duy nhất thay vì phải quản lý nhiều ví khác nhau.

**File cần có**: `wallet-donor-input.json`

**Định dạng file wallet-donor-input.json**:
```json
{
  "donors": [
    {
      "name": "Ví Donor 1",
      "seedPhrase": "từ1 từ2 từ3 ... từ15",
      "addressCount": 40
    },
    {
      "name": "Ví Donor 2",
      "seedPhrase": "từ1 từ2 ... từ24",
      "addressCount": 20
    }
  ]
}
```

**Ý nghĩa các trường trong file**:
- `name`: Tùy chọn, tên ví để dễ phân biệt
- `seedPhrase`: Seed phrase của ví donor (ví muốn chuyển allocation đi)
- `addressCount`: Số địa chỉ đã được tạo từ seed phrase đó (ví dụ seed đó tạo ra 100 ví đăng ký với midnight thì điền 100, điền lớn hơn số ví thực tế cũng không sao)

**Hướng dẫn tạo file**:
1. Tìm file `wallet-donor-input.sample.json` trong thư mục
2. Tạo bản sao và đổi tên thành `wallet-donor-input.json`
3. Mở file và điền seed phrase của các ví donor theo định dạng trên
4. Lưu file

**Cách sử dụng**:
```bash
# Ví dụ: Chuyển allocation về địa chỉ recipient
npm run donate addr1q8mamwlayr45guejvmzqt80yqhmaudy373rsv6jeeplnpnvkdh5pjv...
```

**Quy trình 2 giai đoạn**:

**Giai đoạn 1 - Tạo chữ ký** (an toàn, có thể tái sử dụng):
- Script tạo các địa chỉ donor từ seed phrase (index 0 đến addressCount-1)
- Ký message donation cho mỗi địa chỉ
- Lưu vào file `donation-signatures.json`
- **Không gọi API** - hoàn toàn an toàn

**Giai đoạn 2 - Thực thi donation** (có thể chạy lại nếu lỗi):
- Đọc file `donation-signatures.json`
- Gọi API `/donate_to` cho từng địa chỉ donor
- Cập nhật trạng thái sau mỗi lần gọi API
- Áp dụng rate limiting 1.5 giây giữa các lần gọi

**File kết quả**:
- `donation-signatures.json` - File chữ ký trung gian (có thể xem và kiểm tra)
- `consolidation-results.json` - Kết quả cuối cùng

**Lưu ý**:
- Script này **tùy chọn** - chỉ cần nếu bạn muốn hợp nhất allocation từ nhiều ví
- Địa chỉ recipient phải là địa chỉ Cardano hợp lệ (bắt đầu bằng `addr1`)
- Tất cả các địa chỉ donor phải đã được đăng ký trước đó
- **Xóa file `wallet-donor-input.json` ngay sau khi chạy xong** vì chứa seed phrase
- File `donation-signatures.json` có thể giữ lại để xem lại hoặc chạy lại nếu bị lỗi
- Nếu gặp lỗi trong quá trình donation, có thể chạy lại lệnh với cùng địa chỉ recipient - script sẽ tự động bỏ qua các địa chỉ đã donate thành công
- Response "already assigned" được xem là thành công

**Lợi ích khi consolidate**:
- Quản lý NIGHT từ một ví duy nhất thay vì nhiều ví
- Giảm phí transaction khi redeem
- Giảm yêu cầu minimum ADA
- Tiện lợi hơn khi tương tác với Glacier Drop portal

---

## Các File Trong Thư Mục

```
register-scavenger-mine-scripts/
├── package.json                  # Cấu hình dependencies và scripts
├── package-lock.json             # Lock file cho dependencies
├── seed-to-wallet-converter.js   # Script chuyển đổi seed.txt -> wallet-input.json
├── register-addresses.js         # Script đăng ký địa chỉ với API
├── export-addresses.js           # Script xuất danh sách địa chỉ
├── consolidate-addresses.js      # Script hợp nhất allocation
├── track-challenges.js           # Script theo dõi challenge submissions
├── statistics.js                 # Script thống kê từ wallet-tracker.csv
├── seed.txt.sample               # File mẫu cho seed.txt
├── wallet-input.sample.json      # File mẫu cho wallet-input.json
├── wallet-donor-input.sample.json # File mẫu cho wallet-donor-input.json
├── .gitignore                    # Danh sách file bỏ qua khi commit
└── README.md                     # File hướng dẫn này

File được tạo ra sau khi chạy scripts:
├── seed.txt                      # File seed phrases (TẠO RỒI XÓA!)
├── wallet-input.json             # File cấu hình ví (TẠO RỒI XÓA!)
├── wallet-donor-input.json       # File cấu hình ví donor (TẠO RỒI XÓA!)
├── registration-results.json     # Kết quả đăng ký (an toàn để lưu)
├── donation-signatures.json      # Chữ ký donation (nên xóa sau khi xong)
├── consolidation-results.json    # Kết quả hợp nhất (an toàn để lưu)
├── wallets.txt                   # Danh sách địa chỉ (an toàn để lưu)
├── wallet-tracker.csv            # Kết quả tracking (an toàn để lưu)
└── statistics-report.txt         # Báo cáo thống kê (an toàn để lưu)
```

---

## Lưu Ý Bảo Mật

⚠️ **QUAN TRỌNG**:
- File `seed.txt`, `wallet-input.json` và `wallet-donor-input.json` chứa seed phrase dạng text thuần
- **Phải xóa ngay** sau khi sử dụng xong
- **Không bao giờ** commit lên git hoặc chia sẻ với người khác
- File `donation-signatures.json` chứa chữ ký - nên xóa sau khi consolidate xong hoặc không cần chạy lại
- Các file kết quả khác (`registration-results.json`, `consolidation-results.json`, `wallets.txt`, `wallet-tracker.csv`) chỉ chứa địa chỉ công khai và thông tin không nhạy cảm, an toàn để lưu trữ
