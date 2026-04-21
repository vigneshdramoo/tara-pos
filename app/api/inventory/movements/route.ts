import { InventoryMovementType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  InventoryAdminError,
  describeInventoryAdminIssue,
  optionalText,
  parsePositiveInteger,
  parseSignedInteger,
  revalidateInventoryPaths,
} from "@/lib/inventory-admin";
import { requirePrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          productId?: string;
          action?: "RESTOCK" | "ADJUSTMENT";
          quantity?: number | string;
          note?: string;
        }
      | null;

    const productId = body?.productId?.trim();
    if (!productId) {
      throw new InventoryAdminError("Choose a product before saving a stock action.", 400);
    }

    if (body?.action !== "RESTOCK" && body?.action !== "ADJUSTMENT") {
      throw new InventoryAdminError("Choose either a restock or manual adjustment action.", 400);
    }

    const quantityDelta =
      body.action === "RESTOCK"
        ? parsePositiveInteger(body?.quantity, "Restock quantity")
        : parseSignedInteger(body?.quantity, "Adjustment quantity");

    const note = optionalText(body?.note);
    const prisma = requirePrisma();

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new InventoryAdminError("That product could not be found anymore.", 404);
      }

      const nextStock = product.stock + quantityDelta;
      if (nextStock < 0) {
        throw new InventoryAdminError(
          `${product.name} would fall below zero stock with that adjustment.`,
          400,
        );
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: {
            increment: quantityDelta,
          },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type:
            body.action === "RESTOCK"
              ? InventoryMovementType.RESTOCK
              : InventoryMovementType.ADJUSTMENT,
          quantityDelta,
          note:
            note ??
            (body.action === "RESTOCK"
              ? "Inventory restock"
              : "Manual inventory adjustment"),
        },
      });

      return {
        productName: product.name,
        stock: nextStock,
      };
    });

    revalidateInventoryPaths();

    return NextResponse.json({
      success: true,
      stock: result.stock,
      message:
        body.action === "RESTOCK"
          ? `${result.productName} restocked successfully.`
          : `${result.productName} stock adjusted successfully.`,
    });
  } catch (error) {
    console.error("[inventory:movement]", error);

    const issue = describeInventoryAdminIssue(error);
    if (issue) {
      return NextResponse.json({ message: issue.message }, { status: issue.status });
    }

    return NextResponse.json(
      { message: "Inventory update failed. Please try again." },
      { status: 500 },
    );
  }
}
