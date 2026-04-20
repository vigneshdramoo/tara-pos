import { PageIntro } from "@/components/page-intro";
import { PosWorkspace } from "@/components/pos/pos-workspace";
import { getPosData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const data = await getPosData();

  return (
    <>
      <PageIntro
        eyebrow="Selling floor"
        title="Product catalog and checkout"
        description="Browse the fragrance collection, keep the cart flowing with big touch targets, and capture customer details at the moment of purchase."
      />
      <PosWorkspace products={data.products} recentCustomers={data.recentCustomers} />
    </>
  );
}
