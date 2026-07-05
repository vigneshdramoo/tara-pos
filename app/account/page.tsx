import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageIntro } from "@/components/page-intro";
import { PayoutReportWorkspace } from "@/components/payroll/payout-report-workspace";
import { ShiftClockPanel } from "@/components/payroll/shift-clock-panel";
import { CommissionProgress } from "@/components/staff/commission-progress";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { Surface } from "@/components/ui/surface";
import { formatFullDateTime } from "@/lib/format";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { getPayoutsData, getStaffCommissionProgress, getStaffShiftClockData } from "@/lib/queries";
import { canManageStaff, getRoleLabel } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    redirect("/login");
  }

  const [commissionProgress, shiftClockData] = await Promise.all([
    getStaffCommissionProgress(session.staffId),
    getStaffShiftClockData(session.staffId),
  ]);
  const isManager = canManageStaff(session.role);
  const payoutsData = isManager ? null : await getPayoutsData(session);
  const pageTitle = isManager ? "Manager account settings" : "My shift";
  const pageDescription = isManager
    ? "Your password, shift clock, and payout pace — with staff oversight one tap away."
    : "Clock your shift, track targets, check payouts, and manage your password.";

  return (
    <>
      <PageIntro
        eyebrow="Staff account"
        title={pageTitle}
        description={pageDescription}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Pill tone="accent">{getRoleLabel(session.role)}</Pill>
            {commissionProgress?.seniorOverride ? (
              <Pill>{commissionProgress.seniorOverride.title}</Pill>
            ) : null}
            {isManager ? (
              <Link
                href="/staff"
                className="tara-button-secondary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 text-sm font-medium transition"
              >
                Staff credentials
              </Link>
            ) : null}
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="tara-button-secondary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 text-sm font-medium transition"
              >
                Sign out
              </button>
            </form>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-4">
          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                Signed-in identity
              </p>
              <h3 className="mt-2 font-display text-4xl text-foreground">{session.name}</h3>
              <p className="mt-2 text-base text-[var(--muted)]">
                @{session.username}
                {session.email ? ` · ${session.email}` : ""}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[var(--line)] bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">Role</p>
                <p className="mt-2 text-lg font-semibold text-[var(--brand-midnight)]">
                  {getRoleLabel(session.role)}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--line)] bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                  Session expires
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--brand-midnight)]">
                  {formatFullDateTime(new Date(session.expiresAt))}
                </p>
              </div>
            </div>

            <div className="tara-alert-warning rounded-[24px] px-5 py-4 text-sm leading-7">
              Password hygiene matters on shared boutique devices. Rotate your own password
              regularly and avoid handing credentials between staff.{" "}
              {isManager ? (
                <>
                  Use the{" "}
                  <Link
                    href="/staff"
                    className="font-semibold text-[var(--brand-onyx)] underline underline-offset-4"
                  >
                    Staff
                  </Link>{" "}
                  directory to review who still needs onboarding support.
                </>
              ) : (
                "If you inherit a newly bootstrapped account, update it before your next shift handoff."
              )}
            </div>
          </Surface>

          {commissionProgress ? (
            <Surface>
              {shiftClockData.shiftSummary ? (
                <div className="mb-4">
                  <ShiftClockPanel summary={shiftClockData.shiftSummary} />
                </div>
              ) : null}
              <CommissionProgress progress={commissionProgress} title="Your target progress" />
            </Surface>
          ) : null}
        </div>

        <ChangePasswordForm />
      </section>

      {payoutsData ? (
        <>
          {payoutsData.databaseIssue ? <StatusNotice message={payoutsData.databaseIssue} /> : null}
          <PayoutReportWorkspace data={payoutsData} />
        </>
      ) : null}
    </>
  );
}
