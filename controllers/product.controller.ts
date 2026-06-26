import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CreateProductBody, ProductVariantInput } from "../types/product";
import { getParamId, paginationMeta, parsePagination } from "../utils/controller";

const productInclude = {
  category: { select: { id: true, name: true } },
  productImages: {
    include: { image: { select: { id: true, url: true } } },
  },
  productVariants: true,
} as const;




type UpdateProductBody = CreateProductBody;

function formatProduct(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  productImages: { image: { id: string; url: string } }[];
  productVariants: {
    id: string;
    size: string;
    color: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
}) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    categoryId: product.categoryId,
    category: product.category,
    images: product.productImages.map((pi) => pi.image),
    variants: product.productVariants,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function validateVariants(variants: ProductVariantInput[]): string | null {
  for (const variant of variants) {
    if (!variant.size || !variant.color || variant.price === undefined) {
      return "Each variant requires size, color, and price";
    }
    if (variant.price < 0) {
      return "Variant price must be a positive number";
    }
  }
  return null;
}

function parseListQuery(query: Request["query"]) {
  const { categoryId, search } = query as {
    categoryId?: string;
    search?: string;
  };

  const { page, limit } = parsePagination(query);
  const trimmedSearch = search?.trim() || undefined;

  return { categoryId, search: trimmedSearch, page, limit };
}

export async function listProducts(req: Request, res: Response) {
  const { categoryId, search, page, limit } = parseListQuery(req.query);
  const skip = (page - 1) * limit;

  const where = {
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return res.json({
    products: products.map(formatProduct),
    pagination: paginationMeta(page, limit, total),
  });
}

export async function getProduct(req: Request, res: Response) {
  const id = getParamId(req, res, "product");
  if (!id) return;

  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ product: formatProduct(product) });
}

export async function createProduct(req: Request, res: Response) {
  const { name, description, price, categoryId, variants, imageUrls } =
    req.body as CreateProductBody;

  if (!name || !description || price === undefined || !categoryId) {
    return res.status(400).json({
      message: "Name, description, price, and categoryId are required",
    });
  }

  if (price < 0) {
    return res.status(400).json({ message: "Price must be a positive number" });
  }

  if (variants?.length) {
    const variantError = validateVariants(variants);
    if (variantError) {
      return res.status(400).json({ message: variantError });
    }
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return res.status(400).json({ message: "Category not found" });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      categoryId,
      productVariants: variants?.length
        ? {
            create: variants.map((v) => ({
              size: v.size!,
              color: v.color!,
              price: v.price!,
            })),
          }
        : undefined,
      productImages: imageUrls?.length
        ? {
            create: await Promise.all(
              imageUrls.map(async (url) => {
                const image = await prisma.image.create({ data: { url } });
                return { imageId: image.id };
              })
            ),
          }
        : undefined,
    },
    include: productInclude,
  });

  return res.status(201).json({ product: formatProduct(product) });
}

export async function updateProduct(req: Request, res: Response) {
  const id = getParamId(req, res, "product");
  if (!id) return;

  const { name, description, price, categoryId, variants, imageUrls } =
    req.body as UpdateProductBody;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (price !== undefined && price < 0) {
    return res.status(400).json({ message: "Price must be a positive number" });
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
  }

  if (variants?.length) {
    const variantError = validateVariants(variants);
    if (variantError) {
      return res.status(400).json({ message: variantError });
    }
  }

  const product = await prisma.$transaction(async (tx) => {
    if (variants !== undefined) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            size: v.size!,
            color: v.color!,
            price: v.price!,
          })),
        });
      }
    }

    if (imageUrls !== undefined) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (imageUrls.length > 0) {
        for (const url of imageUrls) {
          const image = await tx.image.create({ data: { url } });
          await tx.productImage.create({
            data: { productId: id, imageId: image.id },
          });
        }
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: productInclude,
    });
  });

  return res.json({ product: formatProduct(product) });
}

export async function deleteProduct(req: Request, res: Response) {
  const id = getParamId(req, res, "product");
  if (!id) return;

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { orderItems: { select: { id: true } } },
  });

  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (existing.orderItems.length > 0) {
    return res.status(409).json({
      message: "Cannot delete a product that has been ordered",
    });
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  return res.json({ message: "Product deleted successfully" });
}
