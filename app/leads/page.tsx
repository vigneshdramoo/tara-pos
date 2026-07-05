import { BoothLeadsWorkspace } from "@/components/leads/booth-leads-workspace";
import { PageIntro } from "@/components/page-intro";
import { StatusNotice } from "@/components/ui/status-notice";
import { getQuizLeadsData } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function LeadsPage() {
  const data = await getQuizLeadsData();

  return (
    <>
      <PageIntro
        eyebrow="Booth CRM"
        title="Quiz leads and visitor signals"
        description="Quiz leads with scent result, consent, and purchase intent."
      />
      {data.databaseIssue ? <StatusNotice message={data.databaseIssue} /> : null}
      <BoothLeadsWorkspace leads={data.leads} />
    </>
  );
}
