import "dotenv/config";
import "./types/express";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { adminApiSpec, userApiSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import ticketRoutes from "./routes/ticket.routes";
import transactionRoutes from "./routes/transaction.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();
const PORT = process.env.PORT ?? 3001;

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({
    message: "Open Fashion API",
    docs: "/api-docs",
  });
});

app.get("/api-docs/user.json", (_req, res) => {
  res.json(userApiSpec);
});

app.get("/api-docs/admin.json", (_req, res) => {
  res.json(adminApiSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    customSiteTitle: "Open Fashion API",
    swaggerUrl: "/api-docs/user.json",
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
      urls: [
        { url: "/api-docs/user.json", name: "User API" },
        { url: "/api-docs/admin.json", name: "Admin API" },
      ],
    },
  }),
);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/upload", uploadRoutes);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      message:
        "Invalid JSON in request body. In Swagger, keep string values on one line or use \\n for line breaks.",
    });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});

// /uploads/products/6d0713f1-06b9-401c-a77e-4910f588c2c7-Rectangle_325.png