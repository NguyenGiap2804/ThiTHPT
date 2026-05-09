import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { getAdminStats, getAdminSystemStatus } from "../lib/queries/adminQueries.js";
import { deleteUser, getAllUsers, updateUser } from "../lib/queries/userQueries.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    res.status(200).json({ data: stats });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
});

router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: { name?: string; role?: "student" | "admin" } = {};

    if (typeof req.body.name === "string") {
      updates.name = req.body.name.trim();
    }

    if (req.body.role !== undefined) {
      if (!["student", "admin"].includes(req.body.role)) {
        res.status(400).json({ error: "Bad Request", message: "Invalid role" });
        return;
      }
      updates.role = req.body.role;
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    res.status(200).json({
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update admin user error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
});

router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({
        error: "Bad Request",
        message: "You cannot delete your own account",
      });
      return;
    }

    await deleteUser(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete admin user error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
});

router.get("/system", async (req: Request, res: Response) => {
  try {
    const systemStatus = await getAdminSystemStatus();
    res.status(200).json({ data: systemStatus });
  } catch (error) {
    console.error("Get system status error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: String(error),
    });
  }
});

export default router;
