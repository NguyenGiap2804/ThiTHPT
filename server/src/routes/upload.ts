import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { query } from "../lib/database.js";
import { buildStoredFilename, saveUploadedFile } from "../lib/storage.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
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

  const filename = buildStoredFilename(req.file.originalname);
  const folder = req.body.folder || ""; // Allow folder specification
  let storedFile: Awaited<ReturnType<typeof saveUploadedFile>>;

  try {
    storedFile = await saveUploadedFile(req.file, filename, folder);
  } catch (error) {
    console.error("Upload storage failed:", error);
    res.status(500).json({
      error: "Upload Failed",
      message: error instanceof Error ? error.message : "Could not store uploaded file",
    });
    return;
  }

  try {
    await query(
      `
      INSERT INTO "UploadedFiles" (id, "originalName", filename, url, "mimeType", "sizeBytes", "uploadedBy", "storageProvider", "objectKey", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `,
      [
        uuidv4(),
        req.file.originalname,
        storedFile.filename,
        storedFile.url,
        req.file.mimetype,
        req.file.size,
        req.user?.id ?? null,
        storedFile.storageProvider,
        storedFile.objectKey ?? null,
      ]
    );
  } catch (error) {
    try {
      await query(
        `
        INSERT INTO "UploadedFiles" (id, "originalName", filename, url, "mimeType", "sizeBytes", "uploadedBy", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `,
        [
          uuidv4(),
          req.file.originalname,
          storedFile.filename,
          storedFile.url,
          req.file.mimetype,
          req.file.size,
          req.user?.id ?? null,
        ]
      );
    } catch (metadataError) {
      console.warn("Upload metadata was not stored:", metadataError);
    }
  }

  res.status(200).json({
    message: "File uploaded successfully",
    data: {
      url: storedFile.url,
      filename: storedFile.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      storageProvider: storedFile.storageProvider,
      objectKey: storedFile.objectKey,
    },
  });
});

export default router;
