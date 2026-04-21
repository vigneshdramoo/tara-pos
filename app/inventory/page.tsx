import { InventoryAdminWorkspace } from "@/components/inventory/inventory-admin-workspace";
import { PageIntro } from "@/components/page-intro";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { getInventoryAdminData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventory = await getInventoryAdminData();
  const activeProducts = inventory.products.filter((product) => product.active).length;
  const lowStockProducts = inventory.products.filter(
    (product) => product.active && product.stock <= product.reorderLevel,
  ).length;

  return (
    <>
      <PageIntro
        eyebrow="Inventory admin"
        title="Catalog control room"
        description="Create and refine fragrance products, restock the floor, and record manual stock corrections without leaving the POS workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">{activeProducts} live products</Pill>
            <Pill>{lowStockProducts} low-stock alerts</Pill>
          </div>
        }
      />

      {inventory.databaseIssue ? <StatusNotice message={inventory.databaseIssue} /> : null}

      <InventoryAdminWorkspace
        products={inventory.products}
        recentMovements={inventory.recentMovements}
      />
    </>
  );
}
