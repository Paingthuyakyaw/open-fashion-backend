import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getParamId, paginationMeta, parsePagination } from "../utils/controller";

export type CategoryResponse = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCategoryBody = {
  name?: string;
};

export type UpdateCategoryBody = {
  name?: string;
};

export async function listCategories(req: Request, res: Response) {
  try {
    const { page, limit } = parsePagination(req.query);
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.count(),
    ]);

    return res.status(200).json({
      categories,
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategory(req: Request, res: Response) {
  try {
    const id = getParamId(req, res, "category");
    if (!id) return;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { name } = req.body as CreateCategoryBody;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await prisma.category.create({
      data: { name: trimmedName },
    });

    return res.status(201).json({ category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const id = getParamId(req, res, "category");
    if (!id) return;

    const { name } = req.body as UpdateCategoryBody;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const trimmedName = name?.trim();
    if (name !== undefined && !trimmedName) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(trimmedName !== undefined && { name: trimmedName }),
      },
    });

    return res.status(200).json({ category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const id = getParamId(req, res, "category");
    if (!id) return;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { products: { select: { id: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (existing.products.length > 0) {
      return res.status(409).json({
        message: "Cannot delete a category that has existing products",
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
