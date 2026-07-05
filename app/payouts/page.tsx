import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { PayoutReportWorkspace } from "@/components/payroll/payout-report-workspace";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { canManageStaff } from "@/lib/staff";
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

  if (!canManageStaff(session.role)) {
    redirect("/account");
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
        title="Payout control"
        description="Crew hours, commissions, bonuses, and payout status."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Pill tone="accent">{formatCurrency(pendingTotalCents)} pending</Pill>
            <Pill>Manager oversight</Pill>
          </div>
        }
      />

      {payoutsData.databaseIssue ? <StatusNotice message={payoutsData.databaseIssue} /> : null}

      <PayoutReportWorkspace data={payoutsData} />
    </>
  );
}
