import sql from "mssql";
import { getPool, executeQuery, executeQuerySingle, executeNonQuery } from "../database";

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
  let query = `
    SELECT id, title, subjectId, examCode, durationMinutes, status, totalQuestions, createdAt, updatedAt
    FROM Exams
    WHERE 1=1
  `;

  const params: Record<string, any> = {};

  if (filters?.subject) {
    query += ` AND subjectId = @subject`;
    params.subject = filters.subject;
  }

  if (filters?.status) {
    query += ` AND status = @status`;
    params.status = filters.status;
  }

  query += ` ORDER BY createdAt DESC`;

  return executeQuery(query, params);
};

/**
 * Query: Get exam by ID
 */
export const findExamById = async (id: string) => {
  const query = `
    SELECT id, subjectId, title, examCode, durationMinutes, status, totalQuestions, createdBy, createdAt, updatedAt
    FROM Exams
    WHERE id = @id
  `;
  return executeQuerySingle(query, { id });
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

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Insert Exam record
    const examRequest = new sql.Request(transaction);
    await examRequest
      .input("id", id)
      .input("subjectId", subjectId)
      .input("title", title)
      .input("examCode", examCode)
      .input("durationMinutes", durationMinutes)
      .input("status", status)
      .input("totalQuestions", questionStructure.length)
      .input("createdBy", createdBy)
      .query(`
        INSERT INTO Exams (
          id, subjectId, title, examCode, durationMinutes, status, totalQuestions, createdBy, createdAt, updatedAt
        )
        VALUES (
          @id, @subjectId, @title, @examCode, @durationMinutes, @status, @totalQuestions, @createdBy, GETUTCDATE(), GETUTCDATE()
        )
      `);

    // 2. Insert Image Pages
    if (imagePages && imagePages.length > 0) {
      for (let i = 0; i < imagePages.length; i++) {
        const imgRequest = new sql.Request(transaction);
        await imgRequest
          .input("id", `img-${id}-${i}`)
          .input("examId", id)
          .input("pageNumber", i + 1)
          .input("imageUrl", imagePages[i])
          .query(`
            INSERT INTO ExamImages (id, examId, pageNumber, imageUrl, uploadedAt)
            VALUES (@id, @examId, @pageNumber, @imageUrl, GETUTCDATE())
          `);
      }
    }

    // 3. Insert Question Structures and Answer Keys
    if (questionStructure && questionStructure.length > 0) {
      for (const [index, q] of questionStructure.entries()) {
        const qRequest = new sql.Request(transaction);
        await qRequest
          .input("id", q.id)
          .input("examId", id)
          .input("questionNumber", q.questionNumber || index + 1)
          .input("label", q.label)
          .input("type", q.type)
          .input("part", q.part)
          .input("options", JSON.stringify(q.options || []))
          .input("subQuestions", JSON.stringify(q.subQuestions || []))
          .query(`
            INSERT INTO QuestionStructures (id, examId, questionNumber, label, [type], part, options, subQuestions, createdAt)
            VALUES (@id, @examId, @questionNumber, @label, @type, @part, @options, @subQuestions, GETUTCDATE())
          `);

        // Insert Answer Key if exists
        const aKey = answerKey[q.id];
        if (aKey !== undefined) {
          const aRequest = new sql.Request(transaction);
          await aRequest
            .input("id", `ak-${q.id}`)
            .input("examId", id)
            .input("questionId", q.id)
            .input("correctAnswer", JSON.stringify(aKey))
            .query(`
              INSERT INTO AnswerKeys (id, examId, questionId, correctAnswer, createdAt, updatedAt)
              VALUES (@id, @examId, @questionId, @correctAnswer, GETUTCDATE(), GETUTCDATE())
            `);
        }

        // Insert Explanation if exists
        const expl = explanations[q.id];
        if (expl) {
          const eRequest = new sql.Request(transaction);
          await eRequest
            .input("id", `exp-${q.id}`)
            .input("examId", id)
            .input("questionId", q.id)
            .input("text", expl)
            .query(`
              INSERT INTO Explanations (id, examId, questionId, [text], createdAt, updatedAt)
              VALUES (@id, @examId, @questionId, @text, GETUTCDATE(), GETUTCDATE())
            `);
        }
      }
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction Error:", error);
    throw error;
  }
};

/**
 * Query: Get exam with full details (questions, images, answer keys)
 */
export const getExamWithDetails = async (id: string, options: GetExamDetailsOptions = {}) => {
  const query = `
    SELECT id, subjectId, title, examCode, durationMinutes, status, totalQuestions, createdAt, updatedAt
    FROM Exams
    WHERE id = @id
  `;
  const exam = await executeQuerySingle(query, { id });
  if (!exam) return null;

  // Get images
  const images = await executeQuery(
    `SELECT imageUrl FROM ExamImages WHERE examId = @id ORDER BY pageNumber`,
    { id }
  );

  // Get questions
  const questions = await executeQuery(
    `SELECT id, questionNumber, [type], label, part, options, subQuestions FROM QuestionStructures WHERE examId = @id ORDER BY part, questionNumber, label`,
    { id }
  );

  const answerKey: Record<string, any> = {};
  const explanations: Record<string, string> = {};

  if (options.includeAnswers) {
    const keys = await executeQuery(
      `SELECT questionId, correctAnswer FROM AnswerKeys WHERE examId = @id`,
      { id }
    );

    const expls = await executeQuery(
      `SELECT questionId, [text] FROM Explanations WHERE examId = @id`,
      { id }
    );

    keys.forEach(k => {
      try {
        answerKey[k.questionId] = JSON.parse(k.correctAnswer);
      } catch (e) {
        answerKey[k.questionId] = k.correctAnswer;
      }
    });

    expls.forEach(e => {
      explanations[e.questionId] = e.text;
    });
  }

  const questionStructure = questions.map(q => {
    let options = [];
    let subQuestions = [];
    try {
      options = JSON.parse(q.options || "[]");
      subQuestions = JSON.parse(q.subQuestions || "[]");
    } catch (e) {}

    return {
      ...q,
      options,
      subQuestions
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
  const params: Record<string, any> = { id };

  for (const field of ["subjectId", "title", "examCode", "durationMinutes", "status"]) {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = @${field}`);
      params[field] = updates[field];
    }
  }

  if (setClause.length === 0) {
    return getExamWithDetails(id, { includeAnswers: true });
  }

  setClause.push("updatedAt = GETUTCDATE()");

  await executeNonQuery(
    `
    UPDATE Exams
    SET ${setClause.join(", ")}
    WHERE id = @id
  `,
    params
  );

  return getExamWithDetails(id, { includeAnswers: true });
};

/**
 * Query: Delete exam
 */
export const deleteExamFull = async (id: string) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    
    await transaction.request().input("id", id).query(`
      DELETE aa
      FROM AttemptAnswers aa
      JOIN Attempts a ON aa.attemptId = a.id
      WHERE a.examId = @id
    `);
    await transaction.request().input("id", id).query(`DELETE FROM Attempts WHERE examId = @id`);
    await transaction.request().input("id", id).query(`DELETE FROM AnswerKeys WHERE examId = @id`);
    await transaction.request().input("id", id).query(`DELETE FROM Explanations WHERE examId = @id`);
    await transaction.request().input("id", id).query(`DELETE FROM QuestionStructures WHERE examId = @id`);
    await transaction.request().input("id", id).query(`DELETE FROM ExamImages WHERE examId = @id`);
    await transaction.request().input("id", id).query(`DELETE FROM Exams WHERE id = @id`);

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
