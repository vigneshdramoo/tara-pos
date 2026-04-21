import { InventoryMovementType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  describeInventoryAdminIssue,
  normalizeAccentHex,
  optionalText,
  parseNonNegativeInteger,
  parsePositiveInteger,
  parsePriceToCents,
  requireText,
  revalidateInventoryPaths,
  slugifyProductName,
} from "@/lib/inventory-admin";
import { requirePrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          name?: string;
          slug?: string;
          sku?: string;
          collection?: string;
          description?: string;
          notes?: string;
          mood?: string;
          sizeMl?: number | string;
          price?: number | string;
          reorderLevel?: number | string;
          accentHex?: string;
          active?: boolean;
          initialStock?: number | string;
        }
      | null;

    const name = requireText(body?.name, "Product name");
    const slug = optionalText(body?.slug) || slugifyProductName(name);
    const sku = requireText(body?.sku, "SKU").toUpperCase();
    const collection = requireText(body?.collection, "Collection");
    const description = requireText(body?.description, "Description");
    const notes = requireText(body?.notes, "Notes");
    const mood = requireText(body?.mood, "Mood");
    const sizeMl = parsePositiveInteger(body?.sizeMl, "Bottle size");
    const priceCents = parsePriceToCents(body?.price);
    const reorderLevel = parseNonNegativeInteger(body?.reorderLevel, "Reorder level");
    const accentHex = normalizeAccentHex(body?.accentHex);
    const active = body?.active ?? true;
    const initialStock = parseNonNegativeInteger(body?.initialStock ?? 0, "Opening stock");

    if (!slug) {
      return NextResponse.json(
        { message: "Provide a product name that can generate a valid slug." },
        { status: 400 },
      );
    }

    const prisma = requirePrisma();
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          slug,
          sku,
          collection,
          description,
          notes,
          mood,
          sizeMl,
          priceCents,
          reorderLevel,
          accentHex,
          active,
          stock: initialStock,
        },
      });

      if (initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: created.id,
            type: InventoryMovementType.RESTOCK,
            quantityDelta: initialStock,
            note: "Opening stock on product creation",
          },
        });
      }

      return created;
    });

    revalidateInventoryPaths();

    return NextResponse.json({
      success: true,
      productId: product.id,
      message: `${product.name} was added to the inventory catalog.`,
    });
  } catch (error) {
    console.error("[inventory:create-product]", error);

    const issue = describeInventoryAdminIssue(error);
    if (issue) {
      return NextResponse.json({ message: issue.message }, { status: issue.status });
    }

    return NextResponse.json(
      { message: "Product creation failed. Please try again." },
      { status: 500 },
    );
  }
}
