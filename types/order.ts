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
  productName: string;
  quantity: number;
  price: number | null;
  totalPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderResponse = {
  id: string;
  userId: string;
  userName: string;
  status: OrderStatus;
  orderItems: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
};
