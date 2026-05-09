IF OBJECT_ID('dbo.UploadedFiles', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.UploadedFiles (
    id NVARCHAR(50) PRIMARY KEY,
    originalName NVARCHAR(255) NOT NULL,
    filename NVARCHAR(255) NOT NULL,
    url NVARCHAR(MAX) NOT NULL,
    mimeType NVARCHAR(100) NOT NULL,
    sizeBytes INT NOT NULL,
    uploadedBy NVARCHAR(50) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_UploadedFiles_Users FOREIGN KEY (uploadedBy) REFERENCES dbo.Users(id)
  );
END;

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notifications (
    id NVARCHAR(50) PRIMARY KEY,
    userId NVARCHAR(50) NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(20) NOT NULL DEFAULT N'info',
    isRead BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (userId) REFERENCES dbo.Users(id) ON DELETE CASCADE
  );
END;

;MERGE dbo.Subjects AS target
USING (VALUES
  (N'math', N'Toán học', N'Calculator', N'bg-blue-500', N'Luyện tập các chuyên đề Giải tích và Hình học.'),
  (N'english', N'Tiếng Anh', N'Languages', N'bg-indigo-500', N'Ngữ pháp, từ vựng và kỹ năng đọc hiểu.'),
  (N'physics', N'Vật lý', N'Zap', N'bg-orange-500', N'Cơ học, Điện học, Quang học và Vật lý hạt nhân.'),
  (N'chemistry', N'Hóa học', N'Beaker', N'bg-emerald-500', N'Hóa vô cơ và Hóa hữu cơ chuyên sâu.'),
  (N'biology', N'Sinh học', N'Dna', N'bg-green-500', N'Di truyền học, Tiến hóa và Sinh thái học.'),
  (N'literature', N'Ngữ văn', N'BookOpen', N'bg-rose-500', N'Phân tích tác phẩm và Nghị luận xã hội.')
) AS source (id, name, icon, color, description)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    name = source.name,
    icon = source.icon,
    color = source.color,
    description = source.description,
    updatedAt = GETUTCDATE()
WHEN NOT MATCHED THEN
  INSERT (id, name, icon, color, description, createdAt, updatedAt)
  VALUES (source.id, source.name, source.icon, source.color, source.description, GETUTCDATE(), GETUTCDATE());

IF EXISTS (SELECT 1 FROM dbo.Users WHERE id = N'admin-001')
BEGIN
  UPDATE dbo.Users
  SET name = N'Quản trị viên', role = N'admin', isActive = 1, updatedAt = GETUTCDATE()
  WHERE id = N'admin-001';
END
ELSE
BEGIN
  INSERT INTO dbo.Users (id, email, password, name, role, isActive, createdAt, updatedAt)
  VALUES (
    N'admin-001',
    N'admin@thpt.edu.vn',
    N'$2a$10$MH3M.OR9bQbjpi4/LNYbe.G8n8deM0ahW.tqtWTwafOkS52yzc3tq',
    N'Quản trị viên',
    N'admin',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  );
END;

IF EXISTS (SELECT 1 FROM dbo.Users WHERE id = N'student-001')
BEGIN
  UPDATE dbo.Users
  SET name = N'Nguyễn Văn A', role = N'student', isActive = 1, updatedAt = GETUTCDATE()
  WHERE id = N'student-001';
END
ELSE
BEGIN
  INSERT INTO dbo.Users (id, email, password, name, role, isActive, createdAt, updatedAt)
  VALUES (
    N'student-001',
    N'student@thpt.edu.vn',
    N'$2a$10$AcDtMptB4LmU2dDJx1m4m.r7g2KGbPdBRGXa0z6YHKbzRGE6aSncK',
    N'Nguyễn Văn A',
    N'student',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  );
END;

UPDATE dbo.Exams
SET
  title = N'Đề thi tốt nghiệp THPT 2025 - Mã đề 0119',
  totalQuestions = 22,
  updatedAt = GETUTCDATE()
WHERE id = N'exam-001';

UPDATE dbo.QuestionStructures
SET label = N'Câu ' + CAST(questionNumber AS NVARCHAR(10))
WHERE examId = N'exam-001' AND questionNumber BETWEEN 1 AND 22;

UPDATE dbo.Explanations
SET [text] = N'Dựa vào bảng tần số ghép nhóm, Q3 = 135.', updatedAt = GETUTCDATE()
WHERE id = N'exp1';

UPDATE dbo.Explanations
SET [text] = N'Vectơ BA + A''C'' = BC.', updatedAt = GETUTCDATE()
WHERE id = N'exp2';

UPDATE dbo.Explanations
SET [text] = N'Kết quả tính toán là 3780.', updatedAt = GETUTCDATE()
WHERE id = N'exp17';

UPDATE dbo.Explanations
SET [text] = N'Lợi nhuận tối đa đạt được tại x = 1808.', updatedAt = GETUTCDATE()
WHERE id = N'exp22';
