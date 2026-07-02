import { OrderStatus, PaymentMethod } from "@prisma/client";
import { buildStaffCommissionProgress, isSeniorScentTrailLead } from "@/lib/commissions";
import { formatCurrency, formatInteger } from "@/lib/format";
import { getProductImageUrl } from "@/lib/product-media";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";
import { isStop04PromotionNote } from "@/lib/stop04-strategy";
import {
  addUtcDays,
  getMalaysiaDateKey,
  getMalaysiaDayStart,
  getMalaysiaWeekdayLabel,
} from "@/lib/time";
import type {
  CustomersData,
  DashboardData,
  DashboardStat,
  InventoryAdminData,
  LowStockInsight,
  OrderAmendmentProduct,
  OrdersData,
  PosData,
  PromotionInsight,
  ProductCardData,
  QuizLeadsData,
  RecentOrderInsight,
  StaffUsersData,
  TopProductInsight,
} from "@/lib/types";

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
  return {
    ...product,
    imageUrl: getProductImageUrl(product.slug),
  };
}

function recommendedRestock(stock: number, reorderLevel: number) {
  const target = Math.max(reorderLevel * 2, 8);
  return Math.max(target - stock, 0);
}

function createZeroSalesTrend() {
  const todayStart = getMalaysiaDayStart();
  const salesTrendStart = addUtcDays(todayStart, -6);
  const todayKey = getMalaysiaDateKey(todayStart);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(salesTrendStart, index);
    const key = getMalaysiaDateKey(date);

    return {
      key,
      label: getMalaysiaWeekdayLabel(date),
      salesCents: 0,
      orders: 0,
      isToday: key === todayKey,
    };
  });
}

function describeCurrencyChange(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return { comparison: "No change vs yesterday", tone: "muted" as const };
  }

  if (previous === 0) {
    return current > 0
      ? { comparison: "New lift vs yesterday", tone: "positive" as const }
      : { comparison: "No trade vs yesterday", tone: "muted" as const };
  }

  const delta = current - previous;

  if (delta === 0) {
    return { comparison: "Flat vs yesterday", tone: "default" as const };
  }

  const percent = Math.round((Math.abs(delta) / previous) * 100);

  return {
    comparison: `${delta > 0 ? "↑" : "↓"} ${percent}% vs yesterday`,
    tone: delta > 0 ? ("positive" as const) : ("warning" as const),
  };
}

function describeCountChange(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return { comparison: "No change vs yesterday", tone: "muted" as const };
  }

  if (previous === 0) {
    return current > 0
      ? { comparison: "New movement vs yesterday", tone: "positive" as const }
      : { comparison: "No activity vs yesterday", tone: "muted" as const };
  }

  const delta = current - previous;

  if (delta === 0) {
    return { comparison: "Flat vs yesterday", tone: "default" as const };
  }

  return {
    comparison: `${delta > 0 ? "+" : "-"}${formatInteger(Math.abs(delta))} vs yesterday`,
    tone: delta > 0 ? ("positive" as const) : ("warning" as const),
  };
}

type PromotionOrderSnapshot = {
  totalCents: number;
  notes: string | null;
  items: Array<{
    quantity: number;
    product: {
      name: string;
      sizeMl: number;
    };
  }>;
};

function buildPromotionInsights(orders: PromotionOrderSnapshot[]): PromotionInsight[] {
  return [
    {
      id: "PUBLIC_MARKET_STOP04",
      label: "Scent Trail travel sets",
      detail: "RM99/RM129/RM188 travel-size set ladder",
      orders: 0,
      revenueCents: 0,
      highlight: "No recent Scent Trail sets",
    },
    {
      id: "FOLLOW_TAG_UNLOCK",
      label: "Follow.Tag.Unlock",
      detail: "Booth-only QR unlock pricing",
      orders: 0,
      revenueCents: 0,
      highlight: "No recent unlocks",
    },
    {
      id: "SUNWAY_STUDENT",
      label: "Student discount",
      detail: "20% off 50mL with travel gift",
      orders: 0,
      revenueCents: 0,
      highlight: "No recent student baskets",
    },
    {
      id: "VENDOR_EXCLUSIVE",
      label: "Vendor exclusive",
      detail: "Approved vendor RM30 nett 8mL pricing",
      orders: 0,
      revenueCents: 0,
      highlight: "No recent vendor baskets",
    },
  ].map((insight) => {
    const matchingOrders = orders.filter((order) => {
      const notes = order.notes ?? "";

      if (insight.id === "PUBLIC_MARKET_STOP04") {
        return isStop04PromotionNote(notes);
      }

      if (insight.id === "FOLLOW_TAG_UNLOCK") {
        return notes.includes("Promotion: Booth 66 Follow.Tag.Unlock");
      }

      if (insight.id === "SUNWAY_STUDENT") {
        return notes.includes("Promotion: Student discount");
      }

      return notes.includes("Promotion: Vendor exclusive");
    });

    const revenueCents = matchingOrders.reduce((sum, order) => sum + order.totalCents, 0);

    if (!matchingOrders.length) {
      return insight;
    }

    if (insight.id === "PUBLIC_MARKET_STOP04") {
      const eightMlUnits = matchingOrders.reduce(
        (sum, order) =>
          sum +
          order.items
            .filter((item) => item.product.sizeMl === 8)
            .reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );

      return {
        ...insight,
        orders: matchingOrders.length,
        revenueCents,
        highlight: `${eightMlUnits} 8mL unit${eightMlUnits === 1 ? "" : "s"} moved in set pricing`,
      };
    }

    if (insight.id === "SUNWAY_STUDENT") {
      const discountedBottleCount = matchingOrders.reduce((sum, order) => {
        const match = order.notes?.match(/Student discount on (\d+) x 50mL/i);
        return sum + Number(match?.[1] ?? 0);
      }, 0);

      return {
        ...insight,
        orders: matchingOrders.length,
        revenueCents,
        highlight: `${discountedBottleCount || matchingOrders.length} full-size bottle${discountedBottleCount === 1 ? "" : "s"} discounted`,
      };
    }

    if (insight.id === "VENDOR_EXCLUSIVE") {
      const vendorEightMlUnits = matchingOrders.reduce(
        (sum, order) =>
          sum +
          order.items
            .filter((item) => item.product.sizeMl === 8)
            .reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );

      return {
        ...insight,
        orders: matchingOrders.length,
        revenueCents,
        highlight: `${vendorEightMlUnits} vendor 8mL unit${vendorEightMlUnits === 1 ? "" : "s"} sold at RM30 nett`,
      };
    }

    const unlockedUnits = matchingOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    return {
      ...insight,
      orders: matchingOrders.length,
      revenueCents,
      highlight: `${unlockedUnits} unit${unlockedUnits === 1 ? "" : "s"} sold on unlock pricing`,
    };
  });
}

function emptyDashboardData(databaseIssue?: string): DashboardData {
  const stats: DashboardStat[] = [
    {
      label: "Daily sales",
      value: formatCurrency(0),
      detail: "No completed sales yet today",
      comparison: "No change vs yesterday",
      tone: "muted",
    },
    {
      label: "Orders today",
      value: "0",
      detail: "Selling floor is still quiet today",
      comparison: "No change vs yesterday",
      tone: "muted",
    },
    {
      label: "Average order",
      value: formatCurrency(0),
      detail: "No baskets closed yet",
      comparison: "No change vs yesterday",
      tone: "muted",
    },
    {
      label: "Inventory watch",
      value: "0",
      detail: "All core scents are above reorder level",
      comparison: "0 units on hand",
      tone: "positive",
    },
  ];

  return {
    stats,
    salesTrend: createZeroSalesTrend(),
    topProducts: [],
    lowStockProducts: [],
    recentOrders: [],
    promotionInsights: [],
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

const completedOrderWhere = {
  status: OrderStatus.COMPLETED,
} as const;

const staffCommissionOrderInclude = {
  items: {
    select: {
      quantity: true,
      commissionCents: true,
      product: {
        select: {
          sizeMl: true,
        },
      },
    },
  },
} as const;

const seniorScentTrailOrderInclude = {
  ...staffCommissionOrderInclude,
  salesperson: {
    select: {
      name: true,
      username: true,
    },
  },
} as const;

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const prisma = requirePrisma();
    const todayStart = getMalaysiaDayStart();
    const todayKey = getMalaysiaDateKey(todayStart);
    const tomorrow = addUtcDays(todayStart, 1);
    const yesterdayStart = addUtcDays(todayStart, -1);
    const salesTrendStart = addUtcDays(todayStart, -6);
    const topProductsStart = addUtcDays(todayStart, -29);

    const [
      products,
      todayOrders,
      weeklyOrders,
      recentOrders,
      groupedTopProducts,
      promotionOrders,
    ] = await prisma.$transaction([
        prisma.product.findMany({
          where: { active: true },
          orderBy: [{ stock: "asc" }, { name: "asc" }],
        }),
        prisma.order.findMany({
          where: {
            ...completedOrderWhere,
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
            ...completedOrderWhere,
            createdAt: {
              gte: salesTrendStart,
            },
          },
          select: {
            id: true,
            totalCents: true,
            commissionCents: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
              },
            },
          },
        }),
        prisma.order.findMany({
          take: 6,
          where: completedOrderWhere,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            customer: {
              select: {
                name: true,
              },
            },
            salesperson: {
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
              status: OrderStatus.COMPLETED,
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
        prisma.order.findMany({
          where: {
            ...completedOrderWhere,
            createdAt: {
              gte: topProductsStart,
            },
            notes: {
              not: null,
            },
          },
          select: {
            totalCents: true,
            notes: true,
            items: {
              select: {
                quantity: true,
                product: {
                  select: {
                    name: true,
                    sizeMl: true,
                  },
                },
              },
            },
          },
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

    const yesterdayOrders = weeklyOrders.filter(
      (order) => order.createdAt >= yesterdayStart && order.createdAt < todayStart,
    );
    const todaySalesCents = todayOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const todayUnits = todayOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const yesterdaySalesCents = yesterdayOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const todayAverageOrderCents = todayOrders.length
      ? Math.round(todaySalesCents / todayOrders.length)
      : 0;
    const yesterdayAverageOrderCents = yesterdayOrders.length
      ? Math.round(yesterdaySalesCents / yesterdayOrders.length)
      : 0;
    const inventoryUnits = products.reduce((sum, product) => sum + product.stock, 0);
    const criticalLowStockCount = products.filter(
      (product) => product.stock <= Math.max(1, Math.floor(product.reorderLevel / 2)),
    ).length;
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
      const date = addUtcDays(salesTrendStart, index);
      const key = getMalaysiaDateKey(date);

      return {
        key,
        label: getMalaysiaWeekdayLabel(date),
        salesCents: 0,
        orders: 0,
        isToday: key === todayKey,
      };
    });

    const salesTrendMap = new Map(salesTrend.map((point) => [point.key, point]));

    weeklyOrders.forEach((order) => {
      const key = getMalaysiaDateKey(order.createdAt);
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
      salespersonName: order.salesperson?.name ?? null,
      paymentMethod: order.paymentMethod,
      totalCents: order.totalCents,
      commissionCents: order.commissionCents,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    const stats: DashboardStat[] = [
      (() => {
        const change = describeCurrencyChange(todaySalesCents, yesterdaySalesCents);
        return {
          label: "Daily sales",
          value: formatCurrency(todaySalesCents),
          detail: todayOrders.length
            ? `${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"} closed today`
            : "No completed sales yet today",
          comparison: change.comparison,
          tone: change.tone,
        } satisfies DashboardStat;
      })(),
      (() => {
        const change = describeCountChange(todayOrders.length, yesterdayOrders.length);
        return {
          label: "Orders today",
          value: formatInteger(todayOrders.length),
          detail: todayUnits
            ? `${formatInteger(todayUnits)} unit${todayUnits === 1 ? "" : "s"} moved today`
            : "Selling floor is still quiet today",
          comparison: change.comparison,
          tone: change.tone,
        } satisfies DashboardStat;
      })(),
      (() => {
        const change = describeCurrencyChange(
          todayAverageOrderCents,
          yesterdayAverageOrderCents,
        );
        return {
          label: "Average order",
          value: formatCurrency(todayAverageOrderCents),
          detail: todayOrders.length
            ? `${formatInteger(todayUnits)} units across today’s baskets`
            : "No baskets closed yet",
          comparison: change.comparison,
          tone: change.tone,
        } satisfies DashboardStat;
      })(),
      {
        label: "Inventory watch",
        value: formatInteger(lowStockProducts.length),
        detail: lowStockProducts.length
          ? `${criticalLowStockCount} critical scent${criticalLowStockCount === 1 ? "" : "s"} need attention`
          : "All core scents are above reorder level",
        comparison: `${formatInteger(inventoryUnits)} units on hand`,
        tone: lowStockProducts.length ? "warning" : "positive",
      },
    ];

    return {
      stats,
      salesTrend,
      topProducts,
      lowStockProducts,
      recentOrders: recentOrderInsights,
      promotionInsights: buildPromotionInsights(promotionOrders),
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
            where: completedOrderWhere,
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
          where: completedOrderWhere,
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

export async function getQuizLeadsData(): Promise<QuizLeadsData> {
  try {
    const prisma = requirePrisma();
    const leads = await prisma.quizLead.findMany({
      take: 250,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        convertedCustomer: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      leads: leads.map((lead) => ({
        id: lead.id,
        leadNumber: lead.leadNumber,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        ageRange: lead.ageRange,
        genderIdentity: lead.genderIdentity,
        city: lead.city,
        eventName: lead.eventName,
        source: lead.source,
        resultScent: lead.resultScent,
        secondaryScent: lead.secondaryScent,
        purchaseIntent: lead.purchaseIntent,
        marketingConsent: lead.marketingConsent,
        notes: lead.notes,
        convertedCustomerId: lead.convertedCustomerId,
        convertedCustomerName: lead.convertedCustomer?.name ?? null,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      leads: [],
      databaseIssue: logDatabaseFallback("quiz-leads", error),
    };
  }
}

const ORDERS_PAGE_SIZE = 12;

export async function getOrdersData(page = 1): Promise<OrdersData> {
  try {
    const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const skip = (currentPage - 1) * ORDERS_PAGE_SIZE;
    const prisma = requirePrisma();
    const orders = await prisma.order.findMany({
      take: ORDERS_PAGE_SIZE + 1,
      skip,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        totalCents: true,
        subtotalCents: true,
        taxCents: true,
        commissionCents: true,
        createdAt: true,
        voidedAt: true,
        voidReason: true,
        voidedByName: true,
        voidInventoryAction: true,
        notes: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            notes: true,
          },
        },
        salesperson: {
          select: {
            name: true,
          },
        },
        items: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            quantity: true,
            totalPriceCents: true,
            commissionCents: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sizeMl: true,
                stock: true,
                reorderLevel: true,
              },
            },
            unitPriceCents: true,
          },
        },
      },
    });
    const hasNextPage = orders.length > ORDERS_PAGE_SIZE;
    const visibleOrders = hasNextPage ? orders.slice(0, ORDERS_PAGE_SIZE) : orders;

    return {
      page: currentPage,
      pageSize: ORDERS_PAGE_SIZE,
      hasNextPage,
      hasPreviousPage: currentPage > 1,
      orders: visibleOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalCents: order.totalCents,
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        commissionCents: order.commissionCents,
        createdAt: order.createdAt.toISOString(),
        voidedAt: order.voidedAt?.toISOString() ?? null,
        voidReason: order.voidReason,
        voidedByName: order.voidedByName,
        voidInventoryAction: order.voidInventoryAction,
        customerName: order.customer?.name ?? "Walk-in guest",
        customerSocialHandle: order.customer?.email ?? null,
        customerPhone: order.customer?.phone ?? null,
        customerNotes: order.customer?.notes ?? null,
        salespersonName: order.salesperson?.name ?? null,
        notes: order.notes,
        itemSummary: order.items.map((item) => ({
          id: item.id,
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          productSizeMl: item.product.sizeMl,
          productStock: item.product.stock,
          productReorderLevel: item.product.reorderLevel,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
          commissionCents: item.commissionCents,
        })),
      })),
    };
  } catch (error) {
    return {
      page: 1,
      pageSize: ORDERS_PAGE_SIZE,
      hasNextPage: false,
      hasPreviousPage: false,
      orders: [],
      databaseIssue: logDatabaseFallback("orders", error),
    };
  }
}

export async function getOrderAmendmentProducts(): Promise<OrderAmendmentProduct[]> {
  try {
    const prisma = requirePrisma();
    return prisma.product.findMany({
      where: {
        active: true,
      },
      orderBy: [{ collection: "asc" }, { name: "asc" }, { sizeMl: "desc" }],
      select: {
        id: true,
        name: true,
        sku: true,
        sizeMl: true,
        priceCents: true,
        stock: true,
        reorderLevel: true,
      },
    });
  } catch (error) {
    logDatabaseFallback("order-amendment-products", error);
    return [];
  }
}

export async function getPaymentMix() {
  try {
    const prisma = requirePrisma();
    const orders = await prisma.order.findMany({
      where: completedOrderWhere,
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
    const [staffUsers, seniorOverrideOrders] = await Promise.all([
      prisma.staffUser.findMany({
        orderBy: [{ name: "asc" }],
        include: {
          ordersSold: {
            where: completedOrderWhere,
            orderBy: {
              createdAt: "desc",
            },
            include: staffCommissionOrderInclude,
          },
        },
      }),
      prisma.order.findMany({
        where: completedOrderWhere,
        orderBy: {
          createdAt: "desc",
        },
        include: seniorScentTrailOrderInclude,
      }),
    ]);
    const hasSeniorLead = staffUsers.some((staffUser) => isSeniorScentTrailLead(staffUser.username));
    const teamOrders = hasSeniorLead ? seniorOverrideOrders : [];
    const roleOrder = {
      MANAGER: 0,
      SALES_MANAGER: 1,
      CASHIER: 2,
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
          commissionProgress: buildStaffCommissionProgress(staffUser.ordersSold, new Date(), {
            staffUsername: staffUser.username,
            teamOrders,
          }),
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

export async function getStaffCommissionProgress(staffId: string) {
  try {
    const prisma = requirePrisma();
    const [staffUser, seniorOverrideOrders] = await Promise.all([
      prisma.staffUser.findUnique({
        where: { id: staffId },
        include: {
          ordersSold: {
            where: completedOrderWhere,
            orderBy: {
              createdAt: "desc",
            },
            include: staffCommissionOrderInclude,
          },
        },
      }),
      prisma.order.findMany({
        where: completedOrderWhere,
        orderBy: {
          createdAt: "desc",
        },
        include: seniorScentTrailOrderInclude,
      }),
    ]);

    return staffUser
      ? buildStaffCommissionProgress(staffUser.ordersSold, new Date(), {
          staffUsername: staffUser.username,
          teamOrders: isSeniorScentTrailLead(staffUser.username) ? seniorOverrideOrders : [],
        })
      : null;
  } catch (error) {
    logDatabaseFallback("staff-commission", error);
    return null;
  }
}

export async function getInventoryAdminData(): Promise<InventoryAdminData> {
  try {
    const prisma = requirePrisma();
    const [products, recentMovements] = await prisma.$transaction([
      prisma.product.findMany({
        orderBy: [{ active: "desc" }, { collection: "asc" }, { name: "asc" }],
      }),
      prisma.inventoryMovement.findMany({
        take: 14,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      products: products.map((product) => ({
        ...serializeProduct(product),
        active: product.active,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      })),
      recentMovements: recentMovements.map((movement) => ({
        id: movement.id,
        productId: movement.product.id,
        productName: movement.product.name,
        type: movement.type,
        quantityDelta: movement.quantityDelta,
        note: movement.note,
        createdAt: movement.createdAt.toISOString(),
        orderNumber: movement.order?.orderNumber ?? null,
      })),
    };
  } catch (error) {
    return {
      products: [],
      recentMovements: [],
      databaseIssue: logDatabaseFallback("inventory-admin", error),
    };
  }
}
