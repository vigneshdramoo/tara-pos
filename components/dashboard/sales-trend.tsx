import { Surface } from "@/components/ui/surface";
import { formatCurrency } from "@/lib/format";
import type { SalesTrendPoint } from "@/lib/types";

export function SalesTrend({ points }: { points: SalesTrendPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.salesCents), 1);

  return (
    <Surface className="flex flex-col gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Sales trend</p>
        <h3 className="mt-3 text-2xl font-semibold text-foreground">
          Seven-day revenue rhythm
        </h3>
      </div>

      <div className="subtle-grid rounded-[24px] border border-[var(--line)] p-5">
        <div className="flex h-[260px] items-end gap-3">
          {points.map((point) => {
            const height = Math.max(
              (point.salesCents / maxValue) * 100,
              point.salesCents ? 16 : 6,
            );

            return (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                <span className="text-xs text-[var(--muted)]">{formatCurrency(point.salesCents)}</span>
                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-[20px] bg-gradient-to-b from-[#CA9E5B] via-[#C88E4D] to-[#4B306A]"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{point.label}</p>
                  <p className="text-xs text-[var(--muted)]">{point.orders} orders</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
