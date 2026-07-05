import { PageIntro } from "@/components/page-intro";
import { PosWorkspace } from "@/components/pos/pos-workspace";
import { StatusNotice } from "@/components/ui/status-notice";
import { getPosData } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function PosPage() {
  const data = await getPosData();

  return (
    <>
      <PageIntro
        eyebrow="Selling floor"
        title="Product catalog and checkout"
        description="Browse the collection, build the cart, and check out."
      />
      {data.databaseIssue ? <StatusNotice message={data.databaseIssue} /> : null}
      <PosWorkspace products={data.products} recentCustomers={data.recentCustomers} />
    </>
  );
}
