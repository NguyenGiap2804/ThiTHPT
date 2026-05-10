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
    SELECT e.id, e.title, e."subjectId", e."examCode", e."durationMinutes", e.status, e."totalQuestions", e."pdfUrl", e."createdAt", e."updatedAt",
           COALESCE(s."attemptCount", 0) as "attemptCount"
    FROM "Exams" e
    LEFT JOIN (
      SELECT "examId", COUNT(id) as "attemptCount"
      FROM "Attempts"
      GROUP BY "examId"
    ) s ON e.id = s."examId"
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
    SELECT id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "pdfUrl", "createdBy", "createdAt", "updatedAt"
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
    pdfUrl,
    createdBy
  } = exam;

  return transaction(async (client) => {
    // 1. Insert Exam record
    await client.query(`
      INSERT INTO "Exams" (
        id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "pdfUrl", "createdBy", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `, [id, subjectId, title, examCode, durationMinutes, status, questionStructure.length, pdfUrl, createdBy]);

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
    SELECT id, "subjectId", title, "examCode", "durationMinutes", status, "totalQuestions", "pdfUrl", "createdAt", "updatedAt"
    FROM "Exams"
    WHERE id = $1
  `;
  const exam = await queryOne(examText, [id]);
  if (!exam) return null;

  const imagesPromise = query(
    `SELECT "imageUrl" FROM "ExamImages" WHERE "examId" = $1 ORDER BY "pageNumber"`,
    [id]
  );

  const questionsPromise = query(
    `SELECT id, "questionNumber", type, label, part, options, "subQuestions" FROM "QuestionStructures" WHERE "examId" = $1 ORDER BY part, "questionNumber", label`,
    [id]
  );

  const keysPromise = options.includeAnswers ? query(
      `SELECT "questionId", "correctAnswer" FROM "AnswerKeys" WHERE "examId" = $1`,
      [id]
    ) : Promise.resolve([]);

  const explsPromise = options.includeAnswers ? query(
      `SELECT "questionId", text FROM "Explanations" WHERE "examId" = $1`,
      [id]
    ) : Promise.resolve([]);

  const statsPromise = queryOne(
    `
    SELECT 
      COUNT(id) as "attemptCount", 
      AVG(score) as "averageScore" 
    FROM "Attempts" 
    WHERE "examId" = $1
    `,
    [id]
  );

  const [images, questions, keys, expls, stats] = await Promise.all([
    imagesPromise,
    questionsPromise,
    keysPromise,
    explsPromise,
    statsPromise,
  ]);

  const answerKey: Record<string, any> = {};
  const explanations: Record<string, string> = {};

  if (options.includeAnswers) {
    keys.forEach(k => {
      answerKey[k.questionId] = k.correctAnswer; // pg handles JSONB automatically
    });

    expls.forEach(e => {
      explanations[e.questionId] = e.text;
    });
  }

  const attemptCount = parseInt(stats?.attemptCount || '0');
  const averageScore = parseFloat(stats?.averageScore || '0');
  
  let difficulty = 'Trung bình';
  if (attemptCount > 0) {
    if (averageScore < 5) difficulty = 'Khó';
    else if (averageScore > 8) difficulty = 'Dễ';
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
    stats: {
      attemptCount,
      averageScore,
      difficulty
    },
    ...(options.includeAnswers ? { answerKey, explanations } : {})
  };
};

/**
 * Query: Update exam metadata safely.
 */
export const updateExamMetadata = async (id: string, updates: any) => {
  await transaction(async (client) => {
    const setClause: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    const allowedFields = ["subjectId", "title", "examCode", "durationMinutes", "status", "pdfUrl"];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`"${field}" = $${paramCount++}`);
        params.push(updates[field]);
      }
    }

    if (Array.isArray(updates.questionStructure)) {
      setClause.push(`"totalQuestions" = $${paramCount++}`);
      params.push(updates.questionStructure.length);
    }

    if (setClause.length > 0) {
      setClause.push(`"updatedAt" = NOW()`);
      params.push(id);
      const idParamIndex = paramCount;

      await client.query(
        `
        UPDATE "Exams"
        SET ${setClause.join(", ")}
        WHERE id = $${idParamIndex}
        `,
        params
      );
    }

    if (Array.isArray(updates.imagePages)) {
      await client.query(`DELETE FROM "ExamImages" WHERE "examId" = $1`, [id]);
      for (let i = 0; i < updates.imagePages.length; i++) {
        await client.query(
          `
          INSERT INTO "ExamImages" (id, "examId", "pageNumber", "imageUrl", "uploadedAt")
          VALUES ($1, $2, $3, $4, NOW())
          `,
          [`img-${Date.now()}-${i}`, id, i + 1, updates.imagePages[i]]
        );
      }
    }

    if (Array.isArray(updates.questionStructure)) {
      const attemptCountResult = await client.query(
        `SELECT COUNT(*) as count FROM "Attempts" WHERE "examId" = $1`,
        [id]
      );
      const attemptCount = Number(attemptCountResult.rows[0]?.count ?? 0);
      const existingResult = await client.query(
        `SELECT id FROM "QuestionStructures" WHERE "examId" = $1 ORDER BY "questionNumber"`,
        [id]
      );
      const existingIds = existingResult.rows.map((row) => row.id);
      const nextIds = updates.questionStructure.map((q: any, index: number) => q.id || `${id}-q${index + 1}`);

      if (
        attemptCount > 0 &&
        (existingIds.length !== nextIds.length || existingIds.some((item, index) => item !== nextIds[index]))
      ) {
        throw new Error("Không thể thay đổi số lượng hoặc ID câu hỏi sau khi đề đã có lượt làm bài. Chỉ nên sửa đáp án, lời giải, file ảnh và metadata.");
      }

      if (attemptCount === 0) {
        await client.query(`DELETE FROM "AnswerKeys" WHERE "examId" = $1`, [id]);
        await client.query(`DELETE FROM "Explanations" WHERE "examId" = $1`, [id]);
        await client.query(`DELETE FROM "QuestionStructures" WHERE "examId" = $1`, [id]);

        for (const [index, q] of updates.questionStructure.entries()) {
          const questionId = q.id || `${id}-q${index + 1}`;
          await client.query(
            `
            INSERT INTO "QuestionStructures" (id, "examId", "questionNumber", label, type, part, options, "subQuestions", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `,
            [
              questionId,
              id,
              q.questionNumber || index + 1,
              q.label || `Câu ${index + 1}`,
              q.type,
              q.part,
              JSON.stringify(q.options || []),
              JSON.stringify(q.subQuestions || []),
            ]
          );
        }
      } else {
        for (const [index, q] of updates.questionStructure.entries()) {
          await client.query(
            `
            UPDATE "QuestionStructures"
            SET "questionNumber" = $1, label = $2, type = $3, part = $4, options = $5, "subQuestions" = $6
            WHERE id = $7 AND "examId" = $8
            `,
            [
              q.questionNumber || index + 1,
              q.label || `Câu ${index + 1}`,
              q.type,
              q.part,
              JSON.stringify(q.options || []),
              JSON.stringify(q.subQuestions || []),
              q.id,
              id,
            ]
          );
        }
      }
    }

    if (updates.answerKey && typeof updates.answerKey === "object") {
      await client.query(`DELETE FROM "AnswerKeys" WHERE "examId" = $1`, [id]);
      for (const [questionId, correctAnswer] of Object.entries(updates.answerKey)) {
        if (correctAnswer === undefined || correctAnswer === null || correctAnswer === "") continue;
        await client.query(
          `
          INSERT INTO "AnswerKeys" (id, "examId", "questionId", "correctAnswer", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT ("questionId")
          DO UPDATE SET "correctAnswer" = EXCLUDED."correctAnswer", "updatedAt" = NOW()
          `,
          [`ak-${questionId}`, id, questionId, JSON.stringify(correctAnswer)]
        );
      }
    }

    if (updates.explanations && typeof updates.explanations === "object") {
      await client.query(`DELETE FROM "Explanations" WHERE "examId" = $1`, [id]);
      for (const [questionId, explanation] of Object.entries(updates.explanations)) {
        if (!String(explanation ?? "").trim()) continue;
        await client.query(
          `
          INSERT INTO "Explanations" (id, "examId", "questionId", text, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT ("questionId")
          DO UPDATE SET text = EXCLUDED.text, "updatedAt" = NOW()
          `,
          [`exp-${questionId}`, id, questionId, String(explanation)]
        );
      }
    }
  });

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
