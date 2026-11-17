import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../generated/prisma/client";

export type CreateTicketBody = {
  subject?: string;
  body?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  orderId?: string;
};

export type CreateTicketMessageBody = {
  body?: string;
};

export type UpdateTicketStatusBody = {
  status?: TicketStatus;
  priority?: TicketPriority;
};

export type TicketMessageResponse = {
  id: string;
  userId: string;
  body: string;
  createdAt: Date;
};

export type TicketResponse = {
  id: string;
  userId: string;
  orderId: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messageCount: number;
  messages?: TicketMessageResponse[];
  createdAt: Date;
  updatedAt: Date;
};
