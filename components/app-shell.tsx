import type { ReactNode } from "react";
import { Wifi } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
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
                <Wifi className="h-4 w-4" strokeWidth={1.8} />
                LAN-ready local runtime
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Run this app on your Mac mini, keep data in SQLite, and open it from your
                iPad on the same network.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SidebarNav mobile />
          <main className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
