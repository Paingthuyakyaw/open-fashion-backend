import { Router } from "express";
import { Role } from "../generated/prisma/client";
import {
  createTransaction,
  getTransaction,
  listTransactions,
  updateTransactionStatus,
} from "../controllers/transaction.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Create a payment for an order (owner or admin)
 *     description: Amount is calculated from the order items. Status starts as PENDING.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order cannot be paid
 */
router.post("/", authenticate, createTransaction);

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     x-audience:
 *       - user
 *       - admin
 *     summary: List transactions (customer sees own, admin sees all)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by order ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED, REFUNDED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, listTransactions);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Get a transaction by ID (owner or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", authenticate, getTransaction);

/**
 * @openapi
 * /api/transactions/{id}/status:
 *   patch:
 *     tags:
 *       - Transactions
 *     x-audience:
 *       - admin
 *     summary: Update transaction status (admin only)
 *     description: Setting status to SUCCESS marks a PENDING order as PAID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransactionStatusRequest'
 *     responses:
 *       200:
 *         description: Transaction status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 *       409:
 *         description: Order already has a successful payment
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(Role.ADMIN),
  updateTransactionStatus,
);

export default router;
