import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { query } from "../lib/database.js";

const router = Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, "uploads/");
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4().substring(0, 8)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit for exam PDFs and rendered pages
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) and PDF files are allowed!"));
    }
  },
});

/**
 * Handle single file upload
 * POST /api/upload
 */
router.post("/", authMiddleware, adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // Create URL for the file (relative to root)
  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    await query(
      `
      INSERT INTO "UploadedFiles" (id, "originalName", filename, url, "mimeType", "sizeBytes", "uploadedBy", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `,
      [
        uuidv4(),
        req.file.originalname,
        req.file.filename,
        fileUrl,
        req.file.mimetype,
        req.file.size,
        req.user?.id ?? null,
      ]
    );
  } catch (error) {
    console.warn("Upload metadata was not stored:", error);
  }

  res.status(200).json({
    message: "File uploaded successfully",
    data: {
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

export default router;
