import { Router } from "express";
import { Role } from "../generated/prisma/client";
import { uploadProductImages as uploadProductImagesHandler } from "../controllers/upload.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { uploadProductImages } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/images",
  authenticate,
  authorize(Role.ADMIN),
  uploadProductImages,
  uploadProductImagesHandler
);

export default router;
