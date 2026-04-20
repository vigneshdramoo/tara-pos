import {
  InventoryMovementType,
  PaymentMethod,
  Prisma,
  type Customer,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { SALES_TAX_RATE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
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
    const body = (await request.json()) as CheckoutPayload;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new CheckoutError("Add at least one product before checkout.", 400);
    }

    if (!Object.values(PaymentMethod).includes(body.paymentMethod)) {
      throw new CheckoutError("Choose a valid payment method.", 400);
    }

    const uniqueProductIds = [...new Set(body.items.map((item) => item.productId))];
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
    const normalizedItems = body.items.map((item) => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new CheckoutError("Each cart line needs a quantity of at least 1.", 400);
      }

      const product = productMap.get(item.productId);
      if (!product) {
        throw new CheckoutError("Cart contains an unknown product.", 400);
      }

      if (item.quantity > product.stock) {
        throw new CheckoutError(
          `${product.name} only has ${product.stock} units left in stock.`,
          400,
        );
      }

      return {
        product,
        quantity: item.quantity,
        totalPriceCents: product.priceCents * item.quantity,
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const customer = await resolveCustomer(tx, body.customer);
      const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
      const taxCents = Math.round(subtotalCents * SALES_TAX_RATE);
      const totalCents = subtotalCents + taxCents;
      const orderNumber = generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          subtotalCents,
          taxCents,
          totalCents,
          paymentMethod: body.paymentMethod,
          notes: normalizeValue(body.notes),
          customerId: customer?.id,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPriceCents: item.product.priceCents,
              totalPriceCents: item.totalPriceCents,
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

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof CheckoutError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Checkout failed. Please try again." },
      { status: 500 },
    );
  }
}
