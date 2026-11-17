import { Router } from "express";
import { Role } from "../generated/prisma/client";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     x-audience:
 *       - user
 *       - admin
 *     summary: List all categories (public)
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get("/", listCategories);

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     x-audience:
 *       - user
 *       - admin
 *     summary: Get a category by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get("/:id", getCategory);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     x-audience:
 *       - admin
 *     summary: Create a category (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", authenticate, authorize(Role.ADMIN), createCategory);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     x-audience:
 *       - admin
 *     summary: Update a category (admin only)
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
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 */
router.put("/:id", authenticate, authorize(Role.ADMIN), updateCategory);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     x-audience:
 *       - admin
 *     summary: Delete a category (admin only)
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
 *         description: Category deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category has existing products
 */
router.delete("/:id", authenticate, authorize(Role.ADMIN), deleteCategory);

export default router;
