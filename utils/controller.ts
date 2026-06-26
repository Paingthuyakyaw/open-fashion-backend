import type { Request, Response } from "express";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export function parsePagination(query: Request["query"]) {
  const page = Math.max(1, parseInt(String(query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  return { page, limit };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

export function getParamId(
  req: Request,
  res: Response,
  label = "resource",
): string | null {
  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ message: `Invalid ${label} ID` });
    return null;
  }
  return id;
}
