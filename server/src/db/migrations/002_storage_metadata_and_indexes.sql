ALTER TABLE "UploadedFiles"
  ADD COLUMN IF NOT EXISTS "storageProvider" VARCHAR(30) NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "objectKey" TEXT;

CREATE INDEX IF NOT EXISTS "IX_ExamImages_ExamId" ON "ExamImages"("examId");
CREATE INDEX IF NOT EXISTS "IX_ExamImages_ExamId_PageNumber" ON "ExamImages"("examId", "pageNumber");

CREATE INDEX IF NOT EXISTS "IX_QuestionStructures_ExamId" ON "QuestionStructures"("examId");
CREATE INDEX IF NOT EXISTS "IX_QuestionStructures_ExamId_QuestionNumber" ON "QuestionStructures"("examId", "questionNumber");

CREATE INDEX IF NOT EXISTS "IX_AnswerKeys_ExamId" ON "AnswerKeys"("examId");
CREATE INDEX IF NOT EXISTS "IX_AnswerKeys_QuestionId" ON "AnswerKeys"("questionId");

CREATE INDEX IF NOT EXISTS "IX_Explanations_ExamId" ON "Explanations"("examId");
CREATE INDEX IF NOT EXISTS "IX_Explanations_QuestionId" ON "Explanations"("questionId");

CREATE INDEX IF NOT EXISTS "IX_Attempts_ExamId" ON "Attempts"("examId");
CREATE INDEX IF NOT EXISTS "IX_Attempts_StudentId" ON "Attempts"("studentId");
CREATE INDEX IF NOT EXISTS "IX_Attempts_StudentId_SubmittedAt" ON "Attempts"("studentId", "submittedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_Attempts_ExamId_SubmittedAt" ON "Attempts"("examId", "submittedAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_AttemptId" ON "AttemptAnswers"("attemptId");
CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_QuestionId" ON "AttemptAnswers"("questionId");

CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications"("userId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead_CreatedAt" ON "Notifications"("userId", "isRead", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_UploadedFiles_Url" ON "UploadedFiles"(url);
CREATE INDEX IF NOT EXISTS "IX_UploadedFiles_StorageProvider" ON "UploadedFiles"("storageProvider");
