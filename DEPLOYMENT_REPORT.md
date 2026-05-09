# THPT Exam Prep - Báo cáo Triển khai (Deployment Report)

## 📌 Trạng thái hiện tại
Hệ thống đã được triển khai thành công trên môi trường Production:
- **Frontend:** [https://thithpt-website.web.app](https://thithpt-website.web.app) (Firebase Hosting)
- **Backend:** [https://thithpt-backend.onrender.com](https://thithpt-backend.onrender.com) (Render Web Service)
- **Database:** **Supabase PostgreSQL** (Production Node)

## 🛠️ Các cải tiến đã thực hiện
- **Database Setup:** Cấu hình **PostgreSQL Transaction Pooler** (Cổng 6543) để tối ưu hóa kết nối.
- **Environment Variables:** Thiết lập đầy đủ các biến môi trường trên Render và Firebase.
- **CORS & Assets:** Cấu hình **Helmet Cross-Origin Resource Policy** trên server để cho phép hiển thị ảnh từ backend trên frontend Firebase.
- **PDF Processing:** Hoàn thiện tính năng tải đề PDF và tự động chuyển đổi thành ảnh trang đề (image pages) để học sinh xem trực tiếp.
- **Import JSON (Admin):** Thay thế hộp thoại prompt mặc định bằng Giao diện Modal cao cấp, hỗ trợ dán mã JSON đáp án/lời giải một cách trực quan, có định dạng màu sắc và hướng dẫn chi tiết.
- **Edit Exam Workflow:** Bổ sung tính năng Import JSON cho cả quy trình Sửa đề thi để đồng nhất trải nghiệm quản trị.
- **UI/UX Consistency:** Đồng bộ hệ thống icon sử dụng `lucide-react`, loại bỏ các khai báo SVG cục bộ gây xung đột Type-Check.

## ✅ Bug Fixes (Mới nhất)
- [x] **Hệ thống nộp bài:** Đã sửa lỗi Foreign Key Constraint khi nộp bài. Backend hiện tại ghi nhật ký chi tiết hơn để bắt lỗi nếu có.
- [x] **Modal Quản lý:** Sửa nút "Tiếp theo" bị kẹt ở tab Đáp án. Thêm trạng thái "Đang lưu..." cho nút cập nhật đề thi.
- [x] **Trình xem đề:** Sửa lỗi nhảy trang sai lệch (ví dụ: hiển thị trang 1 nhưng UI báo trang 4). Đã tối ưu hóa IntersectionObserver để bắt chính xác trang có tỷ lệ hiển thị cao nhất.
- [x] **Conflict Icons:** Sửa lỗi trùng tên khai báo `FileText` gây lỗi biên dịch TypeScript.

## ⚠️ Cảnh báo quan trọng: Lưu trữ ảnh
Hiện tại, hệ thống Backend đang được deploy trên Render gói miễn phí. Render có một đặc điểm là **Bộ nhớ tạm thời (Ephemeral Storage)**.
- **Vấn đề:** Mọi ảnh bạn tải lên (PDF, trang đề, ảnh dán vào lời giải) được lưu trong thư mục `server/uploads`. Khi bạn Push code mới lên Git hoặc Deploy lại, Render sẽ xóa sạch thư mục này và tạo mới server. Đó là lý do ảnh bị lỗi sau khi deploy.
- **Giải pháp:** Để ảnh tồn tại vĩnh viễn, chúng ta cần cấu hình một dịch vụ lưu trữ bên ngoài (Cloud Storage) như:
  1. **Supabase Storage:** (Khuyên dùng vì bạn đang dùng DB của họ).
  2. **Cloudinary:** Dễ tích hợp cho việc xử lý ảnh.
  3. **AWS S3:** Chuyên nghiệp và bền vững.
- **Tạm thời:** Nếu bạn muốn ảnh không bị mất, hãy sử dụng URL ảnh từ các nguồn bên ngoài (như link ảnh có sẵn) dán trực tiếp vào thay vì upload file từ máy tính.

## 🚀 Các bước tiếp theo
1. **Tích hợp Supabase Storage:** Thay đổi API upload để đẩy file lên đám mây thay vì lưu local.
2. **Auto-save:** Lưu nháp tiến trình làm bài của học sinh.
3. **Phân quyền nâng cao:** Audit log cho hành động của Admin.

---
*Cập nhật lần cuối: 10/05/2026 (Sáng)*
