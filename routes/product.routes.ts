import { Router } from "express";
import { Role } from "../generated/prisma/client";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     x-audience:
 *       - user
 *       - admin
 *     summary: List products with pagination and search (public)
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or description (case-insensitive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 */
router.get("/", listProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Get a product by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProduct);

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     x-audience:
 *       - admin
 *     summary: Create a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", authenticate, authorize(Role.ADMIN), createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     x-audience:
 *       - admin
 *     summary: Update a product (admin only)
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
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 */
router.put("/:id", authenticate, authorize(Role.ADMIN), updateProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Products
 *     x-audience:
 *       - admin
 *     summary: Delete a product (admin only)
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
 *         description: Product deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product has existing orders
 */
router.delete("/:id", authenticate, authorize(Role.ADMIN), deleteProduct);

export default router;
