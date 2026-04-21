"use client";

import type { ReactNode } from "react";
import { Cloud, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { getRoleLabel, type StaffSession } from "@/lib/staff";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AppShellProps = {
  children: ReactNode;
  session: StaffSession | null;
};

export function AppShell({ children, session }: AppShellProps) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const isFragranceQuizRoute = pathname.startsWith("/find-your-light");
  const roleLabel = session ? getRoleLabel(session.role) : "Local preview";
  const sessionSubtitle = session
    ? `${roleLabel} · @${session.username}`
    : "Auth-free preview while staff sign-in is disabled";

  if (isLoginRoute || isFragranceQuizRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1720px] gap-6 px-4 pb-6 pt-4 lg:px-6">
        <aside className="hidden lg:flex lg:w-[280px] lg:flex-col">
          <div className="tara-surface sticky top-4 flex min-h-[calc(100vh-2rem)] flex-col p-6">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.38em] text-[var(--brand-gold)]">TARA</p>
              <h1 className="mt-3 font-display text-5xl leading-none text-foreground">
                Atelier POS
              </h1>
              <p className="mt-3 max-w-[18rem] text-sm leading-6 text-[var(--muted)]">
                A quiet, premium selling floor built for touch-first retail moments.
              </p>
            </div>

            <SidebarNav role={session?.role ?? null} />

            <div className="tara-panel-dark mt-auto rounded-[24px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
                    {roleLabel}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {session?.name ?? "TARA preview mode"}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(247,243,235,0.72)]">{sessionSubtitle}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold">
                  {session ? (
                    <span>{getInitials(session.name)}</span>
                  ) : (
                    <Cloud className="h-5 w-5" strokeWidth={1.8} />
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[rgba(247,243,235,0.76)]">
                {session
                  ? "Hosted Postgres, role-aware access, and touch-friendly workflows keep the boutique floor fast and private on every device."
                  : "When staff auth is enabled, this panel will show the signed-in user, their role, and access tier."}
              </p>
              {session ? (
                <form action="/api/auth/logout" method="post" className="mt-4">
                  <button
                    type="submit"
                    className="tara-button-inverse touch-target inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.8} />
                    Sign out
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="min-w-0 flex-1">
              <SidebarNav mobile role={session?.role ?? null} />
            </div>
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="tara-button-secondary touch-target inline-flex items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                  Exit
                </button>
              </form>
            ) : null}
          </div>
          <div className="tara-surface flex items-center justify-between rounded-[24px] px-4 py-3 lg:hidden">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                {roleLabel}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {session?.name ?? "Unsigned preview"}
              </p>
            </div>
            <p className="truncate text-right text-xs text-[var(--muted)]">{sessionSubtitle}</p>
          </div>
          <main className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
