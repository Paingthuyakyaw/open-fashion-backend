import type { Request, Response } from "express";
import { OrderStatus, Role } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import {
  CreateOrderBody,
  OrderItemInput,
  OrderItemResponse,
  OrderResponse,
  UpdateOrderStatusBody,
} from "../types/order";
import { getParamId, paginationMeta, parsePagination } from "../utils/controller";

const orderInclude = {
  user: { select: { email: true } },
  orderItems: {
    include: {
      product: { select: { name: true } },
    },
  },
} as const;

const ORDER_STATUSES = new Set<string>(Object.values(OrderStatus));

function formatOrderItem(item: {
  id: string;
  productId: string;
  product: { name: string };
  quantity: number;
  price: number | null;
  totalPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}): OrderItemResponse {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    quantity: item.quantity,
    price: item.price,
    totalPrice: item.totalPrice,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function formatOrder(order: {
  id: string;
  userId: string;
  user: { email: string };
  status: OrderStatus;
  orderItems: {
    id: string;
    productId: string;
    product: { name: string };
    quantity: number;
    price: number | null;
    totalPrice: number | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}): OrderResponse {
  return {
    id: order.id,
    userId: order.userId,
    userName: order.user.email,
    status: order.status,
    orderItems: order.orderItems.map(formatOrderItem),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function validateItems(items: OrderItemInput[]): string | null {
  if (!items.length) {
    return "At least one order item is required";
  }

  for (const item of items) {
    if (!item.productId) {
      return "Each item requires a productId";
    }
    if (
      item.quantity === undefined ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return "Each item requires a quantity of at least 1";
    }
  }

  return null;
}

function canAccessOrder(orderUserId: string, req: Request): boolean {
  if (!req.user) return false;
  return req.user.role === Role.ADMIN || req.user.userId === orderUserId;
}

export async function createOrder(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { items } = req.body as CreateOrderBody;
  const itemError = validateItems(items ?? []);
  if (itemError) {
    return res.status(400).json({ message: itemError });
  }

  const orderItems = items!;
  const productIds = [...new Set(orderItems.map((item) => item.productId!))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    return res.status(400).json({ message: "One or more products not found" });
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const order = await prisma.order.create({
    data: {
      userId: user.userId,
      orderItems: {
        create: orderItems.map((item) => {
          const product = productMap.get(item.productId!)!;
          const price = product.price;
          return {
            productId: item.productId!,
            quantity: item.quantity!,
            price,
            totalPrice: price * item.quantity!,
          };
        }),
      },
    },
    include: orderInclude,
  });

  return res.status(201).json({ order: formatOrder(order) });
}

export async function listOrders(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { page, limit } = parsePagination(req.query);
  const skip = (page - 1) * limit;
  const where = user.role === Role.ADMIN ? {} : { userId: user.userId };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({
    orders: orders.map(formatOrder),
    pagination: paginationMeta(page, limit, total),
  });
}

export async function getOrder(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const id = getParamId(req, res, "order");
  if (!id) return;

  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!canAccessOrder(order.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ order: formatOrder(order) });
}

export async function updateOrderStatus(req: Request, res: Response) {
  const id = getParamId(req, res, "order");
  if (!id) return;

  const { status } = req.body as UpdateOrderStatusBody;

  if (!status || !ORDER_STATUSES.has(status)) {
    return res.status(400).json({ message: "Valid status is required" });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Order not found" });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: orderInclude,
  });

  return res.json({ order: formatOrder(order) });
}

export async function deleteOrder(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const id = getParamId(req, res, "order");
  if (!id) return;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!canAccessOrder(existing.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (user.role !== Role.ADMIN && existing.status !== OrderStatus.PENDING) {
    return res.status(409).json({
      message: "Only pending orders can be cancelled",
    });
  }

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } }),
  ]);

  return res.json({ message: "Order deleted successfully" });
}
