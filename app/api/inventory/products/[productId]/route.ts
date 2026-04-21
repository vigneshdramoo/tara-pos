import { NextResponse } from "next/server";
import {
  describeInventoryAdminIssue,
  normalizeAccentHex,
  parseNonNegativeInteger,
  parsePositiveInteger,
  parsePriceToCents,
  requireText,
  slugifyProductName,
  revalidateInventoryPaths,
} from "@/lib/inventory-admin";
import { requirePrisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
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
        }
      | null;

    const name = requireText(body?.name, "Product name");
    const slug = (body?.slug?.trim() || slugifyProductName(name)).toLowerCase();
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

    const prisma = requirePrisma();
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
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
      },
    });

    revalidateInventoryPaths();

    return NextResponse.json({
      success: true,
      productId: product.id,
      message: `${product.name} was updated.`,
    });
  } catch (error) {
    console.error("[inventory:update-product]", error);

    const issue = describeInventoryAdminIssue(error);
    if (issue) {
      return NextResponse.json({ message: issue.message }, { status: issue.status });
    }

    return NextResponse.json(
      { message: "Product update failed. Please try again." },
      { status: 500 },
    );
  }
}
