import { ShieldCheck, Sparkles } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { StatusNotice } from "@/components/ui/status-notice";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatFullDateTime } from "@/lib/format";
import { getStaffUsersData } from "@/lib/queries";
import { getRoleCapabilities, getRoleLabel, STAFF_ROLES } from "@/lib/staff";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staffData = await getStaffUsersData();
  const activeStaffCount = staffData.staffUsers.filter((staffUser) => staffUser.active).length;
  const managerCount = staffData.staffUsers.filter((staffUser) => staffUser.role === "MANAGER").length;
  const managerAccountLabel = `${managerCount} manager account${managerCount === 1 ? "" : "s"}`;

  return (
    <>
      <PageIntro
        eyebrow="Staff access"
        title="Boutique team control"
        description="Review the live TARA staff roster, confirm which roles can reach sensitive areas, and keep boutique access aligned with responsibilities on the floor."
        actions={
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">{activeStaffCount} active staff</Pill>
            <Pill>{managerAccountLabel}</Pill>
          </div>
        }
      />

      {staffData.databaseIssue ? <StatusNotice message={staffData.databaseIssue} /> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <Surface className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                Staff directory
              </p>
              <h3 className="mt-2 font-display text-3xl text-foreground">Access roster</h3>
            </div>
            <div className="tara-chip-default rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              {staffData.staffUsers.length} accounts
            </div>
          </div>

          <div className="grid gap-4">
            {staffData.staffUsers.map((staffUser) => (
              <article
                key={staffUser.id}
                className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5 shadow-[0_20px_60px_rgba(18,22,34,0.05)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-[var(--brand-gold)]">
                      @{staffUser.username}
                    </p>
                    <h4 className="mt-2 text-2xl font-semibold text-[var(--brand-midnight)]">
                      {staffUser.name}
                    </h4>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {staffUser.email ?? "No email on file"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="accent">{getRoleLabel(staffUser.role)}</Pill>
                    <Pill tone={staffUser.active ? "default" : "danger"}>
                      {staffUser.active ? "Active" : "Inactive"}
                    </Pill>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                      Role
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {getRoleLabel(staffUser.role)}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                      Last login
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {staffUser.lastLoginAt
                        ? formatFullDateTime(staffUser.lastLoginAt)
                        : "Not signed in yet"}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                      Added
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatFullDateTime(staffUser.createdAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {!staffData.staffUsers.length ? (
              <div className="tara-alert-warning rounded-[24px] px-5 py-4 text-sm">
                No staff accounts are available yet. Seed the database to create the initial
                manager, sales manager, and cashier accounts.
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                Role matrix
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-[var(--brand-midnight)]">
                What each role can reach
              </h3>
            </div>
          </div>

          <div className="grid gap-4">
            {STAFF_ROLES.map((role) => (
              <article
                key={role}
                className="rounded-[26px] border border-[var(--line)] bg-white/72 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-foreground">{getRoleLabel(role)}</h4>
                  <Pill tone={role === "MANAGER" ? "accent" : "default"}>
                    {role === "MANAGER"
                      ? "Highest access"
                      : role === "SALES_MANAGER"
                        ? "Sales leadership"
                        : "Checkout lane"}
                  </Pill>
                </div>

                <ul className="mt-4 grid gap-3">
                  {getRoleCapabilities(role).map((capability) => (
                    <li
                      key={capability}
                      className="flex items-start gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted-strong)]"
                    >
                      <Sparkles
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-amber)]"
                        strokeWidth={1.8}
                      />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Surface>
      </section>
    </>
  );
}
