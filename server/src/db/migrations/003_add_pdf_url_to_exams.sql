-- Migration: Add pdfUrl to Exams table
-- Description: Supports direct PDF rendering instead of image pages.

ALTER TABLE "Exams" ADD COLUMN "pdfUrl" TEXT;

-- Update existing records if possible (optional logic here)
-- For this project, we'll keep them as NULL and handle fallback in frontend.
