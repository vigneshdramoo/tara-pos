import { InventoryMovementType, PrismaClient } from "@prisma/client";
import { catalogProductSeeds } from "./catalog-seeds";

const prisma = new PrismaClient();

async function main() {
  const summary = await prisma.$transaction(async (tx) => {
    const activeCatalogSlugs = catalogProductSeeds.map((seed) => seed.slug);
    const retiredProducts = await tx.product.findMany({
      where: {
        slug: {
          notIn: activeCatalogSlugs,
        },
      },
    });

    let retiredCount = 0;
    let retiredUnits = 0;

    for (const product of retiredProducts) {
      const stockToClear = product.stock;
      const requiresUpdate = product.active || stockToClear !== 0;

      if (!requiresUpdate) {
        continue;
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          active: false,
          stock: 0,
        },
      });

      if (stockToClear !== 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: InventoryMovementType.ADJUSTMENT,
            quantityDelta: -stockToClear,
            note: "Removed from the active TARA catalog",
          },
        });
      }

      retiredCount += 1;
      retiredUnits += stockToClear;
    }

    let createdCount = 0;
    let updatedCount = 0;
    let adjustedCount = 0;

    for (const seed of catalogProductSeeds) {
      const existing = await tx.product.findUnique({
        where: { slug: seed.slug },
      });

      const previousStock = existing?.stock ?? 0;
      const stockDelta = seed.stock - previousStock;

      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: {
            sku: seed.sku,
            name: seed.name,
            collection: seed.collection,
            description: seed.description,
            notes: seed.notes,
            mood: seed.mood,
            sizeMl: seed.sizeMl,
            priceCents: seed.priceCents,
            stock: seed.stock,
            reorderLevel: seed.reorderLevel,
            accentHex: seed.accentHex,
            active: true,
          },
        });

        updatedCount += 1;
      } else {
        const created = await tx.product.create({
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
            stock: seed.stock,
            reorderLevel: seed.reorderLevel,
            accentHex: seed.accentHex,
            active: true,
          },
        });

        if (seed.stock > 0) {
          await tx.inventoryMovement.create({
            data: {
              productId: created.id,
              type: InventoryMovementType.RESTOCK,
              quantityDelta: seed.stock,
              note: "Initial stock from TARA catalog sync",
            },
          });
        }

        createdCount += 1;
      }

      if (existing && stockDelta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: existing.id,
            type:
              stockDelta > 0 ? InventoryMovementType.RESTOCK : InventoryMovementType.ADJUSTMENT,
            quantityDelta: stockDelta,
            note: "Stock reset during TARA catalog sync",
          },
        });

        adjustedCount += 1;
      }
    }

    return {
      retiredCount,
      retiredUnits,
      createdCount,
      updatedCount,
      adjustedCount,
    };
  });

  console.log(
    `Catalog synced: ${summary.createdCount} created, ${summary.updatedCount} updated, ${summary.retiredCount} non-catalog products retired, ${summary.adjustedCount} stock resets applied, ${summary.retiredUnits} legacy units cleared.`,
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
