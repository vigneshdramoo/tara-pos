import { BoothLeadsWorkspace } from "@/components/leads/booth-leads-workspace";
import { PageIntro } from "@/components/page-intro";
import { StatusNotice } from "@/components/ui/status-notice";
import { getQuizLeadsData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const data = await getQuizLeadsData();

  return (
    <>
      <PageIntro
        eyebrow="Booth CRM"
        title="Quiz leads and visitor signals"
        description="Capture popup visitors who take the scent quiz, track their scent result, consent, intent, and demographic signals before they become buyers."
      />
      {data.databaseIssue ? <StatusNotice message={data.databaseIssue} /> : null}
      <BoothLeadsWorkspace leads={data.leads} />
    </>
  );
}
