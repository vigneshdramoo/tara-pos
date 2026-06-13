import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCurrency } from "@/lib/format";
import type { SalesTrendPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SalesTrend({ points }: { points: SalesTrendPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.salesCents), 1);
  const activeDays = points.filter((point) => point.salesCents > 0).length;
  const totalOrders = points.reduce((sum, point) => sum + point.orders, 0);
  const todayPoint = points.find((point) => point.isToday);
  const trendMessage =
    activeDays === 0
      ? "No completed sales landed in the last seven days yet."
      : activeDays === 1
        ? "Week just started. As more trading days land, the rhythm will fill out naturally."
        : `${activeDays} of the last 7 days have recorded sales, with ${totalOrders} completed orders in total.`;

  return (
    <Surface className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Sales trend</p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            Seven-day revenue rhythm
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{trendMessage}</p>
        </div>
        <Pill>{todayPoint ? `${todayPoint.label} is today` : "This week"}</Pill>
      </div>

      <div className="relative rounded-[24px] border border-[var(--line)] bg-[rgba(255,251,246,0.72)] p-5">
        <div className="pointer-events-none absolute inset-x-5 top-5 bottom-20 flex flex-col justify-between">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="border-t border-[rgba(26,51,74,0.09)]"
            />
          ))}
        </div>
        <div className="relative flex h-[260px] items-end gap-3">
          {points.map((point) => {
            const height = Math.max(
              (point.salesCents / maxValue) * 100,
              point.salesCents ? 16 : 6,
            );

            return (
              <div
                key={point.key}
                className={cn(
                  "flex flex-1 flex-col items-center gap-3 rounded-[20px] px-2 pb-2 pt-3 transition",
                  point.isToday && "border border-[var(--line-strong)] bg-[rgba(202,158,91,0.08)]",
                )}
              >
                <span
                  className={cn(
                    "text-xs",
                    point.isToday ? "font-semibold text-[var(--brand-midnight)]" : "text-[var(--muted)]",
                  )}
                >
                  {formatCurrency(point.salesCents)}
                </span>
                <div className="flex h-full w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-[20px]",
                      point.isToday
                        ? "bg-gradient-to-b from-[#CA9E5B] via-[#C88E4D] to-[#1A334A]"
                        : "bg-gradient-to-b from-[#CA9E5B] via-[#C88E4D] to-[#4B306A]",
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-medium text-foreground">{point.label}</p>
                    {point.isToday ? <Pill tone="accent">Today</Pill> : null}
                  </div>
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
