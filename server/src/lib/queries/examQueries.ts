import { query, queryOne, transaction } from "../database.js";

type GetExamDetailsOptions = {
  includeAnswers?: boolean;
};

/**
 * Query: Get all exams (with optional filters)
 */
export const getAllExams = async (filters?: {
  subject?: string;
  level?: string;
  status?: string;
}) => {
  let text = `
    SELECT id, title, "subjectId", "examCode", "durationMinutes", status, "totalQuestions", "createdAt", "updatedAt"
    FROM "Exams"
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramCount = 1;

  if (filters?.subject) {
    text += ` AND "subjectId" = $${paramCount++}`;
    params.push(filters.subject);
  }

  if (filters?.status) {
    text += ` AND status = $${paramCount++}`;
    params.push(filters.status);
  }

  text += ` ORDER BY "createdAt" DESC`;

  return query(text, params);
};

/**
 * Query: Get exam by ID
 */
export const findExamById = async (id: string) => {
  const text = `
    SELECT id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "createdBy", "createdAt", "updatedAt"
    FROM "Exams"
    WHERE id = $1
  `;
  return queryOne(text, [id]);
};

/**
 * Query: Create new exam and related data
 */
export const createExamWithDetails = async (exam: any) => {
  const { 
    id, 
    subjectId, 
    title, 
    examCode, 
    durationMinutes, 
    imagePages = [], 
    questionStructure = [], 
    answerKey = {},
    explanations = {},
    status = "draft",
    createdBy
  } = exam;

  return transaction(async (client) => {
    // 1. Insert Exam record
    await client.query(`
      INSERT INTO "Exams" (
        id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "createdBy", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [id, subjectId, title, examCode, durationMinutes, status, questionStructure.length, createdBy]);

    // 2. Insert Image Pages
    if (imagePages && imagePages.length > 0) {
      for (let i = 0; i < imagePages.length; i++) {
        await client.query(`
          INSERT INTO "ExamImages" (id, "examId", "pageNumber", "imageUrl", "uploadedAt")
          VALUES ($1, $2, $3, $4, NOW())
        `, [`img-${id}-${i}`, id, i + 1, imagePages[i]]);
      }
    }

    // 3. Insert Question Structures and Answer Keys
    if (questionStructure && questionStructure.length > 0) {
      for (const [index, q] of questionStructure.entries()) {
        await client.query(`
          INSERT INTO "QuestionStructures" (id, "examId", "questionNumber", label, type, part, options, "subQuestions", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          q.id, 
          id, 
          q.questionNumber || index + 1, 
          q.label, 
          q.type, 
          q.part, 
          JSON.stringify(q.options || []), 
          JSON.stringify(q.subQuestions || [])
        ]);

        // Insert Answer Key if exists
        const aKey = answerKey[q.id];
        if (aKey !== undefined) {
          await client.query(`
            INSERT INTO "AnswerKeys" (id, "examId", "questionId", "correctAnswer", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [`ak-${q.id}`, id, q.id, JSON.stringify(aKey)]);
        }

        // Insert Explanation if exists
        const expl = explanations[q.id];
        if (expl) {
          await client.query(`
            INSERT INTO "Explanations" (id, "examId", "questionId", text, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [`exp-${q.id}`, id, q.id, expl]);
        }
      }
    }

    return true;
  });
};

/**
 * Query: Get exam with full details (questions, images, answer keys)
 */
export const getExamWithDetails = async (id: string, options: GetExamDetailsOptions = {}) => {
  const examText = `
    SELECT id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "createdAt", "updatedAt"
    FROM "Exams"
    WHERE id = $1
  `;
  const exam = await queryOne(examText, [id]);
  if (!exam) return null;

  // Get images
  const images = await query(
    `SELECT "imageUrl" FROM "ExamImages" WHERE "examId" = $1 ORDER BY "pageNumber"`,
    [id]
  );

  // Get questions
  const questions = await query(
    `SELECT id, "questionNumber", type, label, part, options, "subQuestions" FROM "QuestionStructures" WHERE "examId" = $1 ORDER BY part, "questionNumber", label`,
    [id]
  );

  const answerKey: Record<string, any> = {};
  const explanations: Record<string, string> = {};

  if (options.includeAnswers) {
    const keys = await query(
      `SELECT "questionId", "correctAnswer" FROM "AnswerKeys" WHERE "examId" = $1`,
      [id]
    );

    const expls = await query(
      `SELECT "questionId", text FROM "Explanations" WHERE "examId" = $1`,
      [id]
    );

    keys.forEach(k => {
      answerKey[k.questionId] = k.correctAnswer; // pg handles JSONB automatically
    });

    expls.forEach(e => {
      explanations[e.questionId] = e.text;
    });
  }

  const questionStructure = questions.map(q => {
    return {
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []),
      subQuestions: typeof q.subQuestions === 'string' ? JSON.parse(q.subQuestions) : (q.subQuestions || [])
    };
  });

  return {
    ...exam,
    imagePages: images.map(img => img.imageUrl),
    questionStructure,
    ...(options.includeAnswers ? { answerKey, explanations } : {})
  };
};

/**
 * Query: Update exam metadata safely.
 */
export const updateExamMetadata = async (id: string, updates: any) => {
  const setClause: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  const allowedFields = ["subjectId", "title", "examCode", "durationMinutes", "status"];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClause.push(`"${field}" = $${paramCount++}`);
      params.push(updates[field]);
    }
  }

  if (setClause.length === 0) {
    return getExamWithDetails(id, { includeAnswers: true });
  }

  setClause.push(`"updatedAt" = NOW()`);
  params.push(id);
  const idParamIndex = paramCount;

  await query(
    `
    UPDATE "Exams"
    SET ${setClause.join(", ")}
    WHERE id = $${idParamIndex}
  `,
    params
  );

  return getExamWithDetails(id, { includeAnswers: true });
};

/**
 * Query: Delete exam
 */
export const deleteExamFull = async (id: string) => {
  return transaction(async (client) => {
    // Delete attempt answers using a subquery or join for PostgreSQL
    await client.query(`
      DELETE FROM "AttemptAnswers"
      WHERE "attemptId" IN (SELECT id FROM "Attempts" WHERE "examId" = $1)
    `, [id]);

    await client.query(`DELETE FROM "Attempts" WHERE "examId" = $1`, [id]);
    await client.query(`DELETE FROM "AnswerKeys" WHERE "examId" = $1`, [id]);
    await client.query(`DELETE FROM "Explanations" WHERE "examId" = $1`, [id]);
    await client.query(`DELETE FROM "QuestionStructures" WHERE "examId" = $1`, [id]);
    await client.query(`DELETE FROM "ExamImages" WHERE "examId" = $1`, [id]);
    await client.query(`DELETE FROM "Exams" WHERE id = $1`, [id]);

    return true;
  });
};
