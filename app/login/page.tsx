import type { Metadata, Route } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { isAuthConfigured, sanitizeNextPath } from "@/lib/auth";
import {
  getAppEnvironmentLabel,
  getStagingDemoCredentials,
  isStagingDemoEnabled,
} from "@/lib/deployment";

export const metadata: Metadata = {
  title: "Staff Sign-In",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authConfigured = isAuthConfigured();
  const nextPath = sanitizeNextPath((await searchParams).next) as Route;
  const environmentLabel = getAppEnvironmentLabel();
  const stagingDemoEnabled = isStagingDemoEnabled();
  const demoCredentials = getStagingDemoCredentials();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(202,158,91,0.22),_transparent_38%),radial-gradient(circle_at_100%_0%,_rgba(75,48,106,0.18),_transparent_28%),linear-gradient(180deg,_#fbf7f0_0%,_#f7f3eb_48%,_#efe7da_100%)]" />
      <div className="absolute inset-x-0 top-0 h-60 bg-[linear-gradient(180deg,rgba(26,51,74,0.10),transparent)]" />

      <section className="relative z-10 grid w-full max-w-5xl gap-8 rounded-[36px] border border-[rgba(202,158,91,0.18)] bg-[rgba(255,251,246,0.62)] p-6 shadow-[0_40px_120px_rgba(18,22,34,0.12)] backdrop-blur md:grid-cols-[minmax(0,1.2fr)_420px] md:p-8">
        <div className="tara-panel-dark flex flex-col justify-between rounded-[30px] px-6 py-8 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.42em] text-[rgba(202,158,91,0.94)]">TARA</p>
            <h1 className="mt-4 font-display text-5xl leading-none md:text-6xl">Atelier POS</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[rgba(247,243,235,0.78)] md:text-lg">
              A premium retail command center for fragrance sales, customer capture, live stock
              movement, and daily boutique reporting.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(202,158,91,0.84)]">Reach</p>
              <p className="mt-2 text-xl font-semibold">Anywhere</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(247,243,235,0.72)]">
                Open the POS securely from boutique iPads and remote devices.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(202,158,91,0.84)]">Inventory</p>
              <p className="mt-2 text-xl font-semibold">Live</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(247,243,235,0.72)]">
                Stock updates and order history stay in sync in the hosted database.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(202,158,91,0.84)]">Protection</p>
              <p className="mt-2 text-xl font-semibold">Staff-only</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(247,243,235,0.72)]">
                Role-aware staff access keeps the public site from exposing the till.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--brand-gold)]">Private Entry</p>
              {environmentLabel ? (
                <span className="rounded-full border border-[rgba(202,158,91,0.24)] bg-[rgba(202,158,91,0.10)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-midnight)]">
                  {environmentLabel}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 font-display text-4xl text-foreground">Enter the selling floor</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-[var(--muted)]">
              Use a staff username or email with the account password to unlock the boutique
              dashboard, POS, clienteling, and AI sales brief.
            </p>
            <div className="mt-6">
              <LoginForm authConfigured={authConfigured} nextPath={nextPath} />
            </div>
            {stagingDemoEnabled && demoCredentials.length ? (
              <div className="mt-4 rounded-[28px] border border-[rgba(202,158,91,0.18)] bg-[rgba(255,251,246,0.72)] p-5 shadow-[0_20px_60px_rgba(18,22,34,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                      Demo Credentials
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">
                      Staging access for reviews and walkthroughs
                    </h3>
                  </div>
                  <span className="rounded-full border border-[rgba(202,158,91,0.2)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                    Staging only
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {demoCredentials.map((credential) => (
                    <div
                      key={credential.username}
                      className="rounded-[20px] border border-[var(--line)] bg-white/80 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{credential.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--brand-gold)]">
                            {credential.role.replaceAll("_", " ")}
                          </p>
                        </div>
                        <div className="text-right text-sm text-[var(--muted-strong)]">
                          <p>
                            Username: <span className="font-semibold text-foreground">{credential.username}</span>
                          </p>
                          <p className="mt-1">
                            Password: <span className="font-semibold text-foreground">{credential.password}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
