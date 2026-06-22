import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadImage(file: Express.Multer.File): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}-${sanitizeFilename(file.originalname)}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filepath, file.buffer);

  return `/uploads/products/${filename}`;
}

export async function uploadImages(
  files: Express.Multer.File[]
): Promise<string[]> {
  return Promise.all(files.map(uploadImage));
}
