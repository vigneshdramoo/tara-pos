import type { DashboardStat } from "@/lib/types";
import { cn } from "@/lib/utils";

const accents = ["#CA9E5B", "#C88E4D", "#1A334A", "#4B306A"];

export function StatCard({
  stat,
  index,
}: {
  stat: DashboardStat;
  index: number;
}) {
  const toneClasses = {
    default: "tara-chip-default text-[var(--brand-midnight)]",
    positive: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border border-amber-200 bg-amber-50 text-amber-700",
    muted: "border border-[var(--line)] bg-[rgba(247,243,235,0.92)] text-[var(--muted)]",
  } as const;

  return (
    <article className="tara-surface-strong p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className="h-1 w-16 rounded-full"
          style={{ backgroundColor: accents[index % accents.length] }}
        />
        {stat.comparison ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
              toneClasses[stat.tone ?? "default"],
            )}
          >
            {stat.comparison}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-sm uppercase tracking-[0.22em] text-[var(--muted-strong)]">
        {stat.label}
      </p>
      <p
        className={cn(
          "mt-4 font-display text-5xl leading-none",
          stat.tone === "muted" ? "text-[rgba(10,10,10,0.42)]" : "text-foreground",
        )}
      >
        {stat.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{stat.detail}</p>
    </article>
  );
}
