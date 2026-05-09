@C:\Users\admin\.codex\RTK.md

# THPT Exam Prep - System Audit Notes

## Tổng quan hệ thống
- Frontend: React 19, Vite, Tailwind CSS, `react-router-dom`, `motion`, `lucide-react`. Entry chính: `src/App.tsx`, state dùng `src/context/AppContext.tsx`, API client ở `src/lib/api.ts`.
- Backend: Express + TypeScript trong `server/src`, SQL Server qua `mssql`, JWT auth, upload qua `multer`.
- Database: SQL Server database `ThiptExamDB` với các bảng chính `Users`, `Subjects`, `Exams`, `ExamImages`, `QuestionStructures`, `AnswerKeys`, `Explanations`, `Attempts`, `AttemptAnswers`.
- Migration an toàn: chạy `cd server && npm run db:migrate`. Migration không drop bảng production; `schema.sql` chỉ nên dùng cho local/dev reset.
- Luồng làm bài: frontend lấy đề không kèm `answerKey`, học sinh nộp answers lên `POST /api/attempts`, backend chấm từ `AnswerKeys`, lưu attempt/attempt answers, result page lấy đáp án/lời giải từ attempt result.

## Lỗi đã phát hiện và đã xử lý
- Frontend type-check lỗi import ảnh `login-bg.png`: đã thêm `src/vite-env.d.ts`.
- Frontend gọi sai `GET /api/attempts/user`: đã đổi sang `GET /api/attempts`.
- Backend query attempts sai schema (`a.userId`, `q.content`, `ak.explanation`, `sectionNumber`, `orderIndex`): đã sửa về `studentId`, `QuestionStructures`, `Explanations`, `questionNumber`.
- Backend tạo đề thiếu `createdBy` và questionNumber mặc định gây trùng unique key: đã lấy admin từ JWT và đánh số theo thứ tự câu.
- Backend trước đây chấm điểm bằng shape sai/logic demo: đã chuyển sang chấm từ DB, lưu `wrongCount`, `emptyCount`, `timeSpent`, `isCorrect`, `points`.
- Public exam detail từng trả cả `answerKey`: đã bỏ khỏi route public; admin có route `GET /api/exams/admin/:id`.
- Login từng cho chọn role trên frontend: đã bỏ selector; backend tự trả role theo tài khoản sau khi đăng nhập, public register luôn tạo học sinh.
- Upload PDF từng chỉ lưu URL PDF nên học sinh không xem được đề: admin upload hiện render PDF thành ảnh từng trang, upload ảnh vào `imagePages`, cho preview/xóa/đổi thứ tự trước khi xuất bản.
- Dữ liệu tiếng Việt trong SQL Server bị lỗi do seed không dùng Unicode literal: migration `001_safe_baseline.sql` đã repair dữ liệu mẫu và `schema.sql` đã được cập nhật các literal tiếng Việt sang `N'...'`.
- README/env lệch biến môi trường: backend config hỗ trợ `MSSQL_USERNAME` và legacy `MSSQL_USER`; `.env.example` đã chuẩn hóa sang `MSSQL_USERNAME`.
- Dependency audit: root và server hiện đã được xử lý qua npm audit/install; `mssql` đã nâng lên `^12.5.2`, thêm `helmet` và `express-rate-limit`.

## Phần còn frontend-only hoặc cần hoàn thiện thêm
- Notifications hiện vẫn là local UI state, chưa có API CRUD đầy đủ dù DB migration đã tạo bảng `Notifications`.
- Admin quản lý học sinh và cài đặt hệ thống đã có route frontend/backend cơ bản (`/admin/users`, `/admin/settings`); phần nâng cao còn thiếu là audit log, khóa/mở tài khoản, reset mật khẩu và phân quyền chi tiết.
- Admin edit exam hiện mới có backend update metadata; nếu muốn sửa cấu trúc câu/đáp án sau khi có attempts cần thiết kế versioning đề thi thay vì xóa câu trực tiếp.
- Upload hiện lưu file local vào `uploads/` và ghi metadata nếu bảng `UploadedFiles` tồn tại. Khi deploy production nên thay bằng object storage.
- `schema.sql` vẫn là script dev reset có `DROP TABLE`; production chỉ dùng migrations.

## Database design khuyến nghị
- Dùng migration versioned qua `SchemaMigrations`; không sửa production bằng script drop/recreate.
- Giữ tất cả text tiếng Việt là `NVARCHAR` và mọi seed/migration literal tiếng Việt phải dùng `N'...'`.
- Không sửa câu hỏi/đáp án đã có attempts theo kiểu ghi đè. Hướng tốt hơn là thêm `examVersions` hoặc clone exam khi thay đổi cấu trúc.
- Index cần giữ: users email, exams subject/status/code, question examId, answer key questionId, attempts studentId/examId/submittedAt.
- Upload production nên lưu: storage provider, object key, URL, mime type, size, uploader, checksum.
- Backup trước migration production; smoke test sau migration bằng query đọc `Users.name`, `Subjects.name`, `Exams.title` để bắt lỗi Unicode.

## Security checklist
- Production phải có `JWT_SECRET`; code hiện fail-fast nếu thiếu trong `NODE_ENV=production`.
- Không commit `.env`, `uploads`, `node_modules`, `dist`, log files.
- CORS chỉ cấu hình domain thật qua `CORS_ORIGIN`.
- Auth routes có rate limit; Express dùng `helmet`.
- Upload cần tiếp tục nâng cấp bằng kiểm tra magic bytes/virus scan nếu cho phép tài liệu từ người dùng.
- Role admin/student phải kiểm tra ở backend, không tin UI route guard.
- Dependency audit cần chạy trước deploy: `npm audit` ở root và `server`.

## UI/UX roadmap
- Giữ exam session mượt trên desktop/mobile: header gọn, answer sheet ổn định kích thước, trạng thái submit rõ.
- Thêm autosave answer draft theo attempt session nếu học sinh reload giữa bài.
- Thêm loading/error/empty state cho dashboard, exam list, result/history.
- Admin nên có workflow import đề: upload ảnh/PDF, preview, cấu trúc câu, đáp án, lời giải, publish.
- Kết quả nên hỗ trợ lọc câu sai/câu trống và jump tới câu trên ảnh đề.
- Kiểm tra accessibility: focus states, keyboard navigation, contrast, aria-label cho icon-only buttons.

## Development và deploy checklist
- Cài dependency: `npm install`, `cd server && npm install`.
- Cấu hình `server/.env` từ `server/.env.example`.
- Chạy migration: `cd server && npm run db:migrate`.
- Kiểm tra dữ liệu: `cd server && npm run db:check`.
- Kiểm tra type/build: `npm run lint`, `cd server && npm run lint`, `npm run build`, `cd server && npm run build`.
- Smoke test API: `/health`, login admin/student, list exams, public exam detail không có `answerKey`, submit attempt, get attempt history/result.
- Nếu thư mục chưa có Git: chạy `git init`, kiểm tra `.gitignore`, commit source/migrations/docs, không commit secrets hoặc generated output.
