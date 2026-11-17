import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT ?? "3001";
const baseUrl = `http://localhost:${PORT}`;

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Open Fashion API",
    version: "1.0.0",
    description: "API documentation for the Open Fashion backend",
  },
  servers: [
    {
      url: baseUrl,
      description: "Development server",
    },
  ],
  paths: {
    "/api/upload/images": {
      post: {
        tags: ["Upload"],
        "x-audience": ["admin"],
        summary: "Upload product images (admin only)",
        description:
          `Upload up to 5 product images. Use returned imageUrls in POST /api/products or PUT /api/products/{id}. Full URL example: ${baseUrl}/uploads/products/3f2a1b4c-shirt.jpg`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["images"],
                properties: {
                  images: {
                    type: "array",
                    items: {
                      type: "string",
                      format: "binary",
                    },
                    description:
                      "JPEG, PNG, WebP, or GIF (max 5MB each, up to 5 files)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Images uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadImagesResponse",
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden (admin only)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: {
            type: "string",
            minLength: 6,
            example: "password123",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", example: "password123" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["CUSTOMER", "ADMIN"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      ProductVariant: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          size: { type: "string", example: "M" },
          color: { type: "string", example: "Black" },
          price: { type: "number", example: 29.99 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductImage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: {
            type: "string",
            example: `${baseUrl}/uploads/products/3f2a1b4c-shirt.jpg`,
          },
        },
      },
      ProductCategory: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Men" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Classic Cotton Tee" },
          description: { type: "string" },
          price: { type: "number", example: 29.99 },
          categoryId: { type: "string", format: "uuid" },
          category: { $ref: "#/components/schemas/ProductCategory" },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductImage" },
          },
          variants: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductVariant" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
        },
      },
      ProductListResponse: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: { $ref: "#/components/schemas/Product" },
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      ProductVariantInput: {
        type: "object",
        required: ["size", "color", "price"],
        properties: {
          size: { type: "string", example: "M" },
          color: { type: "string", example: "Black" },
          price: { type: "number", example: 29.99 },
        },
      },
      CreateProductRequest: {
        type: "object",
        required: ["name", "description", "price", "categoryId"],
        properties: {
          name: { type: "string", example: "Classic Cotton Tee" },
          description: {
            type: "string",
            example: "Soft cotton t-shirt for everyday wear",
            description:
              "Keep on one line in Swagger. For line breaks use \\n — do not press Enter inside quotes.",
          },
          price: { type: "number", example: 29.99 },
          categoryId: { type: "string", format: "uuid" },
          variants: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductVariantInput" },
          },
          imageUrls: {
            type: "array",
            description: "URLs returned from POST /api/upload/images",
            items: {
              type: "string",
              example: "/uploads/products/3f2a1b4c-shirt.jpg",
            },
          },
        },
        example: {
          name: "Classic Cotton Tee",
          description: "Soft cotton t-shirt for everyday wear",
          price: 29.99,
          categoryId: "00000000-0000-0000-0000-000000000000",
          variants: [{ size: "M", color: "Black", price: 29.99 }],
          imageUrls: ["/uploads/products/3f2a1b4c-shirt.jpg"],
        },
      },
      UpdateProductRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: {
            type: "string",
            description:
              "Keep on one line in Swagger. For line breaks use \\n — do not press Enter inside quotes.",
          },
          price: { type: "number" },
          categoryId: { type: "string", format: "uuid" },
          variants: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductVariantInput" },
          },
          imageUrls: {
            type: "array",
            description: "URLs returned from POST /api/upload/images",
            items: {
              type: "string",
              example: "/uploads/products/3f2a1b4c-shirt.jpg",
            },
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Men" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateCategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Men" },
        },
      },
      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Women" },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          productId: { type: "string", format: "uuid" },
          productName: { type: "string", example: "Classic Cotton Tee" },
          quantity: { type: "integer", example: 2 },
          price: { type: "number", nullable: true, example: 29.99 },
          totalPrice: { type: "number", nullable: true, example: 59.98 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          userName: { type: "string", example: "demo@openfashion.com" },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "PAID",
              "PROCESSING",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
            ],
          },
          orderItems: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderItemInput: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1, example: 1 },
        },
      },
      CreateOrderRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderItemInput" },
          },
        },
      },
      UpdateOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: [
              "PENDING",
              "PAID",
              "PROCESSING",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
            ],
          },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          orderId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          amount: { type: "number", example: 59.98 },
          currency: { type: "string", example: "USD" },
          status: {
            type: "string",
            enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
          },
          method: {
            type: "string",
            enum: [
              "CARD",
              "CASH",
              "BANK_TRANSFER",
              "KBZ_PAY",
              "WAVE_PAY",
              "AYA_PAY",
              "OTHER",
            ],
          },
          reference: { type: "string", nullable: true, example: "KBZ-123456" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TransactionListResponse: {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            items: { $ref: "#/components/schemas/Transaction" },
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      CreateTransactionRequest: {
        type: "object",
        required: ["orderId", "method"],
        properties: {
          orderId: { type: "string", format: "uuid" },
          method: {
            type: "string",
            enum: [
              "CARD",
              "CASH",
              "BANK_TRANSFER",
              "KBZ_PAY",
              "WAVE_PAY",
              "AYA_PAY",
              "OTHER",
            ],
          },
          currency: { type: "string", example: "MMK" },
          reference: { type: "string", example: "KBZ-123456" },
        },
      },
      UpdateTransactionStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
          },
        },
      },
      TicketMessage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          body: { type: "string", example: "My order has not arrived." },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          orderId: { type: "string", format: "uuid", nullable: true },
          subject: { type: "string", example: "Order not delivered" },
          category: {
            type: "string",
            enum: ["ORDER", "PAYMENT", "PRODUCT", "SHIPPING", "OTHER"],
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
          },
          status: {
            type: "string",
            enum: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
          },
          messageCount: { type: "integer", example: 1 },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/TicketMessage" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TicketListResponse: {
        type: "object",
        properties: {
          tickets: {
            type: "array",
            items: { $ref: "#/components/schemas/Ticket" },
          },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      CreateTicketRequest: {
        type: "object",
        required: ["subject", "body"],
        properties: {
          subject: { type: "string", example: "Order not delivered" },
          body: { type: "string", example: "My order has not arrived." },
          category: {
            type: "string",
            enum: ["ORDER", "PAYMENT", "PRODUCT", "SHIPPING", "OTHER"],
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
          },
          orderId: { type: "string", format: "uuid" },
        },
      },
      CreateTicketMessageRequest: {
        type: "object",
        required: ["body"],
        properties: {
          body: { type: "string", example: "Can you check the tracking number?" },
        },
      },
      UpdateTicketStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
            description: "Admin only",
          },
        },
      },
      UploadImagesResponse: {
        type: "object",
        required: ["imageUrls"],
        properties: {
          imageUrls: {
            type: "array",
            description: "Local paths to use in product imageUrls (prepend server URL for full link)",
            items: {
              type: "string",
              example: "/uploads/products/3f2a1b4c-shirt.jpg",
            },
            example: [
              "/uploads/products/3f2a1b4c-shirt.jpg",
              "/uploads/products/8d9e0f1a-pants.png",
            ],
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./routes/*.ts"],
});

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "trace",
]);

type Audience = "user" | "admin";

type OperationObject = {
  "x-audience"?: Audience[];
  [key: string]: unknown;
};

function specFor(audience: Audience) {
  const source = swaggerSpec as {
    info?: { title?: string; description?: string };
    paths?: Record<string, Record<string, OperationObject>>;
  };
  const paths: Record<string, Record<string, unknown>> = {};

  for (const [path, pathItem] of Object.entries(source.paths ?? {})) {
    const nextItem: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(key)) {
        nextItem[key] = value;
        continue;
      }

      const audiences = value["x-audience"] ?? ["user"];
      if (!audiences.includes(audience)) continue;

      const { "x-audience": _audience, ...operation } = value;
      nextItem[key] = operation;
    }

    const hasOperation = Object.keys(nextItem).some((key) => HTTP_METHODS.has(key));
    if (hasOperation) paths[path] = nextItem;
  }

  const title = audience === "admin" ? "Open Fashion Admin API" : "Open Fashion User API";
  const description =
    audience === "admin"
      ? "Admin endpoints. Authorize with an ADMIN bearer token."
      : "Customer and public endpoints. Authorize with a customer bearer token where required.";

  return {
    ...source,
    info: {
      ...source.info,
      title,
      description,
    },
    paths,
  };
}

export const userApiSpec = specFor("user");
export const adminApiSpec = specFor("admin");
