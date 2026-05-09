import { Request, Response } from "express";
import { 
  getAllExams as getAllExamsFromDb, 
  getExamWithDetails, 
  createExamWithDetails,
  updateExamMetadata,
  deleteExamFull
} from "../lib/queries/examQueries.js";

/**
 * Get all exams / exams with filters
 */
export const getAllExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject } = req.query;

    const filters: any = { status: "published" };
    if (subject) filters.subject = subject;

    const exams = await getAllExamsFromDb(filters);

    res.status(200).json({
      data: exams,
    });
  } catch (error) {
    console.error("Get all exams error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Get single exam with full details
 */
export const getExamDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Exam ID is required",
      });
      return;
    }

    const examDetail = await getExamWithDetails(id);

    if (!examDetail) {
      res.status(404).json({
        error: "Not Found",
        message: "Exam not found",
      });
      return;
    }

    res.status(200).json({
      data: examDetail,
    });
  } catch (error) {
    console.error("Get exam detail error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Create new exam (Full details)
 */
export const createExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const examData = {
      ...req.body,
      createdBy: req.user?.id,
    };

    if (!examData.id || !examData.title || !examData.subjectId || !examData.createdBy) {
      res.status(400).json({
        error: "Bad Request",
        message: "Exam ID, title, subjectId, and authenticated admin are required",
      });
      return;
    }

    const success = await createExamWithDetails(examData);

    if (!success) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create exam",
      });
      return;
    }

    const createdExam = await getExamWithDetails(examData.id, { includeAnswers: true });

    res.status(201).json({
      message: "Exam created successfully",
      data: createdExam,
    });
  } catch (error) {
    console.error("Create exam error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Get all exams for admin, including draft/hidden when requested.
 */
export const getAllAdminExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, status = "all" } = req.query;

    const filters: any = {};
    if (subject) filters.subject = subject;
    if (status && status !== "all") filters.status = status;

    const exams = await getAllExamsFromDb(filters);

    res.status(200).json({
      data: exams,
    });
  } catch (error) {
    console.error("Get all admin exams error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Get single exam with answer keys for admin.
 */
export const getAdminExamDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const examDetail = await getExamWithDetails(id, { includeAnswers: true });

    if (!examDetail) {
      res.status(404).json({
        error: "Not Found",
        message: "Exam not found",
      });
      return;
    }

    res.status(200).json({
      data: examDetail,
    });
  } catch (error) {
    console.error("Get admin exam detail error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Update exam metadata.
 */
export const updateExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Exam ID is required",
      });
      return;
    }

    const updatedExam = await updateExamMetadata(id, req.body);

    if (!updatedExam) {
      res.status(404).json({
        error: "Not Found",
        message: "Exam not found",
      });
      return;
    }

    res.status(200).json({
      message: "Exam updated successfully",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Update exam error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};

/**
 * Delete exam
 */
export const deleteExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Exam ID is required",
      });
      return;
    }

    await deleteExamFull(id);

    res.status(200).json({
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete exam error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
};
