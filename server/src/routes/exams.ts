import { Router } from "express";
import { getAllExams, getAllAdminExams, getExamDetail, getAdminExamDetail, createExam, updateExam, deleteExam } from "../controllers/examController";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const router = Router();

/**
 * Public routes
 */
router.get("/", getAllExams);
router.get("/admin", authMiddleware, adminMiddleware, getAllAdminExams);
router.get("/admin/:id", authMiddleware, adminMiddleware, getAdminExamDetail);
router.get("/:id", getExamDetail);

/**
 * Admin routes (require authentication + admin role)
 */
router.post("/", authMiddleware, adminMiddleware, createExam);
router.put("/:id", authMiddleware, adminMiddleware, updateExam);
router.delete("/:id", authMiddleware, adminMiddleware, deleteExam);

export default router;
