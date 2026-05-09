-- ============================================================================
-- THPT EXAM PREP SYSTEM - SQL SERVER DATABASE SCHEMA
-- ============================================================================

-- ============================================================================
-- CREATE DATABASE
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ThiptExamDB')
BEGIN
  CREATE DATABASE ThiptExamDB;
  PRINT '✅ Database ThiptExamDB created!';
END
ELSE
BEGIN
  PRINT '⚠️ Database ThiptExamDB already exists!';
END
GO

USE ThiptExamDB;
GO

-- Drop existing tables if they exist (careful in production!)
IF OBJECT_ID('dbo.AttemptAnswers', 'U') IS NOT NULL DROP TABLE dbo.AttemptAnswers;
IF OBJECT_ID('dbo.Attempts', 'U') IS NOT NULL DROP TABLE dbo.Attempts;
IF OBJECT_ID('dbo.Explanations', 'U') IS NOT NULL DROP TABLE dbo.Explanations;
IF OBJECT_ID('dbo.AnswerKeys', 'U') IS NOT NULL DROP TABLE dbo.AnswerKeys;
IF OBJECT_ID('dbo.QuestionStructures', 'U') IS NOT NULL DROP TABLE dbo.QuestionStructures;
IF OBJECT_ID('dbo.ExamImages', 'U') IS NOT NULL DROP TABLE dbo.ExamImages;
IF OBJECT_ID('dbo.Exams', 'U') IS NOT NULL DROP TABLE dbo.Exams;
IF OBJECT_ID('dbo.Subjects', 'U') IS NOT NULL DROP TABLE dbo.Subjects;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;

-- ============================================================================
-- SUBJECTS TABLE
-- ============================================================================
CREATE TABLE dbo.Subjects (
  id NVARCHAR(50) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  icon NVARCHAR(50),
  color NVARCHAR(50),
  description NVARCHAR(MAX),
  createdAt DATETIME DEFAULT GETUTCDATE(),
  updatedAt DATETIME DEFAULT GETUTCDATE()
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE dbo.Users (
  id NVARCHAR(50) PRIMARY KEY,
  email NVARCHAR(255) UNIQUE NOT NULL,
  password NVARCHAR(MAX) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  role NVARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')), -- student or admin
  phone NVARCHAR(20),
  avatar NVARCHAR(MAX),
  isActive BIT DEFAULT 1,
  createdAt DATETIME DEFAULT GETUTCDATE(),
  updatedAt DATETIME DEFAULT GETUTCDATE()
);

-- Create index on email for faster lookups
CREATE INDEX IX_Users_Email ON dbo.Users(email);
CREATE INDEX IX_Users_Role ON dbo.Users(role);

-- ============================================================================
-- EXAMS TABLE
-- ============================================================================
CREATE TABLE dbo.Exams (
  id NVARCHAR(50) PRIMARY KEY,
  subjectId NVARCHAR(50) NOT NULL,
  title NVARCHAR(MAX) NOT NULL,
  examCode NVARCHAR(50) NOT NULL UNIQUE,
  durationMinutes INT NOT NULL DEFAULT 90,
  status NVARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  totalQuestions INT DEFAULT 0,
  createdBy NVARCHAR(50) NOT NULL,
  createdAt DATETIME DEFAULT GETUTCDATE(),
  updatedAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (subjectId) REFERENCES dbo.Subjects(id),
  FOREIGN KEY (createdBy) REFERENCES dbo.Users(id)
);

CREATE INDEX IX_Exams_SubjectId ON dbo.Exams(subjectId);
CREATE INDEX IX_Exams_Status ON dbo.Exams(status);
CREATE INDEX IX_Exams_ExamCode ON dbo.Exams(examCode);

-- ============================================================================
-- EXAM IMAGES TABLE (for storing image URLs/paths of exam pages)
-- ============================================================================
CREATE TABLE dbo.ExamImages (
  id NVARCHAR(50) PRIMARY KEY,
  examId NVARCHAR(50) NOT NULL,
  pageNumber INT NOT NULL,
  imageUrl NVARCHAR(MAX) NOT NULL,
  imagePath NVARCHAR(MAX), -- Local file path if stored on server
  uploadedAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (examId) REFERENCES dbo.Exams(id) ON DELETE CASCADE,
  UNIQUE (examId, pageNumber)
);

CREATE INDEX IX_ExamImages_ExamId ON dbo.ExamImages(examId);

-- ============================================================================
-- QUESTION STRUCTURE TABLE
-- ============================================================================
CREATE TABLE dbo.QuestionStructures (
  id NVARCHAR(50) PRIMARY KEY,
  examId NVARCHAR(50) NOT NULL,
  questionNumber INT NOT NULL,
  label NVARCHAR(50) NOT NULL, -- e.g., "Câu 1", "Câu 13a"
  type NVARCHAR(50) NOT NULL CHECK (type IN ('single_choice', 'true_false', 'short_answer')),
  part INT NOT NULL DEFAULT 1, -- Part 1, 2, or 3
  options NVARCHAR(MAX), -- JSON array for single_choice: ["A", "B", "C", "D"]
  subQuestions NVARCHAR(MAX), -- JSON array for true_false: ["a", "b", "c", "d"]
  createdAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (examId) REFERENCES dbo.Exams(id) ON DELETE CASCADE,
  UNIQUE (examId, questionNumber)
);

CREATE INDEX IX_QuestionStructures_ExamId ON dbo.QuestionStructures(examId);

-- ============================================================================
-- ANSWER KEYS TABLE (correct answers for each question)
-- ============================================================================
CREATE TABLE dbo.AnswerKeys (
  id NVARCHAR(50) PRIMARY KEY,
  examId NVARCHAR(50) NOT NULL,
  questionId NVARCHAR(50) NOT NULL,
  correctAnswer NVARCHAR(MAX) NOT NULL, -- JSON: could be "A", {"a": true, "b": false, ...}, or text
  scoringRules NVARCHAR(MAX), -- JSON for complex questions
  createdAt DATETIME DEFAULT GETUTCDATE(),
  updatedAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (examId) REFERENCES dbo.Exams(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES dbo.QuestionStructures(id) ON DELETE NO ACTION,
  UNIQUE (questionId)
);

CREATE INDEX IX_AnswerKeys_ExamId ON dbo.AnswerKeys(examId);
CREATE INDEX IX_AnswerKeys_QuestionId ON dbo.AnswerKeys(questionId);

-- ============================================================================
-- EXPLANATIONS TABLE (explanations/solutions for questions)
-- ============================================================================
CREATE TABLE dbo.Explanations (
  id NVARCHAR(50) PRIMARY KEY,
  examId NVARCHAR(50) NOT NULL,
  questionId NVARCHAR(50) NOT NULL,
  text NVARCHAR(MAX) NOT NULL, -- Markdown or HTML explanation
  videoUrl NVARCHAR(MAX), -- Optional video link
  imageUrl NVARCHAR(MAX), -- Optional image/diagram link
  createdAt DATETIME DEFAULT GETUTCDATE(),
  updatedAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (examId) REFERENCES dbo.Exams(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES dbo.QuestionStructures(id) ON DELETE NO ACTION,
  UNIQUE (questionId)
);

CREATE INDEX IX_Explanations_ExamId ON dbo.Explanations(examId);
CREATE INDEX IX_Explanations_QuestionId ON dbo.Explanations(questionId);

-- ============================================================================
-- ATTEMPTS TABLE (student exam submission records)
-- ============================================================================
CREATE TABLE dbo.Attempts (
  id NVARCHAR(50) PRIMARY KEY,
  examId NVARCHAR(50) NOT NULL,
  studentId NVARCHAR(50) NOT NULL,
  score DECIMAL(5, 2) NOT NULL DEFAULT 0, -- Out of 10
  correctCount INT DEFAULT 0,
  wrongCount INT DEFAULT 0,
  emptyCount INT DEFAULT 0,
  timeSpent INT DEFAULT 0, -- in seconds
  submittedAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (examId) REFERENCES dbo.Exams(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES dbo.Users(id) ON DELETE CASCADE
);

CREATE INDEX IX_Attempts_ExamId ON dbo.Attempts(examId);
CREATE INDEX IX_Attempts_StudentId ON dbo.Attempts(studentId);
CREATE INDEX IX_Attempts_SubmittedAt ON dbo.Attempts(submittedAt);

-- ============================================================================
-- ATTEMPT ANSWERS TABLE (individual answers per attempt per question)
-- ============================================================================
CREATE TABLE dbo.AttemptAnswers (
  id NVARCHAR(50) PRIMARY KEY,
  attemptId NVARCHAR(50) NOT NULL,
  questionId NVARCHAR(50) NOT NULL,
  selectedOption NVARCHAR(MAX), -- For single_choice: "A", "B", etc., or NULL
  trueFalseAnswers NVARCHAR(MAX), -- JSON: {"a": true, "b": false, ...} for true_false
  shortAnswer NVARCHAR(MAX), -- For short_answer: text
  isCorrect BIT, -- 1 = correct, 0 = wrong, NULL = empty/unanswered
  points DECIMAL(5, 2) DEFAULT 0,
  createdAt DATETIME DEFAULT GETUTCDATE(),
  FOREIGN KEY (attemptId) REFERENCES dbo.Attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES dbo.QuestionStructures(id)
);

CREATE INDEX IX_AttemptAnswers_AttemptId ON dbo.AttemptAnswers(attemptId);
CREATE INDEX IX_AttemptAnswers_QuestionId ON dbo.AttemptAnswers(questionId);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert Subjects
INSERT INTO dbo.Subjects (id, name, icon, color, description) VALUES
(N'math', N'Toán học', N'Calculator', N'bg-blue-500', N'Luyện tập các chuyên đề Giải tích và Hình học.'),
(N'english', N'Tiếng Anh', N'Languages', N'bg-indigo-500', N'Ngữ pháp, từ vựng và kỹ năng đọc hiểu.'),
(N'physics', N'Vật lý', N'Zap', N'bg-orange-500', N'Cơ học, Điện học, Quang học và Vật lý hạt nhân.'),
(N'chemistry', N'Hóa học', N'Beaker', N'bg-emerald-500', N'Hóa vô cơ và Hóa hữu cơ chuyên sâu.'),
(N'biology', N'Sinh học', N'Dna', N'bg-green-500', N'Di truyền học, Tiến hóa và Sinh thái học.'),
(N'literature', N'Ngữ văn', N'BookOpen', N'bg-rose-500', N'Phân tích tác phẩm và Nghị luận xã hội.');

PRINT '✅ Subjects inserted!';

-- ============================================================================
-- INSERT USERS
-- ============================================================================
-- Admin account (password hashed: admin123)
INSERT INTO dbo.Users (id, email, password, name, role, isActive) VALUES
(N'admin-001', N'admin@thpt.edu.vn', N'$2a$10$Ej85lx1Q8wRFFhfN9KKJu.fOKMrVhSqw6k2XqWWWZnP6J6J7z1jGi', N'Quản trị viên', N'admin', 1);

-- Student account (password hashed: student123)
INSERT INTO dbo.Users (id, email, password, name, role, isActive) VALUES
(N'student-001', N'student@thpt.edu.vn', N'$2a$10$xJ6R3KJ9LK0MNaBcDeF1gOjp8Q3RtWxYzAbCdEfGhIjKlMnOpQrSm', N'Nguyễn Văn A', N'student', 1);

PRINT '✅ Users inserted!';

-- ============================================================================
-- INSERT EXAMS
-- ============================================================================
INSERT INTO dbo.Exams (id, subjectId, title, examCode, durationMinutes, status, totalQuestions, createdBy) VALUES
(N'exam-001', N'math', N'Đề thi tốt nghiệp THPT 2025 - Mã đề 0119', N'0119', 90, N'published', 22, N'admin-001');

PRINT '✅ Exams inserted!';

-- ============================================================================
-- INSERT EXAM IMAGES (4 pages)
-- ============================================================================
INSERT INTO dbo.ExamImages (id, examId, pageNumber, imageUrl) VALUES
('img-001', 'exam-001', 1, 'https://picsum.photos/seed/exam1/1200/1600'),
('img-002', 'exam-001', 2, 'https://picsum.photos/seed/exam2/1200/1600'),
('img-003', 'exam-001', 3, 'https://picsum.photos/seed/exam3/1200/1600'),
('img-004', 'exam-001', 4, 'https://picsum.photos/seed/exam4/1200/1600');

PRINT '✅ Exam images inserted!';

-- ============================================================================
-- INSERT QUESTION STRUCTURES (Part 1: 12 single_choice)
-- ============================================================================
INSERT INTO dbo.QuestionStructures (id, examId, questionNumber, label, type, part, options) VALUES
('q1', 'exam-001', 1, N'Câu 1', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q2', 'exam-001', 2, N'Câu 2', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q3', 'exam-001', 3, N'Câu 3', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q4', 'exam-001', 4, N'Câu 4', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q5', 'exam-001', 5, N'Câu 5', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q6', 'exam-001', 6, N'Câu 6', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q7', 'exam-001', 7, N'Câu 7', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q8', 'exam-001', 8, N'Câu 8', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q9', 'exam-001', 9, N'Câu 9', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q10', 'exam-001', 10, N'Câu 10', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q11', 'exam-001', 11, N'Câu 11', 'single_choice', 1, '["A", "B", "C", "D"]'),
('q12', 'exam-001', 12, N'Câu 12', 'single_choice', 1, '["A", "B", "C", "D"]');

PRINT '✅ Part I Questions inserted!';

-- ============================================================================
-- INSERT QUESTION STRUCTURES (Part 2: 4 true_false)
-- ============================================================================
INSERT INTO dbo.QuestionStructures (id, examId, questionNumber, label, type, part, subQuestions) VALUES
('q13', 'exam-001', 13, N'Câu 13', 'true_false', 2, '["a", "b", "c", "d"]'),
('q14', 'exam-001', 14, N'Câu 14', 'true_false', 2, '["a", "b", "c", "d"]'),
('q15', 'exam-001', 15, N'Câu 15', 'true_false', 2, '["a", "b", "c", "d"]'),
('q16', 'exam-001', 16, N'Câu 16', 'true_false', 2, '["a", "b", "c", "d"]');

PRINT '✅ Part II Questions inserted!';

-- ============================================================================
-- INSERT QUESTION STRUCTURES (Part 3: 6 short_answer)
-- ============================================================================
INSERT INTO dbo.QuestionStructures (id, examId, questionNumber, label, type, part) VALUES
('q17', 'exam-001', 17, N'Câu 17', 'short_answer', 3),
('q18', 'exam-001', 18, N'Câu 18', 'short_answer', 3),
('q19', 'exam-001', 19, N'Câu 19', 'short_answer', 3),
('q20', 'exam-001', 20, N'Câu 20', 'short_answer', 3),
('q21', 'exam-001', 21, N'Câu 21', 'short_answer', 3),
('q22', 'exam-001', 22, N'Câu 22', 'short_answer', 3);

PRINT '✅ Part III Questions inserted!';

-- ============================================================================
-- INSERT ANSWER KEYS (Part 1)
-- ============================================================================
INSERT INTO dbo.AnswerKeys (id, examId, questionId, correctAnswer) VALUES
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
('ak12', 'exam-001', 'q12', '"A"');

PRINT '✅ Part I Answer Keys inserted!';

-- ============================================================================
-- INSERT ANSWER KEYS (Part 2 - true_false with JSON)
-- ============================================================================
INSERT INTO dbo.AnswerKeys (id, examId, questionId, correctAnswer) VALUES
('ak13', 'exam-001', 'q13', '{"a":true,"b":false,"c":false,"d":true}'),
('ak14', 'exam-001', 'q14', '{"a":true,"b":false,"c":true,"d":false}'),
('ak15', 'exam-001', 'q15', '{"a":false,"b":true,"c":true,"d":false}'),
('ak16', 'exam-001', 'q16', '{"a":true,"b":true,"c":false,"d":false}');

PRINT '✅ Part II Answer Keys inserted!';

-- ============================================================================
-- INSERT ANSWER KEYS (Part 3 - short answers)
-- ============================================================================
INSERT INTO dbo.AnswerKeys (id, examId, questionId, correctAnswer) VALUES
('ak17', 'exam-001', 'q17', '"3780"'),
('ak18', 'exam-001', 'q18', '"95.3"'),
('ak19', 'exam-001', 'q19', '"2.08"'),
('ak20', 'exam-001', 'q20', '"2150"'),
('ak21', 'exam-001', 'q21', '"2016"'),
('ak22', 'exam-001', 'q22', '"1808"');

PRINT '✅ Part III Answer Keys inserted!';

-- ============================================================================
-- INSERT EXPLANATIONS
-- ============================================================================
INSERT INTO dbo.Explanations (id, examId, questionId, text) VALUES
(N'exp1', N'exam-001', N'q1', N'Dựa vào bảng tần số ghép nhóm, Q3 = 135.'),
(N'exp2', N'exam-001', N'q2', N'Vectơ BA + A''C'' = BC.'),
(N'exp17', N'exam-001', N'q17', N'Kết quả tính toán là 3780.'),
(N'exp22', N'exam-001', N'q22', N'Lợi nhuận tối đa đạt được tại x = 1808.');

PRINT '✅ Explanations inserted!';

PRINT '========================================';
PRINT '✅ DATABASE SCHEMA & DATA CREATED SUCCESSFULLY!';
PRINT '========================================';

-- Verify data counts
SELECT 'Subjects' as Table_Name, COUNT(*) as Row_Count FROM Subjects
UNION ALL
SELECT 'Users', COUNT(*) FROM Users
UNION ALL
SELECT 'Exams', COUNT(*) FROM Exams
UNION ALL
SELECT 'ExamImages', COUNT(*) FROM ExamImages
UNION ALL
SELECT 'QuestionStructures', COUNT(*) FROM QuestionStructures
UNION ALL
SELECT 'AnswerKeys', COUNT(*) FROM AnswerKeys
UNION ALL
SELECT 'Explanations', COUNT(*) FROM Explanations;
