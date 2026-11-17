import type { Request, Response } from "express";
import {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import {
  CreateTicketBody,
  CreateTicketMessageBody,
  TicketMessageResponse,
  TicketResponse,
  UpdateTicketStatusBody,
} from "../types/ticket";
import { getParamId, paginationMeta, parsePagination } from "../utils/controller";

const TICKET_STATUSES = new Set<string>(Object.values(TicketStatus));
const TICKET_PRIORITIES = new Set<string>(Object.values(TicketPriority));
const TICKET_CATEGORIES = new Set<string>(Object.values(TicketCategory));

const messageOrder = { orderBy: { createdAt: "asc" as const } };

function formatMessage(message: {
  id: string;
  userId: string;
  body: string;
  createdAt: Date;
}): TicketMessageResponse {
  return {
    id: message.id,
    userId: message.userId,
    body: message.body,
    createdAt: message.createdAt,
  };
}

function formatTicket(ticket: {
  id: string;
  userId: string;
  orderId: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  messages?: {
    id: string;
    userId: string;
    body: string;
    createdAt: Date;
  }[];
  _count?: { messages: number };
}): TicketResponse {
  return {
    id: ticket.id,
    userId: ticket.userId,
    orderId: ticket.orderId,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    messageCount: ticket._count?.messages ?? ticket.messages?.length ?? 0,
    ...(ticket.messages
      ? { messages: ticket.messages.map(formatMessage) }
      : {}),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function canAccessTicket(ownerId: string, req: Request): boolean {
  if (!req.user) return false;
  return req.user.role === Role.ADMIN || req.user.userId === ownerId;
}

function requiredText(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

export async function createTicket(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { subject, body, category, priority, orderId } = req.body as CreateTicketBody;

  const normalizedSubject = requiredText(subject);
  if (!normalizedSubject) {
    return res.status(400).json({ message: "subject is required" });
  }

  const normalizedBody = requiredText(body);
  if (!normalizedBody) {
    return res.status(400).json({ message: "body is required" });
  }

  if (category !== undefined && !TICKET_CATEGORIES.has(category)) {
    return res.status(400).json({ message: "Valid category is required" });
  }

  if (priority !== undefined && !TICKET_PRIORITIES.has(priority)) {
    return res.status(400).json({ message: "Valid priority is required" });
  }

  if (orderId !== undefined && (typeof orderId !== "string" || !orderId)) {
    return res.status(400).json({ message: "orderId must be a string" });
  }

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (user.role !== Role.ADMIN && order.userId !== user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.userId,
      subject: normalizedSubject,
      ...(category ? { category } : {}),
      ...(priority ? { priority } : {}),
      ...(orderId ? { orderId } : {}),
      messages: {
        create: {
          userId: user.userId,
          body: normalizedBody,
        },
      },
    },
    include: {
      messages: messageOrder,
      _count: { select: { messages: true } },
    },
  });

  return res.status(201).json({ ticket: formatTicket(ticket) });
}

export async function listTickets(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { page, limit } = parsePagination(req.query);
  const skip = (page - 1) * limit;

  const statusQuery = req.query.status;
  const categoryQuery = req.query.category;
  const orderIdQuery = req.query.orderId;

  if (statusQuery !== undefined && Array.isArray(statusQuery)) {
    return res.status(400).json({ message: "status must be a single value" });
  }
  if (categoryQuery !== undefined && Array.isArray(categoryQuery)) {
    return res.status(400).json({ message: "category must be a single value" });
  }
  if (orderIdQuery !== undefined && Array.isArray(orderIdQuery)) {
    return res.status(400).json({ message: "orderId must be a single value" });
  }

  if (
    typeof statusQuery === "string" &&
    statusQuery &&
    !TICKET_STATUSES.has(statusQuery)
  ) {
    return res.status(400).json({ message: "Valid status is required" });
  }

  if (
    typeof categoryQuery === "string" &&
    categoryQuery &&
    !TICKET_CATEGORIES.has(categoryQuery)
  ) {
    return res.status(400).json({ message: "Valid category is required" });
  }

  const where = {
    ...(user.role === Role.ADMIN ? {} : { userId: user.userId }),
    ...(typeof statusQuery === "string" && statusQuery
      ? { status: statusQuery as TicketStatus }
      : {}),
    ...(typeof categoryQuery === "string" && categoryQuery
      ? { category: categoryQuery as TicketCategory }
      : {}),
    ...(typeof orderIdQuery === "string" && orderIdQuery
      ? { orderId: orderIdQuery }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return res.json({
    tickets: tickets.map(formatTicket),
    pagination: paginationMeta(page, limit, total),
  });
}

export async function getTicket(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const id = getParamId(req, res, "ticket");
  if (!id) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: messageOrder,
      _count: { select: { messages: true } },
    },
  });

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (!canAccessTicket(ticket.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ ticket: formatTicket(ticket) });
}

export async function createTicketMessage(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const id = getParamId(req, res, "ticket");
  if (!id) return;

  const normalizedBody = requiredText((req.body as CreateTicketMessageBody).body);
  if (!normalizedBody) {
    return res.status(400).json({ message: "body is required" });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (!canAccessTicket(ticket.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (ticket.status === TicketStatus.CLOSED) {
    return res.status(409).json({
      message: "Closed tickets cannot receive new messages",
    });
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      userId: user.userId,
      body: normalizedBody,
    },
  });

  return res.status(201).json({ message: formatMessage(message) });
}

export async function updateTicketStatus(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const id = getParamId(req, res, "ticket");
  if (!id) return;

  const { status, priority } = req.body as UpdateTicketStatusBody;
  const isAdmin = user.role === Role.ADMIN;

  if (!isAdmin && priority !== undefined) {
    return res.status(403).json({ message: "Only an admin can change priority" });
  }

  if (!isAdmin && status !== TicketStatus.CLOSED) {
    return res.status(403).json({ message: "You can only close your own ticket" });
  }

  if (!status || !TICKET_STATUSES.has(status)) {
    return res.status(400).json({ message: "Valid status is required" });
  }

  if (priority !== undefined && !TICKET_PRIORITIES.has(priority)) {
    return res.status(400).json({ message: "Valid priority is required" });
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (!canAccessTicket(existing.userId, req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      status,
      ...(priority ? { priority } : {}),
    },
    include: { _count: { select: { messages: true } } },
  });

  return res.json({ ticket: formatTicket(ticket) });
}
