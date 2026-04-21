import { PaymentMethod } from "@prisma/client";
import { SALES_TAX_RATE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";
import type {
  CustomersData,
  DashboardData,
  DashboardStat,
  LowStockInsight,
  OrdersData,
  PosData,
  ProductCardData,
  RecentOrderInsight,
  StaffUsersData,
  TopProductInsight,
} from "@/lib/types";

function atStartOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function serializeProduct(product: {
  id: string;
  slug: string;
  sku: string;
  name: string;
  collection: string;
  description: string;
  notes: string;
  mood: string;
  sizeMl: number;
  priceCents: number;
  stock: number;
  reorderLevel: number;
  accentHex: string;
}): ProductCardData {
  return product;
}

function recommendedRestock(stock: number, reorderLevel: number) {
  const target = Math.max(reorderLevel * 2, 8);
  return Math.max(target - stock, 0);
}

function createZeroSalesTrend() {
  const todayStart = atStartOfDay();
  const salesTrendStart = addDays(todayStart, -6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(salesTrendStart, index);

    return {
      label: date.toLocaleDateString("en-MY", { weekday: "short" }),
      salesCents: 0,
      orders: 0,
    };
  });
}

function emptyDashboardData(databaseIssue?: string): DashboardData {
  const stats: DashboardStat[] = [
    {
      label: "Daily sales",
      value: formatCurrency(0),
      detail: "0 orders today",
    },
    {
      label: "Average order",
      value: formatCurrency(0),
      detail: "0 units sold today",
    },
    {
      label: "Inventory units",
      value: "0",
      detail: "0 low-stock alerts",
    },
    {
      label: "Inventory value",
      value: formatCurrency(0),
      detail: `${formatCurrency(0)} tax pace today`,
    },
  ];

  return {
    stats,
    salesTrend: createZeroSalesTrend(),
    topProducts: [],
    lowStockProducts: [],
    recentOrders: [],
    databaseIssue,
  };
}

function logDatabaseFallback(scope: string, error: unknown) {
  const issue = describeDatabaseIssue(error);
  if (!issue) {
    throw error;
  }

  console.error(`[database:${scope}] ${issue}`, error);
  return issue;
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const prisma = requirePrisma();
    const todayStart = atStartOfDay();
    const tomorrow = addDays(todayStart, 1);
    const salesTrendStart = addDays(todayStart, -6);
    const topProductsStart = addDays(todayStart, -29);

    const [products, todayOrders, weeklyOrders, recentOrders, groupedTopProducts] =
      await prisma.$transaction([
        prisma.product.findMany({
          where: { active: true },
          orderBy: [{ stock: "asc" }, { name: "asc" }],
        }),
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: todayStart,
              lt: tomorrow,
            },
          },
          include: {
            items: {
              select: {
                quantity: true,
              },
            },
          },
        }),
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: salesTrendStart,
            },
          },
          select: {
            id: true,
            totalCents: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          take: 6,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            customer: {
              select: {
                name: true,
              },
            },
            items: {
              select: {
                quantity: true,
              },
            },
          },
        }),
        prisma.orderItem.groupBy({
          by: ["productId"],
          where: {
            order: {
              createdAt: {
                gte: topProductsStart,
              },
            },
          },
          _sum: {
            quantity: true,
            totalPriceCents: true,
          },
          orderBy: {
            _sum: {
              quantity: "desc",
            },
          },
          take: 5,
        }),
      ]);

    const topProductRecords = groupedTopProducts.length
      ? await prisma.product.findMany({
          where: {
            id: {
              in: groupedTopProducts.map((item) => item.productId),
            },
          },
        })
      : [];

    const topProductMap = new Map(topProductRecords.map((product) => [product.id, product]));

    const todaySalesCents = todayOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const todayUnits = todayOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const inventoryUnits = products.reduce((sum, product) => sum + product.stock, 0);
    const inventoryValueCents = products.reduce(
      (sum, product) => sum + product.stock * product.priceCents,
      0,
    );
    const lowStockProducts: LowStockInsight[] = products
      .filter((product) => product.stock <= product.reorderLevel)
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        reorderLevel: product.reorderLevel,
        recommendedRestock: recommendedRestock(product.stock, product.reorderLevel),
        accentHex: product.accentHex,
      }));

    const salesTrend = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(salesTrendStart, index);
      return {
        label: date.toLocaleDateString("en-MY", { weekday: "short" }),
        key: localKey(date),
        salesCents: 0,
        orders: 0,
      };
    });

    const salesTrendMap = new Map(salesTrend.map((point) => [point.key, point]));

    weeklyOrders.forEach((order) => {
      const key = localKey(order.createdAt);
      const bucket = salesTrendMap.get(key);
      if (!bucket) return;
      bucket.salesCents += order.totalCents;
      bucket.orders += 1;
    });

    const topProducts: TopProductInsight[] = groupedTopProducts
      .map((group) => {
        const product = topProductMap.get(group.productId);
        if (!product) return null;

        return {
          id: product.id,
          name: product.name,
          collection: product.collection,
          quantitySold: group._sum?.quantity ?? 0,
          revenueCents: group._sum?.totalPriceCents ?? 0,
          stock: product.stock,
          reorderLevel: product.reorderLevel,
          accentHex: product.accentHex,
        };
      })
      .filter((product): product is TopProductInsight => Boolean(product));

    const recentOrderInsights: RecentOrderInsight[] = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name ?? "Walk-in guest",
      paymentMethod: order.paymentMethod,
      totalCents: order.totalCents,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    const stats: DashboardStat[] = [
      {
        label: "Daily sales",
        value: formatCurrency(todaySalesCents),
        detail: `${todayOrders.length} orders today`,
      },
      {
        label: "Average order",
        value: formatCurrency(
          todayOrders.length ? Math.round(todaySalesCents / todayOrders.length) : 0,
        ),
        detail: `${todayUnits} units sold today`,
      },
      {
        label: "Inventory units",
        value: `${inventoryUnits}`,
        detail: `${lowStockProducts.length} low-stock alerts`,
      },
      {
        label: "Inventory value",
        value: formatCurrency(inventoryValueCents),
        detail: `${formatCurrency(Math.round(todaySalesCents * SALES_TAX_RATE))} tax pace today`,
      },
    ];

    return {
      stats,
      salesTrend: salesTrend.map((point) => ({
        label: point.label,
        salesCents: point.salesCents,
        orders: point.orders,
      })),
      topProducts,
      lowStockProducts,
      recentOrders: recentOrderInsights,
    };
  } catch (error) {
    return emptyDashboardData(logDatabaseFallback("dashboard", error));
  }
}

export async function getPosData(): Promise<PosData> {
  try {
    const prisma = requirePrisma();
    const [products, customers] = await prisma.$transaction([
      prisma.product.findMany({
        where: { active: true },
        orderBy: [{ collection: "asc" }, { name: "asc" }],
      }),
      prisma.customer.findMany({
        take: 6,
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        include: {
          orders: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              totalCents: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return {
      products: products.map(serializeProduct),
      recentCustomers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        lastPurchaseAt: customer.orders[0]?.createdAt.toISOString() ?? null,
        lifetimeValueCents: customer.orders.reduce((sum, order) => sum + order.totalCents, 0),
      })),
    };
  } catch (error) {
    return {
      products: [],
      recentCustomers: [],
      databaseIssue: logDatabaseFallback("pos", error),
    };
  }
}

export async function getCustomersData(): Promise<CustomersData> {
  try {
    const prisma = requirePrisma();
    const customers = await prisma.customer.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      include: {
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            totalCents: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        ordersCount: customer.orders.length,
        lifetimeValueCents: customer.orders.reduce((sum, order) => sum + order.totalCents, 0),
        lastPurchaseAt: customer.orders[0]?.createdAt.toISOString() ?? null,
      })),
    };
  } catch (error) {
    return {
      customers: [],
      databaseIssue: logDatabaseFallback("customers", error),
    };
  }
}

export async function getOrdersData(): Promise<OrdersData> {
  try {
    const prisma = requirePrisma();
    const orders = await prisma.order.findMany({
      take: 30,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        totalCents: order.totalCents,
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        createdAt: order.createdAt.toISOString(),
        customerName: order.customer?.name ?? "Walk-in guest",
        notes: order.notes,
        itemSummary: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          totalPriceCents: item.totalPriceCents,
        })),
      })),
    };
  } catch (error) {
    return {
      orders: [],
      databaseIssue: logDatabaseFallback("orders", error),
    };
  }
}

export async function getPaymentMix() {
  try {
    const prisma = requirePrisma();
    const orders = await prisma.order.findMany({
      select: {
        paymentMethod: true,
        totalCents: true,
      },
    });

    return (Object.values(PaymentMethod) as PaymentMethod[]).map((method) => {
      const matchingOrders = orders.filter((order) => order.paymentMethod === method);
      return {
        method,
        count: matchingOrders.length,
        totalCents: matchingOrders.reduce((sum, order) => sum + order.totalCents, 0),
      };
    });
  } catch (error) {
    logDatabaseFallback("payment-mix", error);
    return (Object.values(PaymentMethod) as PaymentMethod[]).map((method) => ({
      method,
      count: 0,
      totalCents: 0,
    }));
  }
}

export async function getStaffUsersData(): Promise<StaffUsersData> {
  try {
    const prisma = requirePrisma();
    const staffUsers = await prisma.staffUser.findMany({
      orderBy: [{ name: "asc" }],
    });
    const roleOrder = {
      MANAGER: 0,
      SALES_MANAGER: 1,
    } as const;

    return {
      staffUsers: staffUsers
        .map((staffUser) => ({
          id: staffUser.id,
          name: staffUser.name,
          username: staffUser.username,
          email: staffUser.email,
          role: staffUser.role,
          active: staffUser.active,
          lastLoginAt: staffUser.lastLoginAt?.toISOString() ?? null,
          createdAt: staffUser.createdAt.toISOString(),
        }))
        .sort(
          (left, right) =>
            roleOrder[left.role] - roleOrder[right.role] || left.name.localeCompare(right.name),
        ),
    };
  } catch (error) {
    return {
      staffUsers: [],
      databaseIssue: logDatabaseFallback("staff", error),
    };
  }
}
