import type { Request, Response } from "express";

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
  // TODO: implement list categories
}

export async function getCategory(req: Request, res: Response) {
  // TODO: implement get category by id
}

export async function createCategory(req: Request, res: Response) {
  const _body = req.body as CreateCategoryBody;
  // TODO: implement create category
}

export async function updateCategory(req: Request, res: Response) {
  const _body = req.body as UpdateCategoryBody;
  // TODO: implement update category
}

export async function deleteCategory(req: Request, res: Response) {
  // TODO: implement delete category
}
