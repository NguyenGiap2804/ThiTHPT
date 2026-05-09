import { Router } from "express";
import {
  submitAttempt,
  getAttemptResult,
  getUserAttempts,
} from "../controllers/attemptController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

/**
 * All attempt routes require authentication
 */
router.use(authMiddleware);

// Submit new exam attempt
router.post("/", submitAttempt);

// Get all attempts for logged-in user
router.get("/", getUserAttempts);

// Get specific attempt result
router.get("/:id", getAttemptResult);

export default router;
