import { Router } from "express";
import {
  createTicket,
  createTicketMessage,
  getTicket,
  listTickets,
  updateTicketStatus,
} from "../controllers/ticket.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/tickets:
 *   post:
 *     tags:
 *       - Tickets
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Open a support ticket
 *     description: Creates the ticket and its first message together. userId comes from the token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTicketRequest'
 *     responses:
 *       201:
 *         description: Ticket created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.post("/", authenticate, createTicket);

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     x-audience:
 *       - user
 *       - admin
 *     summary: List tickets (customer sees own, admin sees all)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ORDER, PAYMENT, PRODUCT, SHIPPING, OTHER]
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated list of tickets
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, listTickets);

/**
 * @openapi
 * /api/tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Get a ticket and its messages (owner or admin)
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
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.get("/:id", authenticate, getTicket);

/**
 * @openapi
 * /api/tickets/{id}/messages:
 *   post:
 *     tags:
 *       - Tickets
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Reply to a ticket (owner or admin)
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
 *             $ref: '#/components/schemas/CreateTicketMessageRequest'
 *     responses:
 *       201:
 *         description: Message created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/TicketMessage'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 *       409:
 *         description: Ticket is closed
 */
router.post("/:id/messages", authenticate, createTicketMessage);

/**
 * @openapi
 * /api/tickets/{id}/status:
 *   patch:
 *     tags:
 *       - Tickets
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Update ticket status
 *     description: Admins can set any status and priority. The ticket owner can only set status to CLOSED.
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
 *             $ref: '#/components/schemas/UpdateTicketStatusRequest'
 *     responses:
 *       200:
 *         description: Ticket updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.patch("/:id/status", authenticate, updateTicketStatus);

export default router;
