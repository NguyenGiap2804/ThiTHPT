export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type SubjectId = 'math' | 'english' | 'physics' | 'chemistry' | 'biology' | 'literature' | 'other';

export interface Subject {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export type QuestionType = 'single_choice' | 'true_false' | 'short_answer';

export interface QuestionStructure {
  id: string;
  type: QuestionType;
  label: string; // e.g., "Câu 1", "Câu 13a"
  part: number;
  options?: string[]; // For single_choice, e.g., ['A', 'B', 'C', 'D']
  subQuestions?: string[]; // For true_false, e.g., ['a', 'b', 'c', 'd']
}

export interface Exam {
  id: string;
  subjectId: SubjectId;
  title: string;
  examCode: string;
  durationMinutes: number;
  pdfUrl?: string; // Main PDF file URL
  imagePages?: string[]; // Legacy: URLs to images of the exam pages
  questionStructure?: QuestionStructure[];
  answerKey?: Record<string, any>; // Admin/result-only: questionId -> correct answer
  explanations?: Record<string, string>; // Admin/result-only: questionId -> explanation text
  totalQuestions?: number;
  status: 'draft' | 'published' | 'hidden';
  attemptCount?: number;
  isFeatured?: boolean;
  stats?: {
    attemptCount: number;
    averageScore: number;
    difficulty: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOption?: string | null; // For single_choice
  trueFalseAnswers?: Record<string, boolean | null>; // For true_false: subQuestion -> boolean
  shortAnswer?: string; // For short_answer
  correctAnswer?: any;
  isCorrect?: boolean | null;
  points?: number;
  explanation?: string | null;
}

export interface Attempt {
  id: string;
  examId: string;
  subjectId: SubjectId;
  examTitle: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  timeSpent: number; // in seconds
  date: string;
  answers?: AttemptAnswer[];
}

export interface AdminStats {
  totalExams: number;
  totalAttempts: number;
  totalStudents: number;
  unreadNotifications: number;
  averageScore: number | null;
  recentAttempts: Array<{
    id: string;
    score: number;
    submittedAt: string;
    studentName: string;
    examTitle: string;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSystemStatus {
  apiStatus: 'ok';
  databaseName: string | null;
  serverTime: string;
  sqlVersion: string | null;
  stats: AdminStats;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}
