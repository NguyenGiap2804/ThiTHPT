-- ============================================================================
-- THPT EXAM PREP SYSTEM - POSTGRESQL DATABASE SCHEMA
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "UploadedFiles" CASCADE;
DROP TABLE IF EXISTS "AttemptAnswers" CASCADE;
DROP TABLE IF EXISTS "Attempts" CASCADE;
DROP TABLE IF EXISTS "Explanations" CASCADE;
DROP TABLE IF EXISTS "AnswerKeys" CASCADE;
DROP TABLE IF EXISTS "QuestionStructures" CASCADE;
DROP TABLE IF EXISTS "ExamImages" CASCADE;
DROP TABLE IF EXISTS "Exams" CASCADE;
DROP TABLE IF EXISTS "Subjects" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- ============================================================================
-- SUBJECTS TABLE
-- ============================================================================
CREATE TABLE "Subjects" (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(50),
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE "Users" (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  phone VARCHAR(20),
  avatar TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IX_Users_Email ON "Users"(email);
CREATE INDEX IX_Users_Role ON "Users"(role);

-- ============================================================================
-- EXAMS TABLE
-- ============================================================================
CREATE TABLE "Exams" (
  id VARCHAR(50) PRIMARY KEY,
  "subjectId" VARCHAR(50) NOT NULL REFERENCES "Subjects"(id),
  title TEXT NOT NULL,
  "examCode" VARCHAR(50) NOT NULL UNIQUE,
  "durationMinutes" INTEGER NOT NULL DEFAULT 90,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  "totalQuestions" INTEGER DEFAULT 0,
  "createdBy" VARCHAR(50) NOT NULL REFERENCES "Users"(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IX_Exams_SubjectId ON "Exams"("subjectId");
CREATE INDEX IX_Exams_Status ON "Exams"(status);
CREATE INDEX IX_Exams_ExamCode ON "Exams"("examCode");

-- ============================================================================
-- EXAM IMAGES TABLE
-- ============================================================================
CREATE TABLE "ExamImages" (
  id VARCHAR(50) PRIMARY KEY,
  "examId" VARCHAR(50) NOT NULL REFERENCES "Exams"(id) ON DELETE CASCADE,
  "pageNumber" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imagePath" TEXT,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("examId", "pageNumber")
);
CREATE INDEX IF NOT EXISTS "IX_ExamImages_ExamId" ON "ExamImages"("examId");
CREATE INDEX IF NOT EXISTS "IX_ExamImages_ExamId_PageNumber" ON "ExamImages"("examId", "pageNumber");

-- ============================================================================
-- QUESTION STRUCTURE TABLE
-- ============================================================================
CREATE TABLE "QuestionStructures" (
  id VARCHAR(50) PRIMARY KEY,
  "examId" VARCHAR(50) NOT NULL REFERENCES "Exams"(id) ON DELETE CASCADE,
  "questionNumber" INTEGER NOT NULL,
  label VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('single_choice', 'true_false', 'short_answer')),
  part INTEGER NOT NULL DEFAULT 1,
  options JSONB,
  "subQuestions" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("examId", "questionNumber")
);
CREATE INDEX IF NOT EXISTS "IX_QuestionStructures_ExamId" ON "QuestionStructures"("examId");
CREATE INDEX IF NOT EXISTS "IX_QuestionStructures_ExamId_QuestionNumber" ON "QuestionStructures"("examId", "questionNumber");

-- ============================================================================
-- ANSWER KEYS TABLE
-- ============================================================================
CREATE TABLE "AnswerKeys" (
  id VARCHAR(50) PRIMARY KEY,
  "examId" VARCHAR(50) NOT NULL REFERENCES "Exams"(id) ON DELETE CASCADE,
  "questionId" VARCHAR(50) NOT NULL UNIQUE REFERENCES "QuestionStructures"(id),
  "correctAnswer" JSONB NOT NULL,
  "scoringRules" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_AnswerKeys_ExamId" ON "AnswerKeys"("examId");
CREATE INDEX IF NOT EXISTS "IX_AnswerKeys_QuestionId" ON "AnswerKeys"("questionId");

-- ============================================================================
-- EXPLANATIONS TABLE
-- ============================================================================
CREATE TABLE "Explanations" (
  id VARCHAR(50) PRIMARY KEY,
  "examId" VARCHAR(50) NOT NULL REFERENCES "Exams"(id) ON DELETE CASCADE,
  "questionId" VARCHAR(50) NOT NULL UNIQUE REFERENCES "QuestionStructures"(id),
  text TEXT NOT NULL,
  "videoUrl" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_Explanations_ExamId" ON "Explanations"("examId");
CREATE INDEX IF NOT EXISTS "IX_Explanations_QuestionId" ON "Explanations"("questionId");

-- ============================================================================
-- ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE "Attempts" (
  id VARCHAR(50) PRIMARY KEY,
  "examId" VARCHAR(50) NOT NULL REFERENCES "Exams"(id) ON DELETE CASCADE,
  "studentId" VARCHAR(50) NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "correctCount" INTEGER DEFAULT 0,
  "wrongCount" INTEGER DEFAULT 0,
  "emptyCount" INTEGER DEFAULT 0,
  "timeSpent" INTEGER DEFAULT 0,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_Attempts_ExamId" ON "Attempts"("examId");
CREATE INDEX IF NOT EXISTS "IX_Attempts_StudentId" ON "Attempts"("studentId");
CREATE INDEX IF NOT EXISTS "IX_Attempts_StudentId_SubmittedAt" ON "Attempts"("studentId", "submittedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_Attempts_ExamId_SubmittedAt" ON "Attempts"("examId", "submittedAt" DESC);

-- ============================================================================
-- ATTEMPT ANSWERS TABLE
-- ============================================================================
CREATE TABLE "AttemptAnswers" (
  id VARCHAR(50) PRIMARY KEY,
  "attemptId" VARCHAR(50) NOT NULL REFERENCES "Attempts"(id) ON DELETE CASCADE,
  "questionId" VARCHAR(50) NOT NULL REFERENCES "QuestionStructures"(id),
  "selectedOption" TEXT,
  "trueFalseAnswers" JSONB,
  "shortAnswer" TEXT,
  "isCorrect" BOOLEAN,
  points DECIMAL(5, 2) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_AttemptId" ON "AttemptAnswers"("attemptId");
CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_QuestionId" ON "AttemptAnswers"("questionId");

-- ============================================================================
-- UPLOADED FILES TABLE
-- ============================================================================
CREATE TABLE "UploadedFiles" (
  id VARCHAR(50) PRIMARY KEY,
  "originalName" VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedBy" VARCHAR(50) REFERENCES "Users"(id),
  "storageProvider" VARCHAR(30) NOT NULL DEFAULT 'local',
  "objectKey" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_UploadedFiles_Url" ON "UploadedFiles"(url);
CREATE INDEX IF NOT EXISTS "IX_UploadedFiles_StorageProvider" ON "UploadedFiles"("storageProvider");

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE "Notifications" (
  id VARCHAR(50) PRIMARY KEY,
  "userId" VARCHAR(50) REFERENCES "Users"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications"("userId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead_CreatedAt" ON "Notifications"("userId", "isRead", "createdAt" DESC);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Subjects
INSERT INTO "Subjects" (id, name, icon, color, description) VALUES
('math', 'Toán học', 'Calculator', 'bg-blue-500', 'Luyện tập các chuyên đề Giải tích và Hình học.'),
('english', 'Tiếng Anh', 'Languages', 'bg-indigo-500', 'Ngữ pháp, từ vựng và kỹ năng đọc hiểu.'),
('physics', 'Vật lý', 'Zap', 'bg-orange-500', 'Cơ học, Điện học, Quang học và Vật lý hạt nhân.'),
('chemistry', 'Hóa học', 'Beaker', 'bg-emerald-500', 'Hóa vô cơ và Hóa hữu cơ chuyên sâu.'),
('biology', 'Sinh học', 'Dna', 'bg-green-500', 'Di truyền học, Tiến hóa và Sinh thái học.'),
('literature', 'Ngữ văn', 'BookOpen', 'bg-rose-500', 'Phân tích tác phẩm và Nghị luận xã hội.');

-- Users
-- admin123
INSERT INTO "Users" (id, email, password, name, role, "isActive") VALUES
('admin-001', 'admin@thpt.edu.vn', '$2a$10$Ej85lx1Q8wRFFhfN9KKJu.fOKMrVhSqw6k2XqWWWZnP6J6J7z1jGi', 'Quản trị viên', 'admin', TRUE);

-- student123
INSERT INTO "Users" (id, email, password, name, role, "isActive") VALUES
('student-001', 'student@thpt.edu.vn', '$2a$10$xJ6R3KJ9LK0MNaBcDeF1gOjp8Q3RtWxYzAbCdEfGhIjKlMnOpQrSm', 'Nguyễn Văn A', 'student', TRUE);

-- Exams
INSERT INTO "Exams" (id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "createdBy") VALUES
('exam-001', 'math', 'Đề thi tốt nghiệp THPT 2025 - Mã đề 0119', '0119', 90, 'published', 22, 'admin-001');

-- Exam Images
INSERT INTO "ExamImages" (id, "examId", "pageNumber", "imageUrl") VALUES
('img-001', 'exam-001', 1, 'https://picsum.photos/seed/exam1/1200/1600'),
('img-002', 'exam-001', 2, 'https://picsum.photos/seed/exam2/1200/1600'),
('img-003', 'exam-001', 3, 'https://picsum.photos/seed/exam3/1200/1600'),
('img-004', 'exam-001', 4, 'https://picsum.photos/seed/exam4/1200/1600');

-- Question Structures (Part 1)
INSERT INTO "QuestionStructures" (id, "examId", "questionNumber", label, type, part, options) VALUES
('q1', 'exam-001', 1, 'Câu 1', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q2', 'exam-001', 2, 'Câu 2', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q3', 'exam-001', 3, 'Câu 3', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q4', 'exam-001', 4, 'Câu 4', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q5', 'exam-001', 5, 'Câu 5', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q6', 'exam-001', 6, 'Câu 6', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q7', 'exam-001', 7, 'Câu 7', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q8', 'exam-001', 8, 'Câu 8', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q9', 'exam-001', 9, 'Câu 9', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q10', 'exam-001', 10, 'Câu 10', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q11', 'exam-001', 11, 'Câu 11', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q12', 'exam-001', 12, 'Câu 12', 'single_choice', 1, '["A", "B", "C", "D"]');

-- Question Structures (Part 2)
INSERT INTO "QuestionStructures" (id, "examId", "questionNumber", label, type, part, "subQuestions") VALUES
('q13', 'exam-001', 13, 'Câu 13', 'true_false', 2, '["a", "b", "c", "d"]'),
('q14', 'exam-001', 14, 'Câu 14', 'true_false', 2, '["a", "b", "c", "d"]'),
('q15', 'exam-001', 15, 'Câu 15', 'true_false', 2, '["a", "b", "c", "d"]'),
('q16', 'exam-001', 16, 'Câu 16', 'true_false', 2, '["a", "b", "c", "d"]');

-- Question Structures (Part 3)
INSERT INTO "QuestionStructures" (id, "examId", "questionNumber", label, type, part) VALUES
('q17', 'exam-001', 17, 'Câu 17', 'short_answer', 3),
('q18', 'exam-001', 18, 'Câu 18', 'short_answer', 3),
('q19', 'exam-001', 19, 'Câu 19', 'short_answer', 3),
('q20', 'exam-001', 20, 'Câu 20', 'short_answer', 3),
('q21', 'exam-001', 21, 'Câu 21', 'short_answer', 3),
('q22', 'exam-001', 22, 'Câu 22', 'short_answer', 3);

-- Answer Keys
INSERT INTO "AnswerKeys" (id, "examId", "questionId", "correctAnswer") VALUES
('ak1', 'exam-001', 'q1', '"C"'),
('ak2', 'exam-001', 'q2', '"C"'),
('ak3', 'exam-001', 'q3', '"D"'),
('ak4', 'exam-001', 'q4', '"A"'),
('ak5', 'exam-001', 'q5', '"A"'),
('ak6', 'exam-001', 'q6', '"A"'),
('ak7', 'exam-001', 'q7', '"A"'),
('ak8', 'exam-001', 'q8', '"A"'),
('ak9', 'exam-001', 'q9', '"D"'),
('ak10', 'exam-001', 'q10', '"D"'),
('ak11', 'exam-001', 'q11', '"C"'),
('ak12', 'exam-001', 'q12', '"A"'),
('ak13', 'exam-001', 'q13', '{"a":true,"b":false,"c":false,"d":true}'),
('ak14', 'exam-001', 'q14', '{"a":true,"b":false,"c":true,"d":false}'),
('ak15', 'exam-001', 'q15', '{"a":false,"b":true,"c":true,"d":false}'),
('ak16', 'exam-001', 'q16', '{"a":true,"b":true,"c":false,"d":false}'),
('ak17', 'exam-001', 'q17', '"3780"'),
('ak18', 'exam-001', 'q18', '"95.3"'),
('ak19', 'exam-001', 'q19', '"2.08"'),
('ak20', 'exam-001', 'q20', '"2150"'),
('ak21', 'exam-001', 'q21', '"2016"'),
('ak22', 'exam-001', 'q22', '"1808"');

-- Explanations
INSERT INTO "Explanations" (id, "examId", "questionId", text) VALUES
('exp1', 'exam-001', 'q1', 'Dựa vào bảng tần số ghép nhóm, Q3 = 135.'),
('exp2', 'exam-001', 'q2', 'Vectơ BA + A''C'' = BC.'),
('exp17', 'exam-001', 'q17', 'Kết quả tính toán là 3780.'),
('exp22', 'exam-001', 'q22', 'Lợi nhuận tối đa đạt được tại x = 1808.');
