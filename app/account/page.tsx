import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageIntro } from "@/components/page-intro";
import { CommissionProgress } from "@/components/staff/commission-progress";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatFullDateTime } from "@/lib/format";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { getStaffCommissionProgress } from "@/lib/queries";
import { getRoleLabel } from "@/lib/staff";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    redirect("/login");
  }

  const commissionProgress = await getStaffCommissionProgress(session.staffId);

  return (
    <>
      <PageIntro
        eyebrow="Staff account"
        title="Personal access control"
        description="Manage the password tied to your own TARA staff account without waiting on an admin, while keeping the boutique floor protected."
        actions={<Pill tone="accent">{getRoleLabel(session.role)}</Pill>}
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
              Boutique default password:{" "}
              <span className="font-semibold text-[var(--brand-onyx)]">TARA2026</span>. Change it
              after first sign-in so each staff member has a private credential.
            </div>
          </Surface>

          {commissionProgress ? (
            <Surface>
              <CommissionProgress progress={commissionProgress} title="Your target progress" />
            </Surface>
          ) : null}
        </div>

        <ChangePasswordForm />
      </section>
    </>
  );
}
