import {
  InventoryMovementType,
  PaymentMethod,
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
  getCheckoutPromotionOption,
  isCheckoutPromotionId,
  type CheckoutPromotionId,
} from "@/lib/checkout-pricing";
import { calculateLineCommissionFromTotal } from "@/lib/commissions";
import { SALES_TAX_RATE } from "@/lib/constants";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";
import type { CheckoutPayload } from "@/lib/types";

class CheckoutError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function generateOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const suffix = Math.floor(Math.random() * 90 + 10);

  return `TARA-${stamp}-${suffix}`;
}

function normalizeValue(value?: string) {
  return value?.trim() || undefined;
}

function buildPromotionOrderNote(
  promotionId: CheckoutPromotionId,
  checkoutPricing: ReturnType<typeof calculateCheckoutPricing>,
  rawNotes?: string,
) {
  const normalizedNotes = normalizeValue(rawNotes);
  const noteParts = normalizedNotes ? [normalizedNotes] : [];

  if (promotionId === "NONE") {
    return normalizedNotes;
  }

  const promotion = getCheckoutPromotionOption(promotionId);
  const promotionSummary = [`Promotion: ${promotion.label}`];

  if (promotionId === "EIGHT_ML_BUNDLE" && checkoutPricing.eightMlBundleCount > 0) {
    promotionSummary.push(
      `${checkoutPricing.eightMlBundleCount} x ${promotion.label} applied`,
    );
  }

  if (promotionId === "FOLLOW_TAG_UNLOCK") {
    promotionSummary.push("Booth-only unlock price verified on floor");
  }

  if (promotionId === "SUNWAY_STUDENT") {
    promotionSummary.push(
      `Student offer on ${checkoutPricing.eligibleFiftyMlUnits} x 50mL`,
    );
    promotionSummary.push(
      `Free 8mL claimed ${checkoutPricing.freeGiftClaimedUnits}/${checkoutPricing.freeGiftEligibleUnits}`,
    );

    if (checkoutPricing.freeGiftUnitsRemaining > 0) {
      promotionSummary.push(
        `${checkoutPricing.freeGiftUnitsRemaining} travel gift unit(s) not added to cart`,
      );
    }
  }

  noteParts.push(promotionSummary.join(" · "));

  return noteParts.join("\n\n");
}

async function getCheckoutSession() {
  if (!isProtectionEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    throw new CheckoutError("Sign in again before completing checkout.", 401);
  }

  return session;
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  payload: CheckoutPayload["customer"],
): Promise<Customer | null> {
  if (!payload) return null;

  const name = normalizeValue(payload.name);
  const email = normalizeValue(payload.email);
  const phone = normalizeValue(payload.phone);
  const notes = normalizeValue(payload.notes);

  if (!name && !email && !phone && !notes) {
    return null;
  }

  const existingByPhone = phone ? await tx.customer.findUnique({ where: { phone } }) : null;
  const existingByEmail =
    !existingByPhone && email ? await tx.customer.findUnique({ where: { email } }) : null;
  const existingCustomer = existingByPhone ?? existingByEmail;

  if (existingCustomer) {
    return tx.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name: name ?? existingCustomer.name,
        email: email ?? existingCustomer.email,
        phone: phone ?? existingCustomer.phone,
        notes: notes ?? existingCustomer.notes,
      },
    });
  }

  return tx.customer.create({
    data: {
      name: name ?? "Walk-in guest",
      email,
      phone,
      notes,
    },
  });
}

export async function POST(request: Request) {
  try {
    const prisma = requirePrisma();
    const session = await getCheckoutSession();
    const body = (await request.json()) as CheckoutPayload;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new CheckoutError("Add at least one product before checkout.", 400);
    }

    if (body.paymentMethod !== PaymentMethod.TRANSFER) {
      throw new CheckoutError("DuitNow QR is the only checkout payment method right now.", 400);
    }

    const promotionId = body.promotionId ?? "NONE";
    if (!isCheckoutPromotionId(promotionId)) {
      throw new CheckoutError("Choose a valid promotion before checkout.", 400);
    }

    const requestedQuantitiesByProductId = new Map<string, number>();

    body.items.forEach((item) => {
      if (!item.productId) {
        throw new CheckoutError("Cart contains an unknown product.", 400);
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new CheckoutError("Each cart line needs a quantity of at least 1.", 400);
      }

      requestedQuantitiesByProductId.set(
        item.productId,
        (requestedQuantitiesByProductId.get(item.productId) ?? 0) + item.quantity,
      );
    });

    const uniqueProductIds = [...requestedQuantitiesByProductId.keys()];
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: uniqueProductIds,
        },
        active: true,
      },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new CheckoutError("One or more products are no longer available.", 400);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const requestedItems = uniqueProductIds.map((productId) => {
      const product = productMap.get(productId);
      if (!product) {
        throw new CheckoutError("Cart contains an unknown product.", 400);
      }

      const quantity = requestedQuantitiesByProductId.get(productId) ?? 0;

      if (quantity > product.stock) {
        throw new CheckoutError(
          `${product.name} only has ${product.stock} units left in stock.`,
          400,
        );
      }

      return {
        product,
        quantity,
      };
    });
    const checkoutPricing = calculateCheckoutPricing(
      requestedItems.map((item) => ({
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
    const normalizedItems = requestedItems.map((item) => {
      const linePricing = pricingByProductId.get(item.product.id);
      if (!linePricing) {
        throw new CheckoutError("Checkout pricing failed. Please try again.", 500);
      }

      return {
        ...item,
        totalPriceCents: linePricing.totalPriceCents,
        effectiveUnitPriceCents: linePricing.effectiveUnitPriceCents,
        commission: calculateLineCommissionFromTotal({
          sizeMl: item.product.sizeMl,
          totalPriceCents: linePricing.totalPriceCents,
        }),
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const customer = await resolveCustomer(tx, body.customer);
      const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
      const taxCents = Math.round(subtotalCents * SALES_TAX_RATE);
      const totalCents = subtotalCents + taxCents;
      const commissionCents = normalizedItems.reduce(
        (sum, item) => sum + item.commission.commissionCents,
        0,
      );
      const orderNumber = generateOrderNumber();
      const salesperson = session
        ? await tx.staffUser.findFirst({
            where: {
              id: session.staffId,
              active: true,
            },
            select: {
              id: true,
            },
          })
        : null;

      if (session && !salesperson) {
        throw new CheckoutError("This staff account is unavailable for checkout.", 403);
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          subtotalCents,
          taxCents,
          totalCents,
          commissionCents,
          paymentMethod: PaymentMethod.TRANSFER,
          notes: buildPromotionOrderNote(promotionId, checkoutPricing, body.notes),
          customerId: customer?.id,
          salespersonId: salesperson?.id,
          items: {
            create: normalizedItems.map((item) => ({
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
        normalizedItems.map((item) =>
          tx.product.update({
            where: { id: item.product.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          }),
        ),
      );

      await Promise.all(
        normalizedItems.map((item) =>
          tx.inventoryMovement.create({
            data: {
              orderId: order.id,
              productId: item.product.id,
              type: InventoryMovementType.SALE,
              quantityDelta: -item.quantity,
              note: `Order ${order.orderNumber}`,
            },
          }),
        ),
      );

      return {
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
      };
    });

    revalidatePath("/");
    revalidatePath("/pos");
    revalidatePath("/customers");
    revalidatePath("/orders");
    revalidatePath("/assistant");
    revalidatePath("/account");
    revalidatePath("/staff");

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof CheckoutError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return NextResponse.json({ message: databaseIssue }, { status: 503 });
    }

    return NextResponse.json(
      { message: "Checkout failed. Please try again." },
      { status: 500 },
    );
  }
}
