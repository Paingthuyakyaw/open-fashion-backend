import type {
  PaymentMethod,
  TransactionStatus,
} from "../generated/prisma/client";

export type CreateTransactionBody = {
  orderId?: string;
  method?: PaymentMethod;
  currency?: string;
  reference?: string;
};

export type UpdateTransactionStatusBody = {
  status?: TransactionStatus;
};

export type TransactionResponse = {
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
};
