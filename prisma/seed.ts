import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { OrderStatus, PrismaClient, Role } from "../generated/prisma/client";
import { hashPassword } from "../utils/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.image.deleteMany();
  await prisma.user.deleteMany();

  const [men, women, accessories] = await Promise.all([
    prisma.category.create({ data: { name: "Men" } }),
    prisma.category.create({ data: { name: "Women" } }),
    prisma.category.create({ data: { name: "Accessories" } }),
  ]);

  const images = await Promise.all([
    prisma.image.create({
      data: { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab" },
    }),
    prisma.image.create({
      data: { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246" },
    }),
    prisma.image.create({
      data: { url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1" },
    }),
    prisma.image.create({
      data: { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62" },
    }),
  ]);

  const classicTee = await prisma.product.create({
    data: {
      name: "Classic Cotton Tee",
      description: "Soft breathable cotton t-shirt for everyday wear.",
      price: 29.99,
      categoryId: men.id,
      productVariants: {
        create: [
          { size: "S", color: "White", price: 29.99 },
          { size: "M", color: "White", price: 29.99 },
          { size: "L", color: "Black", price: 29.99 },
        ],
      },
      productImages: {
        create: [{ imageId: images[0].id }],
      },
    },
  });

  const slimJeans = await prisma.product.create({
    data: {
      name: "Slim Fit Jeans",
      description: "Stretch denim jeans with a modern slim fit.",
      price: 59.99,
      categoryId: men.id,
      productVariants: {
        create: [
          { size: "30", color: "Indigo", price: 59.99 },
          { size: "32", color: "Indigo", price: 59.99 },
          { size: "34", color: "Black", price: 64.99 },
        ],
      },
      productImages: {
        create: [{ imageId: images[1].id }],
      },
    },
  });

  const summerDress = await prisma.product.create({
    data: {
      name: "Floral Summer Dress",
      description: "Lightweight floral dress perfect for warm days.",
      price: 79.99,
      categoryId: women.id,
      productVariants: {
        create: [
          { size: "S", color: "Pink", price: 79.99 },
          { size: "M", color: "Pink", price: 79.99 },
          { size: "L", color: "Blue", price: 84.99 },
        ],
      },
      productImages: {
        create: [{ imageId: images[2].id }],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Leather Crossbody Bag",
      description: "Compact leather bag with adjustable strap.",
      price: 89.99,
      categoryId: accessories.id,
      productVariants: {
        create: [
          { size: "One Size", color: "Brown", price: 89.99 },
          { size: "One Size", color: "Black", price: 94.99 },
        ],
      },
      productImages: {
        create: [{ imageId: images[3].id }],
      },
    },
  });

  const [customerPassword, adminPassword] = await Promise.all([
    hashPassword("password123"),
    hashPassword("123456"),
  ]);

  const user = await prisma.user.create({
    data: {
      email: "demo@openfashion.com",
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      status: OrderStatus.PAID,
      orderItems: {
        create: [
          {
            productId: classicTee.id,
            quantity: 2,
            price: 29.99,
            totalPrice: 59.98,
          },
          {
            productId: summerDress.id,
            quantity: 1,
            price: 79.99,
            totalPrice: 79.99,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      status: OrderStatus.PENDING,
      orderItems: {
        create: [
          {
            productId: slimJeans.id,
            quantity: 1,
            price: 59.99,
            totalPrice: 59.99,
          },
        ],
      },
    },
  });

  console.log("Seed completed.");
  console.log(`  Categories: 3`);
  console.log(`  Products: 4`);
  console.log(`  Images: ${images.length}`);
  console.log(`  Demo user: ${user.email} / password123`);
  console.log(`  Admin user: ${admin.email} / 123456`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
