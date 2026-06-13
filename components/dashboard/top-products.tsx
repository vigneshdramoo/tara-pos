import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCurrency, formatInteger } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import type { TopProductInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TopProducts({ items }: { items: TopProductInsight[] }) {
  function getStockToneClasses(tone: ReturnType<typeof getStockStatus>["tone"]) {
    switch (tone) {
      case "healthy":
        return {
          badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
          bar: "bg-emerald-500",
        };
      case "low":
        return {
          badge: "border-amber-200 bg-amber-50 text-amber-700",
          bar: "bg-amber-500",
        };
      case "critical":
      case "soldOut":
        return {
          badge: "border-rose-200 bg-rose-50 text-rose-700",
          bar: "bg-rose-500",
        };
    }
  }

  return (
    <Surface className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Top products</p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">Best-selling fragrances</h3>
        </div>
        <Pill tone="accent">Last 30 days</Pill>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => {
          const stockStatus = getStockStatus(item.stock, item.reorderLevel);
          const stockTone = getStockToneClasses(stockStatus.tone);
          const dailyVelocity = item.quantitySold / 30;
          const stockCoverDays = dailyVelocity > 0 ? Math.round(item.stock / dailyVelocity) : null;
          const sellThroughPercent = Math.round(
            (item.quantitySold / Math.max(item.quantitySold + item.stock, 1)) * 100,
          );

          return (
            <div
              key={item.id}
              className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-white/78 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <div
                className="luxury-ring flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${item.accentHex}, var(--brand-midnight))`,
                }}
              >
                {index + 1}
              </div>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.collection}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      stockTone.badge,
                    )}
                  >
                    {stockStatus.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--muted-strong)]">
                  {formatInteger(item.quantitySold)} units sold · {formatCurrency(item.revenueCents)} revenue
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <span>30-day velocity</span>
                    <span>
                      {stockCoverDays
                        ? `${stockCoverDays} days of stock left`
                        : "Awaiting more movement to estimate cover"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(26,51,74,0.08)]">
                    <div
                      className={cn("h-full rounded-full transition-[width]", stockTone.bar)}
                      style={{
                        width: `${Math.max(Math.min(sellThroughPercent, 100), sellThroughPercent > 0 ? 10 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="self-center text-right">
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-gold)]">Floor stock</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{formatInteger(item.stock)}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Reorder line {formatInteger(item.reorderLevel)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
