import { Router } from "express";
import { login, register, getProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

/**
 * Public routes
 */
router.post("/login", login);
router.post("/register", register);

/**
 * Protected routes (require authentication)
 */
router.get("/profile", authMiddleware, getProfile);

export default router;
