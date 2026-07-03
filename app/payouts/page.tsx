import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { PayoutReportWorkspace } from "@/components/payroll/payout-report-workspace";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getPayoutsData } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function PayoutsPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    redirect("/login");
  }

  const payoutsData = await getPayoutsData(session);
  const pendingTotalCents = payoutsData.reports.reduce(
    (staffSum, report) =>
      staffSum +
      report.days.reduce(
        (daySum, day) => daySum + (day.status === "PENDING" ? day.totalPayoutCents : 0),
        0,
      ),
    0,
  );

  return (
    <>
      <PageIntro
        eyebrow="Crew payout"
        title={payoutsData.canManageAll ? "Payout control" : "My payout history"}
        description={
          payoutsData.canManageAll
            ? "Review Syazwana and Rielyna's clocked hours, daily commissions, target bonuses, senior override, and payout fulfilment status."
            : "Check your last 7 payout days, clocked hours, commission, target bonus, and fulfilment status."
        }
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Pill tone="accent">{formatCurrency(pendingTotalCents)} pending</Pill>
            <Pill>{payoutsData.canManageAll ? "Daniel oversight" : "Crew view"}</Pill>
          </div>
        }
      />

      {payoutsData.databaseIssue ? <StatusNotice message={payoutsData.databaseIssue} /> : null}

      <PayoutReportWorkspace data={payoutsData} />
    </>
  );
}
