import type { DashboardStat } from "@/lib/types";

const accents = ["#CA9E5B", "#C88E4D", "#1A334A", "#4B306A"];

export function StatCard({
  stat,
  index,
}: {
  stat: DashboardStat;
  index: number;
}) {
  return (
    <article className="tara-surface-strong p-5">
      <div
        className="h-1 w-16 rounded-full"
        style={{ backgroundColor: accents[index % accents.length] }}
      />
      <p className="mt-5 text-sm uppercase tracking-[0.22em] text-[var(--muted-strong)]">
        {stat.label}
      </p>
      <p className="mt-4 font-display text-5xl leading-none text-foreground">{stat.value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{stat.detail}</p>
    </article>
  );
}
