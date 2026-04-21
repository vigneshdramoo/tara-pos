import { InventoryMovementType, PaymentMethod, PrismaClient } from "@prisma/client";
import { SALES_TAX_RATE } from "../lib/constants";
import { hashPassword } from "../lib/password";
import { getBootstrapPassword, staffSeeds } from "./staff-seeds";

const prisma = new PrismaClient();

const productSeeds = [
  {
    slug: "midnight-saffron",
    sku: "TARA-50-001",
    name: "Midnight Saffron",
    collection: "Maison Core",
    description: "Velvet saffron wrapped in rose, suede, and a dusk-soft amber trail.",
    notes: "Saffron, Turkish rose, suede",
    mood: "Smoky floral warmth with an evening-lounge finish.",
    sizeMl: 50,
    priceCents: 9800,
    openingStock: 9,
    reorderLevel: 6,
    accentHex: "#8F5A47",
  },
  {
    slug: "neroli-veil",
    sku: "TARA-50-002",
    name: "Neroli Veil",
    collection: "Maison Core",
    description: "Clean citrus and white tea for a bright, airy daytime signature.",
    notes: "Neroli, petitgrain, white tea",
    mood: "Fresh linen elegance with a polished citrus top note.",
    sizeMl: 50,
    priceCents: 9200,
    openingStock: 16,
    reorderLevel: 8,
    accentHex: "#D7AE68",
  },
  {
    slug: "cedar-silk",
    sku: "TARA-50-003",
    name: "Cedar Silk",
    collection: "Maison Core",
    description: "Iris and cedar folded into a sheer, skin-soft wood accord.",
    notes: "Atlas cedar, iris, skin musk",
    mood: "Quiet structure and soft tailoring.",
    sizeMl: 50,
    priceCents: 9600,
    openingStock: 11,
    reorderLevel: 6,
    accentHex: "#8A7765",
  },
  {
    slug: "rose-ash",
    sku: "TARA-50-004",
    name: "Rose Ash",
    collection: "Reserve",
    description: "Damask rose cut with incense and the dry elegance of cooled ash.",
    notes: "Damask rose, olibanum, ash accord",
    mood: "Dark romanticism with a modern mineral edge.",
    sizeMl: 50,
    priceCents: 10400,
    openingStock: 6,
    reorderLevel: 5,
    accentHex: "#A77279",
  },
  {
    slug: "fig-nocturne",
    sku: "TARA-50-005",
    name: "Fig Nocturne",
    collection: "Reserve",
    description: "Green fig and black tea resting on creamy sandalwood.",
    notes: "Fig leaf, black tea, sandalwood",
    mood: "Cultured, green, and softly nocturnal.",
    sizeMl: 50,
    priceCents: 9900,
    openingStock: 12,
    reorderLevel: 7,
    accentHex: "#76815E",
  },
  {
    slug: "salted-jasmine",
    sku: "TARA-50-006",
    name: "Salted Jasmine",
    collection: "Atelier Fresh",
    description: "Sea air, jasmine sambac, and driftwood designed for clean summer energy.",
    notes: "Sea salt, jasmine sambac, driftwood",
    mood: "Radiant and beach-lit without losing refinement.",
    sizeMl: 50,
    priceCents: 8900,
    openingStock: 15,
    reorderLevel: 8,
    accentHex: "#7EA6A8",
  },
  {
    slug: "velvet-amber",
    sku: "TARA-50-007",
    name: "Velvet Amber",
    collection: "Atelier Deep",
    description: "A slow amber with tonka and smoked vanilla at the base.",
    notes: "Amber resin, tonka, vanilla smoke",
    mood: "Lush and enveloping for evening clientele.",
    sizeMl: 50,
    priceCents: 10800,
    openingStock: 7,
    reorderLevel: 5,
    accentHex: "#A06D53",
  },
  {
    slug: "white-oud-linen",
    sku: "TARA-50-008",
    name: "White Oud Linen",
    collection: "Atelier Deep",
    description: "A clean oud interpretation lifted with pear skin and cashmere musk.",
    notes: "White oud, pear skin, cashmere",
    mood: "Textural luxury with a luminous top.",
    sizeMl: 50,
    priceCents: 11200,
    openingStock: 5,
    reorderLevel: 4,
    accentHex: "#CDB695",
  },
] as const;

const customerSeeds = [
  {
    name: "Alya Rahman",
    email: "alya@example.com",
    phone: "+60123456789",
    notes: "Prefers airy daytime florals.",
  },
  {
    name: "Daniel Wong",
    email: "daniel@example.com",
    phone: "+60187654321",
    notes: "Often buys darker evening scents.",
  },
  {
    name: "Sophia Lee",
    email: "sophia@example.com",
    phone: "+60125550123",
    notes: "New client, gift buyer.",
  },
] as const;

const seededOrders = [
  {
    createdAt: new Date("2026-04-16T11:15:00+08:00"),
    customerEmail: "alya@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Gift wrap requested.",
    items: [
      { slug: "neroli-veil", quantity: 1 },
      { slug: "salted-jasmine", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-17T15:05:00+08:00"),
    customerEmail: "daniel@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Requested reserve collection samples.",
    items: [
      { slug: "midnight-saffron", quantity: 1 },
      { slug: "rose-ash", quantity: 1 },
      { slug: "velvet-amber", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-18T13:40:00+08:00"),
    customerEmail: "sophia@example.com",
    paymentMethod: PaymentMethod.TRANSFER,
    notes: "Corporate gifting shortlist.",
    items: [
      { slug: "white-oud-linen", quantity: 1 },
      { slug: "cedar-silk", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-19T17:20:00+08:00"),
    customerEmail: null,
    paymentMethod: PaymentMethod.CASH,
    notes: "Walk-in guest.",
    items: [
      { slug: "midnight-saffron", quantity: 1 },
      { slug: "fig-nocturne", quantity: 1 },
      { slug: "salted-jasmine", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-20T10:10:00+08:00"),
    customerEmail: "alya@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Repeat purchase for travel set gifting.",
    items: [
      { slug: "midnight-saffron", quantity: 2 },
      { slug: "rose-ash", quantity: 1 },
      { slug: "white-oud-linen", quantity: 1 },
    ],
  },
  {
    createdAt: new Date("2026-04-20T14:25:00+08:00"),
    customerEmail: "daniel@example.com",
    paymentMethod: PaymentMethod.CARD,
    notes: "Added one deep scent and one fresh layer.",
    items: [
      { slug: "velvet-amber", quantity: 2 },
      { slug: "neroli-veil", quantity: 2 },
      { slug: "cedar-silk", quantity: 1 },
      { slug: "fig-nocturne", quantity: 1 },
      { slug: "salted-jasmine", quantity: 2 },
    ],
  },
] as const;

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
    productSeeds.map((seed) =>
      prisma.product.create({
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
          stock: seed.openingStock - (soldBySlug.get(seed.slug) ?? 0),
        },
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
