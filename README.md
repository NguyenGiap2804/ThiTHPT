# ThiTHPT - Hệ thống Luyện thi THPT mô phỏng CBT

**ThiTHPT** là nền tảng luyện thi trực tuyến được thiết kế để mô phỏng trải nghiệm thi trắc nghiệm trên máy tính (Computer-Based Testing) dành cho học sinh ôn thi tốt nghiệp THPT. Hệ thống tập trung vào việc cung cấp trải nghiệm làm bài thực tế với các bộ đề thi từ ảnh gốc, giúp học sinh làm quen với áp lực phòng thi ngay tại nhà.

![ThiTHPT Preview](https://raw.githubusercontent.com/NguyenGiap2804/ThiTHPT/master/src/assets/login-bg.png)

## 🚀 Tính năng nổi bật

### Dành cho Học sinh
- **Làm bài trên đề ảnh gốc:** Hiển thị đề thi dưới dạng ảnh quét thực tế, hỗ trợ cuộn liền mạch (Continuous Scroll) không bị ngắt quãng.
- **Phiếu trả lời thông minh:** Hỗ trợ đầy đủ các dạng câu hỏi theo cấu trúc mới của Bộ GD&ĐT:
  - Phần I: Trắc nghiệm nhiều phương án chọn.
  - Phần II: Trắc nghiệm đúng sai.
  - Phần III: Trắc nghiệm trả lời ngắn.
- **Quản lý trạng thái làm bài:** Hệ thống đánh dấu (Flag) ưu tiên, giúp học sinh dễ dàng theo dõi các câu hỏi cần xem lại.
- **Xác nhận nộp bài chi tiết:** Cảnh báo cụ thể số câu chưa làm và danh sách các câu còn đang đánh dấu trước khi nộp.
- **Xem kết quả & Lịch sử:** Xem lại bài làm, đáp án chi tiết và lời giải ngay sau khi kết thúc bài thi.

### Dành cho Quản trị viên
- **Quản lý đề thi:** Tạo đề, tải lên ảnh trang đề và cấu hình đáp án linh hoạt.
- **Cấu hình cấu trúc:** Thiết lập số lượng câu hỏi cho từng phần và thang điểm tương ứng.
- **Quản lý học sinh:** Theo dõi danh sách người dùng và kết quả luyện tập.

## 🛠 Công nghệ sử dụng

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** SQL Server (MSSQL).
- **Authentication:** JSON Web Token (JWT).

## 📦 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Node.js (v18 trở lên)
- SQL Server

### 2. Cài đặt Client
```bash
# Tại thư mục gốc
npm install
npm run dev
```

### 3. Cài đặt Server
```bash
cd server
npm install

# Cấu hình file .env
# Copy từ .env.example và điền thông tin kết nối SQL Server
# MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD

# Chạy Server
npm run dev
```

### 4. Khởi tạo Database
```bash
cd server
npm run db:migrate
```

## 📝 Giấy phép
Dự án được phát triển bởi **Nguyễn Giáp**. Mọi quyền được bảo lưu.
