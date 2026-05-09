import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  createAttempt,
  saveAttemptAnswer,
  calculateAttemptScore,
  getAttemptWithDetails,
  getUserAttempts as getUserAttemptsFromDb,
} from "../lib/queries/attemptQueries.js";

/**
 * Submit exam attempt
 * POST /api/attempts
 * Body: { examId, timeSpent, answers: [{ questionId, selectedOption?, trueFalseAnswers?, shortAnswer? }] }
 * Requires: Authentication
 */
export const submitAttempt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { examId, answers, timeSpent = 0 } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!userId) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    if (!examId || !answers || !Array.isArray(answers)) {
      res.status(400).json({
        error: "Bad Request",
        message: "examId and answers array are required",
      });
      return;
    }

    const hasInvalidAnswer = answers.some((answer: any) => !answer || typeof answer.questionId !== "string");
    if (hasInvalidAnswer) {
      res.status(400).json({
        error: "Bad Request",
        message: "Each answer must include a questionId",
      });
      return;
    }

    // Calculate score based on correct answers
    const scoringResult = await calculateAttemptScore(answers, examId);

    // Create attempt in database
    const attemptId = uuidv4();
    const attempt = await createAttempt(
      attemptId,
      examId,
      userId,
      scoringResult.score,
      scoringResult.correctCount,
      scoringResult.wrongCount,
      scoringResult.emptyCount,
      Number(timeSpent) || 0
    );

    if (!attempt) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create attempt",
      });
      return;
    }

    // Save individual answers
    for (const answer of scoringResult.details) {
      await saveAttemptAnswer(
        uuidv4(),
        attemptId,
        answer
      );
    }

    const savedAttempt = await getAttemptWithDetails(attemptId);

    res.status(201).json({
      message: "Exam attempted successfully",
      data: savedAttempt || attempt,
    });
  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Get attempt result with detailed answers
 * GET /api/attempts/:id
 * Requires: Authentication (user must own the attempt)
 */
export const getAttemptResult = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Attempt ID is required",
      });
      return;
    }

    // Query attempt from database with details
    const attemptDetails = await getAttemptWithDetails(id);

    if (!attemptDetails) {
      res.status(404).json({
        error: "Not Found",
        message: "Attempt not found",
      });
      return;
    }

    // Verify ownership
    if ((attemptDetails as any).userId !== userId) {
      res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to view this attempt",
      });
      return;
    }

    res.status(200).json({
      data: attemptDetails,
    });
  } catch (error) {
    console.error("Get attempt result error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Get user's all attempts
 * GET /api/attempts
 * Requires: Authentication
 */
export const getUserAttempts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Query all attempts for user from database
    const attempts = await getUserAttemptsFromDb(userId);

    res.status(200).json({
      data: attempts,
    });
  } catch (error) {
    console.error("Get user attempts error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

