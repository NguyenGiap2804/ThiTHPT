// User model
export interface User {
  id: string;
  email: string;
  password?: string; // Excluded when returning to client
  name: string;
  role: "student" | "admin";
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Exam model
export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  examCode: string;
  durationMinutes: number;
  status: "draft" | "published" | "hidden";
  totalQuestions: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Question structure model
export interface QuestionStructure {
  id: string;
  examId: string;
  questionNumber: number;
  label: string; // e.g., "Câu 1", "Câu 13a"
  type: "single_choice" | "true_false" | "short_answer";
  part: number; // 1, 2, or 3
  options?: string[]; // ["A", "B", "C", "D"]
  subQuestions?: string[]; // ["a", "b", "c", "d"]
  createdAt: Date;
}

// Answer key model
export interface AnswerKey {
  id: string;
  examId: string;
  questionId: string;
  correctAnswer: any; // Can be string ("A"), object ({"a": true, ...}), or other formats
  scoringRules?: any; // JSON for complex scoring
  createdAt: Date;
  updatedAt: Date;
}

// Explanation model
export interface Explanation {
  id: string;
  examId: string;
  questionId: string;
  text: string;
  videoUrl?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attempt model (exam submission record)
export interface Attempt {
  id: string;
  examId: string;
  studentId: string;
  score: number; // Out of 10
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  timeSpent: number; // in seconds
  submittedAt: Date;
}

// Attempt answer model (individual answer per question)
export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption?: string; // For single_choice: "A", "B", etc.
  trueFalseAnswers?: Record<string, boolean>; // {"a": true, "b": false, ...}
  shortAnswer?: string;
  isCorrect?: boolean;
  points: number;
  createdAt: Date;
}

// Request/Response DTOs
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: "student" | "admin";
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateExamRequest {
  subjectId: string;
  title: string;
  examCode: string;
  durationMinutes: number;
  status?: "draft" | "published" | "hidden";
}

export interface CreateAttemptRequest {
  examId: string;
  answers: Array<{
    questionId: string;
    selectedOption?: string;
    trueFalseAnswers?: Record<string, boolean>;
    shortAnswer?: string;
  }>;
  timeSpent: number;
}
