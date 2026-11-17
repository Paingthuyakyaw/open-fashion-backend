import type { Request, Response } from "express";
import {
  OrderStatus,
  PaymentMethod,
  Role,
  TransactionStatus,
} from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import {
  CreateTransactionBody,
  TransactionResponse,
  UpdateTransactionStatusBody,
} from "../types/transaction";
import { getParamId, paginationMeta, parsePagination } from "../utils/controller";

const TRANSACTION_STATUSES = new Set<string>(Object.values(TransactionStatus));
const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

function formatTransaction(transaction: {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  method: PaymentMethod;
  reference: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TransactionResponse {
  return {
    id: transaction.id,
    orderId: transaction.orderId,
    userId: transaction.userId,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    method: transaction.method,
    reference: transaction.reference,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function canAccessTransaction(ownerId: string, req: Request): boolean {
  if (!req.user) return false;
  return req.user.role === Role.ADMIN || req.user.userId === ownerId;
}

function orderTotal(
  items: { price: number | null; totalPrice: number | null; quantity: number }[],
): number {
  const total = items.reduce((sum, item) => {
    if (item.totalPrice != null) return sum + item.totalPrice;
    if (item.price != null) return sum + item.price * item.quantity;
    return sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

export async function createTransaction(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { orderId, method, currency, reference } = req.body as CreateTransactionBody;

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required" });
  }

  if (!method || !PAYMENT_METHODS.has(method)) {
    return res.status(400).json({ message: "Valid payment method is required" });
  }

  let normalizedCurrency: string | undefined;
  if (currency !== undefined) {
    if (typeof currency !== "string" || !currency.trim()) {
      return res.status(400).json({ message: "currency must be a non-empty string" });
    }
    normalizedCurrency = currency.trim().toUpperCase();
  }

  let normalizedReference: string | undefined;
  if (reference !== undefined) {
    if (typeof reference !== "string") {
      return res.status(400).json({ message: "reference must be a string" });
    }
    const trimmed = reference.trim();
    if (trimmed) normalizedReference = trimmed;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!canAccessTransaction(order.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (order.status === OrderStatus.CANCELLED) {
    return res.status(409).json({ message: "Cancelled orders cannot be paid" });
  }

  const amount = orderTotal(order.orderItems);
  if (amount <= 0) {
    return res.status(400).json({ message: "Order total must be greater than 0" });
  }

  const openPayment = await prisma.transaction.findFirst({
    where: {
      orderId,
      status: { in: [TransactionStatus.PENDING, TransactionStatus.SUCCESS] },
    },
  });

  if (openPayment) {
    return res.status(409).json({
      message: "This order already has an open or successful payment",
    });
  }

  const transaction = await prisma.transaction.create({
    data: {
      orderId,
      userId: order.userId,
      amount,
      method,
      ...(normalizedCurrency ? { currency: normalizedCurrency } : {}),
      ...(normalizedReference ? { reference: normalizedReference } : {}),
    },
  });

  return res.status(201).json({ transaction: formatTransaction(transaction) });
}

export async function listTransactions(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { page, limit } = parsePagination(req.query);
  const skip = (page - 1) * limit;

  const statusQuery = req.query.status;
  const orderIdQuery = req.query.orderId;

  if (statusQuery !== undefined && Array.isArray(statusQuery)) {
    return res.status(400).json({ message: "status must be a single value" });
  }

  if (orderIdQuery !== undefined && Array.isArray(orderIdQuery)) {
    return res.status(400).json({ message: "orderId must be a single value" });
  }

  if (
    typeof statusQuery === "string" &&
    statusQuery &&
    !TRANSACTION_STATUSES.has(statusQuery)
  ) {
    return res.status(400).json({ message: "Valid status is required" });
  }

  const where = {
    ...(user.role === Role.ADMIN ? {} : { userId: user.userId }),
    ...(typeof statusQuery === "string" && statusQuery
      ? { status: statusQuery as TransactionStatus }
      : {}),
    ...(typeof orderIdQuery === "string" && orderIdQuery
      ? { orderId: orderIdQuery }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return res.json({
    transactions: transactions.map(formatTransaction),
    pagination: paginationMeta(page, limit, total),
  });
}

export async function getTransaction(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const id = getParamId(req, res, "transaction");
  if (!id) return;

  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  if (!canAccessTransaction(transaction.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ transaction: formatTransaction(transaction) });
}

export async function updateTransactionStatus(req: Request, res: Response) {
  const id = getParamId(req, res, "transaction");
  if (!id) return;

  const { status } = req.body as UpdateTransactionStatusBody;

  if (!status || !TRANSACTION_STATUSES.has(status)) {
    return res.status(400).json({ message: "Valid status is required" });
  }

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  if (status === TransactionStatus.SUCCESS && existing.status !== TransactionStatus.SUCCESS) {
    const otherSuccess = await prisma.transaction.findFirst({
      where: {
        orderId: existing.orderId,
        status: TransactionStatus.SUCCESS,
        id: { not: id },
      },
    });

    if (otherSuccess) {
      return res.status(409).json({
        message: "This order already has a successful payment",
      });
    }
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id },
      data: { status },
    });

    if (status === TransactionStatus.SUCCESS) {
      await tx.order.updateMany({
        where: { id: existing.orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.PAID },
      });
    }

    return updated;
  });

  return res.json({ transaction: formatTransaction(transaction) });
}
