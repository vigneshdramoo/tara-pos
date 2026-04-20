import type { DashboardStat } from "@/lib/types";

const accents = ["#af7b54", "#8f5a47", "#d4b18b", "#6f8b87"];

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
      <p className="mt-5 text-sm uppercase tracking-[0.22em] text-stone-500">{stat.label}</p>
      <p className="mt-4 font-display text-5xl leading-none text-stone-950">{stat.value}</p>
      <p className="mt-3 text-sm leading-6 text-stone-600">{stat.detail}</p>
    </article>
  );
}
