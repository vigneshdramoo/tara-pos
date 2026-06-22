import {
  InventoryMovementType,
  OrderStatus,
  OrderVoidInventoryAction,
  Prisma,
  type Customer,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSessionCookieName,
  isProtectionEnabled,
  verifySessionToken,
} from "@/lib/auth";
import {
  calculateCheckoutPricing,
  type CheckoutPromotionId,
} from "@/lib/checkout-pricing";
import { calculateLineCommissionFromTotal } from "@/lib/commissions";
import { SALES_TAX_RATE } from "@/lib/constants";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";
import { canAmendOrders } from "@/lib/staff";
import { formatFullDateTime } from "@/lib/format";

export const preferredRegion = "sin1";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type OrderAmendmentPayload = {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  items?: Array<{
    productId?: string;
    quantity?: number | string;
  }>;
  notes?: string;
  reason?: string;
};

type OrderVoidPayload = {
  reason?: string;
  inventoryAction?: OrderVoidInventoryAction;
};

class OrderAmendmentError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

function nullableText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function parseNonNegativeQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(normalizeText(value));

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new OrderAmendmentError("Line quantities must be whole numbers of 0 or more.", 400);
  }

  return quantity;
}

function inferPromotionId(notes: string | null): CheckoutPromotionId {
  const normalizedNotes = notes ?? "";

  if (/student discount/i.test(normalizedNotes)) {
    return "SUNWAY_STUDENT";
  }

  if (/follow\.tag\.unlock/i.test(normalizedNotes)) {
    return "FOLLOW_TAG_UNLOCK";
  }

  if (/stop 04|public market|huuha land|travel bundle|3\s*x\s*8ml\s*edp/i.test(normalizedNotes)) {
    return "PUBLIC_MARKET_STOP04";
  }

  return "NONE";
}

function parseVoidInventoryAction(value: unknown) {
  if (value === OrderVoidInventoryAction.RESTOCKED) {
    return OrderVoidInventoryAction.RESTOCKED;
  }

  if (value === OrderVoidInventoryAction.KEPT_AS_TESTER) {
    return OrderVoidInventoryAction.KEPT_AS_TESTER;
  }

  throw new OrderAmendmentError("Choose how inventory should be handled for this void.", 400);
}

function normalizeAmendmentItems(items: OrderAmendmentPayload["items"]) {
  if (!Array.isArray(items)) {
    throw new OrderAmendmentError("Add at least one order line before saving.", 400);
  }

  const quantitiesByProductId = new Map<string, number>();

  items.forEach((item) => {
    const productId = normalizeText(item?.productId);
    if (!productId) return;

    const quantity = parseNonNegativeQuantity(item?.quantity);
    if (quantity === 0) return;

    quantitiesByProductId.set(productId, (quantitiesByProductId.get(productId) ?? 0) + quantity);
  });

  if (!quantitiesByProductId.size) {
    throw new OrderAmendmentError("Keep at least one product on the amended order.", 400);
  }

  return quantitiesByProductId;
}

async function getManagerSession() {
  if (!isProtectionEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    throw new OrderAmendmentError("Sign in again before amending an order.", 401);
  }

  if (!canAmendOrders(session.role)) {
    throw new OrderAmendmentError("Only a manager can amend completed orders.", 403);
  }

  return session;
}

async function resolveAmendedCustomer(
  tx: Prisma.TransactionClient,
  currentCustomerId: string | null,
  payload: OrderAmendmentPayload["customer"],
) {
  if (!payload) {
    return currentCustomerId;
  }

  const name = optionalText(payload.name);
  const email = nullableText(payload.email);
  const phone = nullableText(payload.phone);
  const notes = nullableText(payload.notes);

  if (!name && !email && !phone && !notes) {
    return null;
  }

  const currentCustomer = currentCustomerId
    ? await tx.customer.findUnique({ where: { id: currentCustomerId } })
    : null;
  const matchFilters = [
    phone ? { phone } : null,
    email ? { email } : null,
  ].filter((filter): filter is { phone: string } | { email: string } => Boolean(filter));
  const matchingCustomer =
    matchFilters.length > 0
      ? await tx.customer.findFirst({
          where: {
            OR: matchFilters,
          },
        })
      : null;
  const targetCustomer = matchingCustomer ?? currentCustomer;

  if (targetCustomer) {
    const updatedCustomer: Customer = await tx.customer.update({
      where: { id: targetCustomer.id },
      data: {
        name: name ?? targetCustomer.name,
        email,
        phone,
        notes,
      },
    });

    return updatedCustomer.id;
  }

  const customer = await tx.customer.create({
    data: {
      name: name ?? "Walk-in guest",
      email,
      phone,
      notes,
    },
  });

  return customer.id;
}

function revalidateOrderAmendmentPaths() {
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/assistant");
  revalidatePath("/customers");
  revalidatePath("/inventory");
  revalidatePath("/orders");
  revalidatePath("/pos");
  revalidatePath("/staff");
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const session = await getManagerSession();
    const body = (await request.json().catch(() => null)) as OrderAmendmentPayload | null;

    if (!body) {
      throw new OrderAmendmentError("Send the corrected order details before saving.", 400);
    }

    const reason = normalizeText(body.reason);
    if (reason.length < 3) {
      throw new OrderAmendmentError("Add a short correction reason before saving.", 400);
    }

    const requestedQuantitiesByProductId = normalizeAmendmentItems(body.items);
    const requestedProductIds = [...requestedQuantitiesByProductId.keys()];
    const prisma = requirePrisma();

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new OrderAmendmentError("That order could not be found anymore.", 404);
      }

      if (order.status === OrderStatus.VOIDED) {
        throw new OrderAmendmentError("That order is already voided.", 400);
      }

      const existingQuantitiesByProductId = new Map<string, number>();
      order.items.forEach((item) => {
        existingQuantitiesByProductId.set(
          item.productId,
          (existingQuantitiesByProductId.get(item.productId) ?? 0) + item.quantity,
        );
      });

      const products = await tx.product.findMany({
        where: {
          id: {
            in: requestedProductIds,
          },
        },
      });

      if (products.length !== requestedProductIds.length) {
        throw new OrderAmendmentError("One or more amended products could not be found.", 400);
      }

      const productsById = new Map(products.map((product) => [product.id, product]));
      const normalizedItems = requestedProductIds.map((productId) => {
        const product = productsById.get(productId);
        if (!product) {
          throw new OrderAmendmentError("One or more amended products could not be found.", 400);
        }

        const wasAlreadyOnOrder = existingQuantitiesByProductId.has(productId);
        if (!product.active && !wasAlreadyOnOrder) {
          throw new OrderAmendmentError(`${product.name} is inactive and cannot be added.`, 400);
        }

        const requestedQuantity = requestedQuantitiesByProductId.get(productId) ?? 0;
        const existingQuantity = existingQuantitiesByProductId.get(productId) ?? 0;
        const additionalUnitsNeeded = requestedQuantity - existingQuantity;

        if (additionalUnitsNeeded > product.stock) {
          throw new OrderAmendmentError(
            `${product.name} only has ${product.stock} extra unit${
              product.stock === 1 ? "" : "s"
            } available.`,
            400,
          );
        }

        return {
          product,
          quantity: requestedQuantity,
        };
      });

      const promotionId = inferPromotionId(order.notes);
      const checkoutPricing = calculateCheckoutPricing(
        normalizedItems.map((item) => ({
          productId: item.product.id,
          sizeMl: item.product.sizeMl,
          priceCents: item.product.priceCents,
          quantity: item.quantity,
        })),
        promotionId,
      );
      const pricingByProductId = new Map(
        checkoutPricing.lines.map((linePricing) => [linePricing.productId, linePricing]),
      );
      const amendedItems = normalizedItems.map((item) => {
        const linePricing = pricingByProductId.get(item.product.id);
        if (!linePricing) {
          throw new OrderAmendmentError("Order pricing failed. Please try again.", 500);
        }

        const commission = calculateLineCommissionFromTotal({
          sizeMl: item.product.sizeMl,
          totalPriceCents: linePricing.totalPriceCents,
        });

        return {
          ...item,
          totalPriceCents: linePricing.totalPriceCents,
          effectiveUnitPriceCents: linePricing.effectiveUnitPriceCents,
          commission,
        };
      });

      const subtotalCents = amendedItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
      const taxCents = Math.round(subtotalCents * SALES_TAX_RATE);
      const totalCents = subtotalCents + taxCents;
      const commissionCents = amendedItems.reduce(
        (sum, item) => sum + item.commission.commissionCents,
        0,
      );
      const customerId = await resolveAmendedCustomer(tx, order.customerId, body.customer);
      const quantityDeltas = new Map<string, number>();
      const allTouchedProductIds = new Set([
        ...existingQuantitiesByProductId.keys(),
        ...requestedQuantitiesByProductId.keys(),
      ]);

      allTouchedProductIds.forEach((productId) => {
        const nextQuantity = requestedQuantitiesByProductId.get(productId) ?? 0;
        const previousQuantity = existingQuantitiesByProductId.get(productId) ?? 0;
        const delta = nextQuantity - previousQuantity;
        if (delta !== 0) {
          quantityDeltas.set(productId, delta);
        }
      });

      await Promise.all(
        [...quantityDeltas.entries()].map(([productId, delta]) =>
          tx.product.update({
            where: { id: productId },
            data:
              delta > 0
                ? {
                    stock: {
                      decrement: delta,
                    },
                  }
                : {
                    stock: {
                      increment: Math.abs(delta),
                    },
                  },
          }),
        ),
      );

      await tx.orderItem.deleteMany({
        where: { orderId: order.id },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotalCents,
          taxCents,
          totalCents,
          commissionCents,
          notes: nullableText(body.notes),
          customerId,
          items: {
            create: amendedItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPriceCents: item.effectiveUnitPriceCents,
              totalPriceCents: item.totalPriceCents,
              commissionRateBps: item.commission.commissionRateBps,
              commissionCents: item.commission.commissionCents,
            })),
          },
        },
      });

      await Promise.all(
        [...quantityDeltas.entries()].map(([productId, delta]) =>
          tx.inventoryMovement.create({
            data: {
              orderId: order.id,
              productId,
              type: InventoryMovementType.ADJUSTMENT,
              quantityDelta: -delta,
              note: `Order amendment ${order.orderNumber} by ${
                session?.name ?? "Manager"
              } on ${formatFullDateTime(new Date())}: ${reason}`,
            },
          }),
        ),
      );

      return {
        orderNumber: updatedOrder.orderNumber,
        totalCents: updatedOrder.totalCents,
      };
    });

    revalidateOrderAmendmentPaths();

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.orderNumber} was amended successfully.`,
    });
  } catch (error) {
    console.error("[orders:amend]", error);

    if (error instanceof OrderAmendmentError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "That social handle or phone number is already attached to another customer." },
        { status: 409 },
      );
    }

    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return NextResponse.json({ message: databaseIssue }, { status: 503 });
    }

    return NextResponse.json(
      { message: "Order amendment failed. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const session = await getManagerSession();
    const body = (await request.json().catch(() => null)) as OrderVoidPayload | null;
    const reason = normalizeText(body?.reason);

    if (reason.length < 3) {
      throw new OrderAmendmentError("Add a short void reason before saving.", 400);
    }

    const inventoryAction = parseVoidInventoryAction(body?.inventoryAction);
    const prisma = requirePrisma();
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          inventoryMovements: true,
        },
      });

      if (!order) {
        throw new OrderAmendmentError("That order could not be found anymore.", 404);
      }

      if (order.status === OrderStatus.VOIDED) {
        throw new OrderAmendmentError("That order is already voided.", 400);
      }

      const voidedAt = new Date();
      const voidedByName = session?.name ?? "Manager";
      const itemQuantitiesByProductId = new Map<string, { name: string; quantity: number }>();

      order.items.forEach((item) => {
        const current = itemQuantitiesByProductId.get(item.productId);
        itemQuantitiesByProductId.set(item.productId, {
          name: item.product.name,
          quantity: (current?.quantity ?? 0) + item.quantity,
        });
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.VOIDED,
          subtotalCents: 0,
          taxCents: 0,
          totalCents: 0,
          commissionCents: 0,
          voidedAt,
          voidReason: reason,
          voidedByName,
          voidInventoryAction: inventoryAction,
        },
      });

      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: {
          unitPriceCents: 0,
          totalPriceCents: 0,
          commissionRateBps: 0,
          commissionCents: 0,
        },
      });

      if (order.inventoryMovements.length > 0) {
        await tx.inventoryMovement.updateMany({
          where: {
            orderId: order.id,
            type: InventoryMovementType.SALE,
          },
          data: {
            type: InventoryMovementType.ADJUSTMENT,
            note:
              inventoryAction === OrderVoidInventoryAction.KEPT_AS_TESTER
                ? `Tester stock output from voided order ${order.orderNumber} by ${voidedByName}: ${reason}`
                : `Voided order ${order.orderNumber} by ${voidedByName}; original sale movement reversed: ${reason}`,
          },
        });
      }

      if (inventoryAction === OrderVoidInventoryAction.RESTOCKED) {
        await Promise.all(
          [...itemQuantitiesByProductId.entries()].map(([productId, item]) =>
            tx.product.update({
              where: { id: productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            }),
          ),
        );

        await Promise.all(
          [...itemQuantitiesByProductId.entries()].map(([productId, item]) =>
            tx.inventoryMovement.create({
              data: {
                orderId: order.id,
                productId,
                type: InventoryMovementType.ADJUSTMENT,
                quantityDelta: item.quantity,
                note: `Restocked from voided order ${order.orderNumber} by ${voidedByName}: ${reason}`,
              },
            }),
          ),
        );
      }

      return {
        orderNumber: order.orderNumber,
        inventoryAction,
      };
    });

    revalidateOrderAmendmentPaths();

    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.inventoryAction === OrderVoidInventoryAction.KEPT_AS_TESTER
          ? `${result.orderNumber} was voided and kept as tester stock output.`
          : `${result.orderNumber} was voided and stock was restored.`,
    });
  } catch (error) {
    console.error("[orders:void]", error);

    if (error instanceof OrderAmendmentError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return NextResponse.json({ message: databaseIssue }, { status: 503 });
    }

    return NextResponse.json(
      { message: "Order void failed. Please try again." },
      { status: 500 },
    );
  }
}
