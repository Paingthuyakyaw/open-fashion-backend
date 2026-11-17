import { Router } from "express";
import { Role } from "../generated/prisma/client";
import {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Create a new order (authenticated)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate, createOrder);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     x-audience:
 *       - user
 *       - admin
 *     summary: List orders (customer sees own, admin sees all)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, listOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Get an order by ID (owner or admin)
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
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.get("/:id", authenticate, getOrder);

/**
 * @openapi
 * /api/orders/{id}:
 *   delete:
 *     tags:
 *       - Orders
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Delete an order (owner for pending orders, admin for any)
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
 *         description: Order deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       409:
 *         description: Only pending orders can be cancelled
 */
router.delete("/:id", authenticate, deleteOrder);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     tags:
 *       - Orders
 *     x-audience:
 *       - admin
 *     summary: Update order status (admin only)
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
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(Role.ADMIN),
  updateOrderStatus,
);

export default router;
