import { query, queryOne } from "../database.js";

export type SubmittedAttemptAnswer = {
  questionId: string;
  selectedOption?: string | null;
  trueFalseAnswers?: Record<string, boolean | null>;
  shortAnswer?: string | null;
};

export type ScoredAttemptAnswer = SubmittedAttemptAnswer & {
  correctAnswer: unknown;
  isCorrect: boolean | null;
  points: number;
  explanation?: string | null;
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const parseStringArray = (value: unknown, fallback: string[] = []): string[] => {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.map(String) : fallback;
};

/**
 * Query: Create a new attempt.
 */
export const createAttempt = async (
  id: string,
  examId: string,
  userId: string,
  score: number,
  correctCount: number,
  wrongCount: number,
  emptyCount: number,
  timeSpent: number
) => {
  const text = `
    INSERT INTO "Attempts" (
      id, "examId", "studentId", score, "correctCount", "wrongCount", "emptyCount", "timeSpent", "submittedAt"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, NOW()
    )
    RETURNING id
  `;

  const result = await queryOne(text, [
    id,
    examId,
    userId,
    score,
    correctCount,
    wrongCount,
    emptyCount,
    timeSpent,
  ]);

  return result ? findAttemptById(id) : null;
};

/**
 * Query: Find attempt by ID.
 */
export const findAttemptById = async (id: string) => {
  const text = `
    SELECT
      a.id,
      a."examId",
      a."studentId" as "userId",
      e."subjectId",
      e.title as "examTitle",
      a.score,
      a."correctCount",
      a."wrongCount",
      a."emptyCount",
      a."timeSpent",
      a."submittedAt" as "date"
    FROM "Attempts" a
    JOIN "Exams" e ON a."examId" = e.id
    WHERE a.id = $1
  `;
  return queryOne(text, [id]);
};

/**
 * Query: Get all attempts for a user.
 */
export const getUserAttempts = async (userId: string) => {
  const text = `
    SELECT
      a.id,
      a."examId",
      e."subjectId",
      e.title as "examTitle",
      a.score,
      a."correctCount",
      a."wrongCount",
      a."emptyCount",
      a."timeSpent",
      a."submittedAt" as "date"
    FROM "Attempts" a
    JOIN "Exams" e ON a."examId" = e.id
    WHERE a."studentId" = $1
    ORDER BY a."submittedAt" DESC
  `;
  return query(text, [userId]);
};

/**
 * Query: Get attempt with detailed answers.
 */
export const getAttemptWithDetails = async (id: string) => {
  const attempt = await findAttemptById(id);
  if (!attempt) return null;

  const rows = await query(
    `
    SELECT
      aa."questionId",
      aa."selectedOption",
      aa."trueFalseAnswers",
      aa."shortAnswer",
      aa."isCorrect",
      aa.points,
      q.label,
      q.type,
      q.part,
      q.options,
      q."subQuestions",
      ak."correctAnswer",
      ex.text as explanation
    FROM "AttemptAnswers" aa
    JOIN "QuestionStructures" q ON aa."questionId" = q.id
    LEFT JOIN "AnswerKeys" ak ON q.id = ak."questionId"
    LEFT JOIN "Explanations" ex ON q.id = ex."questionId"
    WHERE aa."attemptId" = $1
    ORDER BY q.part, q."questionNumber", q.label
  `,
    [id]
  );

  const answers = rows.map((row: any) => ({
    questionId: row.questionId,
    selectedOption: row.selectedOption,
    trueFalseAnswers: parseJson(row.trueFalseAnswers),
    shortAnswer: row.shortAnswer,
    correctAnswer: parseJson(row.correctAnswer),
    isCorrect: row.isCorrect,
    points: Number(row.points ?? 0),
    explanation: row.explanation ?? null,
  }));

  return {
    ...attempt,
    answers,
  };
};

/**
 * Query: Save a user's answer for an attempt.
 */
export const saveAttemptAnswer = async (
  id: string,
  attemptId: string,
  answer: ScoredAttemptAnswer
) => {
  const text = `
    INSERT INTO "AttemptAnswers" (
      id, "attemptId", "questionId", "selectedOption", "trueFalseAnswers", "shortAnswer", "isCorrect", points, "createdAt"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, NOW()
    )
  `;

  return query(text, [
    id,
    attemptId,
    answer.questionId,
    answer.selectedOption ?? null,
    answer.trueFalseAnswers ? JSON.stringify(answer.trueFalseAnswers) : null,
    answer.shortAnswer ?? null,
    answer.isCorrect,
    answer.points,
  ]);
};

/**
 * Query: Get correct answers and scoring metadata for an exam.
 */
export const getExamAnswerKey = async (examId: string) => {
  const text = `
    SELECT
      q.id as "questionId",
      q.type,
      q.part,
      q."subQuestions",
      ak."correctAnswer",
      ex.text as explanation
    FROM "QuestionStructures" q
    LEFT JOIN "AnswerKeys" ak ON q.id = ak."questionId"
    LEFT JOIN "Explanations" ex ON q.id = ex."questionId"
    WHERE q."examId" = $1
    ORDER BY q.part, q."questionNumber", q.label
  `;
  return query(text, [examId]);
};

/**
 * Query: Calculate score for submitted answers.
 */
export const calculateAttemptScore = async (
  userAnswers: SubmittedAttemptAnswer[],
  examId: string
): Promise<{
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  totalCount: number;
  score: number;
  details: ScoredAttemptAnswer[];
}> => {
  const answerRows = await getExamAnswerKey(examId);
  const submittedByQuestion = new Map(userAnswers.map((answer) => [answer.questionId, answer]));

  let rawScore = 0;
  let maxRawScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;

  const details = answerRows.map((row: any): ScoredAttemptAnswer => {
    maxRawScore += 1;

    const submitted = (submittedByQuestion.get(row.questionId) || { questionId: row.questionId }) as SubmittedAttemptAnswer;
    const correctAnswer = parseJson(row.correctAnswer);
    let points = 0;
    let isCorrect: boolean | null = false;
    let isEmpty = false;

    if (row.type === "single_choice") {
      const selectedOption = submitted.selectedOption || null;
      isEmpty = !selectedOption;
      isCorrect = !isEmpty && normalizeText(selectedOption) === normalizeText(correctAnswer);
      points = isCorrect ? 1 : 0;
    } else if (row.type === "true_false") {
      const subQuestions = parseStringArray(row.subQuestions, ["a", "b", "c", "d"]);
      const expected = typeof correctAnswer === "object" && correctAnswer !== null ? correctAnswer as Record<string, boolean> : {};
      const actual = submitted.trueFalseAnswers || {};
      const answeredCount = subQuestions.filter((sub: string) => actual[sub] !== undefined && actual[sub] !== null).length;
      const subCorrect = subQuestions.filter((sub: string) => actual[sub] === expected[sub]).length;

      isEmpty = answeredCount === 0;
      isCorrect = !isEmpty && subCorrect === subQuestions.length;
      if (subCorrect === 1) points = 0.1;
      if (subCorrect === 2) points = 0.25;
      if (subCorrect === 3) points = 0.5;
      if (subCorrect === subQuestions.length) points = 1;
    } else {
      const shortAnswer = submitted.shortAnswer || "";
      isEmpty = normalizeText(shortAnswer) === "";
      isCorrect = !isEmpty && normalizeText(shortAnswer) === normalizeText(correctAnswer);
      points = isCorrect ? 1 : 0;
    }

    if (isEmpty) {
      emptyCount += 1;
      isCorrect = null;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    rawScore += points;

    return {
      ...submitted,
      questionId: row.questionId,
      correctAnswer,
      isCorrect,
      points,
      explanation: row.explanation ?? null,
    };
  });

  const score = maxRawScore > 0 ? Number(((rawScore / maxRawScore) * 10).toFixed(2)) : 0;

  return {
    correctCount,
    wrongCount,
    emptyCount,
    totalCount: answerRows.length,
    score,
    details,
  };
};

/**
 * Query: Get attempt statistics for admin.
 */
export const getAttemptStatistics = async (examId: string) => {
  const text = `
    SELECT
      COUNT(*) as "totalAttempts",
      AVG(score) as "averageScore",
      MAX(score) as "maxScore",
      MIN(score) as "minScore",
      SUM(CASE WHEN score >= 5 THEN 1 ELSE 0 END) as "passCount"
    FROM "Attempts"
    WHERE "examId" = $1
  `;
  const stats = await queryOne(text, [examId]);
  if (stats) {
    return {
      totalAttempts: Number(stats.totalAttempts),
      averageScore: Number(stats.averageScore),
      maxScore: Number(stats.maxScore),
      minScore: Number(stats.minScore),
      passCount: Number(stats.passCount)
    };
  }
  return null;
};
