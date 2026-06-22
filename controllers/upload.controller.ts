import type { Request, Response } from "express";
import { uploadImages } from "../utils/storage";

export async function uploadProductImages(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files?.length) {
    return res.status(400).json({ message: "No images provided" });
  }

  const imageUrls = await uploadImages(files);

  return res.status(201).json({ imageUrls });
}
