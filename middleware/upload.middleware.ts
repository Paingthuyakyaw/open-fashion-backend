import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
}).array("images", MAX_FILES);

export function uploadProductImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  multerUpload(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 5MB or smaller"
          : err.code === "LIMIT_FILE_COUNT"
            ? `You can upload up to ${MAX_FILES} images at once`
            : err.message;

      res.status(400).json({ message });
      return;
    }

    res.status(400).json({
      message: err instanceof Error ? err.message : "Upload failed",
    });
  });
}
