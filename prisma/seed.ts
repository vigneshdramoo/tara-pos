import { InventoryMovementType, PaymentMethod, PrismaClient } from "@prisma/client";
import { SALES_TAX_RATE } from "../lib/constants";
import { hashPassword } from "../lib/password";
import { catalogProductSeeds } from "./catalog-seeds";
import { getBootstrapPassword, staffSeeds } from "./staff-seeds";

const prisma = new PrismaClient();

const customerSeeds = [
  {
    name: "Alya Rahman",
    email: "alya@example.com",
    phone: "+60123456789",
    notes: "Prefers radiant daytime florals and soft gifting picks.",
  },
  {
    name: "Daniel Wong",
    email: "daniel@example.com",
    phone: "+60187654321",
    notes: "Often buys clean masculine scents with a polished finish.",
  },
  {
    name: "Sophia Lee",
    email: "sophia@example.com",
    phone: "+60125550123",
    notes: "Gift buyer looking for intimate but premium signatures.",
  },
] as const;

const seededOrders = [
  {
    createdAt: new Date("2026-04-16T11:15:00+08:00"),
    customerEmail: "alya@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Gift wrap requested.",
    items: [
      { slug: "aureya", quantity: 1 },
      { slug: "maris", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-17T15:05:00+08:00"),
    customerEmail: "daniel@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Asked for a clean daytime signature with strong office presence.",
    items: [
      { slug: "zephyr", quantity: 2 },
    ],
  },
  {
    createdAt: new Date("2026-04-18T13:40:00+08:00"),
    customerEmail: "sophia@example.com",
    paymentMethod: PaymentMethod.TRANSFER,
    notes: "Corporate gifting shortlist.",
    items: [
      { slug: "aureya", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-19T17:20:00+08:00"),
    customerEmail: null,
    paymentMethod: PaymentMethod.CASH,
    notes: "Walk-in guest.",
    items: [
      { slug: "maris", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-20T10:10:00+08:00"),
    customerEmail: "alya@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Repeat purchase before a weekend gifting event.",
    items: [
      { slug: "aureya", quantity: 2 },
      { slug: "maris", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-20T14:25:00+08:00"),
    customerEmail: "daniel@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Added one fresh office scent and one intimate skin-close layer.",
    items: [
      { slug: "zephyr", quantity: 2 },
      { slug: "maris", quantity: 1 },
    ],
  },
] as const;

const catalogSeededAt = new Date("2026-04-15T09:00:00+08:00");

function buildOrderNumber(index: number, createdAt: Date) {
  const stamp = createdAt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(".000Z", "")
    .slice(0, 15);

  return `TARA-${stamp}-${String(index + 1).padStart(2, "0")}`;
}

async function main() {
  await prisma.staffUser.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

  const staffUsers = await Promise.all(
    staffSeeds.map((seed) =>
      prisma.staffUser.create({
        data: {
          name: seed.name,
          username: seed.username,
          email: seed.email,
          role: seed.role,
          passwordHash: hashPassword(getBootstrapPassword(seed)),
        },
      }),
    ),
  );

  const soldBySlug = new Map<string, number>();

  seededOrders.forEach((order) => {
    order.items.forEach((item) => {
      soldBySlug.set(item.slug, (soldBySlug.get(item.slug) ?? 0) + item.quantity);
    });
  });

  const products = await Promise.all(
    catalogProductSeeds.map((seed) =>
      prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            slug: seed.slug,
            sku: seed.sku,
            name: seed.name,
            collection: seed.collection,
            description: seed.description,
            notes: seed.notes,
            mood: seed.mood,
            sizeMl: seed.sizeMl,
            priceCents: seed.priceCents,
            reorderLevel: seed.reorderLevel,
            accentHex: seed.accentHex,
            stock: seed.stock,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: InventoryMovementType.SEED,
            quantityDelta: seed.stock + (soldBySlug.get(seed.slug) ?? 0),
            note: "Initial TARA collection stock",
            createdAt: catalogSeededAt,
          },
        });

        return product;
      }),
    ),
  );

  const productMap = new Map(products.map((product) => [product.slug, product]));

  const customers = await Promise.all(
    customerSeeds.map((seed) =>
      prisma.customer.create({
        data: seed,
      }),
    ),
  );

  const customerMap = new Map(customers.map((customer) => [customer.email, customer]));

  for (const [index, seededOrder] of seededOrders.entries()) {
    const lineItems = seededOrder.items.map((item) => {
      const product = productMap.get(item.slug);

      if (!product) {
        throw new Error(`Missing product for seed slug ${item.slug}`);
      }

      return {
        product,
        quantity: item.quantity,
        totalPriceCents: product.priceCents * item.quantity,
      };
    });

    const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
    const taxCents = Math.round(subtotalCents * SALES_TAX_RATE);
    const totalCents = subtotalCents + taxCents;

    const order = await prisma.order.create({
      data: {
        orderNumber: buildOrderNumber(index, seededOrder.createdAt),
        subtotalCents,
        taxCents,
        totalCents,
        paymentMethod: seededOrder.paymentMethod,
        notes: seededOrder.notes,
        customerId: seededOrder.customerEmail
          ? customerMap.get(seededOrder.customerEmail)?.id
          : null,
        createdAt: seededOrder.createdAt,
        updatedAt: seededOrder.createdAt,
        items: {
          create: lineItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPriceCents: item.product.priceCents,
            totalPriceCents: item.totalPriceCents,
            createdAt: seededOrder.createdAt,
          })),
        },
      },
    });

    await Promise.all(
      lineItems.map((item) =>
        prisma.inventoryMovement.create({
          data: {
            productId: item.product.id,
            orderId: order.id,
            type: InventoryMovementType.SALE,
            quantityDelta: -item.quantity,
            note: `Seeded order ${order.orderNumber}`,
            createdAt: seededOrder.createdAt,
          },
        }),
      ),
    );
  }

  console.log(
    `Seeded ${products.length} products, ${customers.length} customers, ${seededOrders.length} sample orders, and ${staffUsers.length} staff accounts.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
