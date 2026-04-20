"use client";

import type { ReactNode } from "react";
import { Cloud, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";

  if (isLoginRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1720px] gap-6 px-4 pb-6 pt-4 lg:px-6">
        <aside className="hidden lg:flex lg:w-[280px] lg:flex-col">
          <div className="tara-surface sticky top-4 flex min-h-[calc(100vh-2rem)] flex-col p-6">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.38em] text-stone-500">TARA</p>
              <h1 className="mt-3 font-display text-5xl leading-none text-stone-950">
                Atelier POS
              </h1>
              <p className="mt-3 max-w-[18rem] text-sm leading-6 text-stone-600">
                A quiet, premium selling floor built for touch-first retail moments.
              </p>
            </div>

            <SidebarNav />

            <div className="mt-auto rounded-[24px] bg-stone-950 p-5 text-stone-50">
              <div className="flex items-center gap-3 text-sm font-medium">
                <Cloud className="h-4 w-4" strokeWidth={1.8} />
                Private online runtime
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Deploy this app with hosted Postgres, protect it with a staff password, and
                open it from any iPad or boutique device.
              </p>
              <form action="/api/auth/logout" method="post" className="mt-4">
                <button
                  type="submit"
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 text-sm font-medium text-stone-50 transition hover:bg-white/14"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="min-w-0 flex-1">
              <SidebarNav mobile />
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 text-sm font-medium text-stone-700"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                Exit
              </button>
            </form>
          </div>
          <main className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
