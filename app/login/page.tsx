import type { Metadata, Route } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { isAuthConfigured, sanitizeNextPath } from "@/lib/auth";

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
                Password-gated access keeps the public site from exposing the till.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--brand-gold)]">Private Entry</p>
            <h2 className="mt-3 font-display text-4xl text-foreground">Enter the selling floor</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-[var(--muted)]">
              Use the staff password to unlock the boutique dashboard, POS, clienteling, and AI
              sales brief.
            </p>
            <div className="mt-6">
              <LoginForm authConfigured={authConfigured} nextPath={nextPath} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
