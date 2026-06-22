import type { Request, Response } from "express";
import type { OrderStatus } from "../generated/prisma/client";

export type OrderItemInput = {
  productId?: string;
  quantity?: number;
};

export type CreateOrderBody = {
  items?: OrderItemInput[];
};

export type UpdateOrderStatusBody = {
  status?: OrderStatus;
};

export type OrderItemResponse = {
  id: string;
  productId: string;
  quantity: number;
  price: number | null;
  totalPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderResponse = {
  id: string;
  userId: string;
  status: OrderStatus;
  orderItems: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
};

export async function createOrder(req: Request, res: Response) {
  const _body = req.body as CreateOrderBody;
  // TODO: implement create order
}

export async function listOrders(req: Request, res: Response) {
  // TODO: implement list orders (customer: own orders, admin: all orders)
}

export async function getOrder(req: Request, res: Response) {
  // TODO: implement get order by id
}

export async function updateOrderStatus(req: Request, res: Response) {
  const _body = req.body as UpdateOrderStatusBody;
  // TODO: implement update order status (admin only)
}
