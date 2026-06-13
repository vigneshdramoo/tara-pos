import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCurrency } from "@/lib/format";
import type { PromotionInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PromotionWatch({ items }: { items: PromotionInsight[] }) {
  return (
    <Surface className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Promotion watch</p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">Offer performance</h3>
        </div>
        <Pill tone="accent">Last 30 days</Pill>
      </div>

      <div className="grid gap-3">
        {items.length ? (
          items.map((item) => {
            const hasPerformance = item.orders > 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-[24px] border p-4 transition",
                  hasPerformance
                    ? "border-[rgba(202,158,91,0.26)] bg-[rgba(255,251,246,0.88)]"
                    : "border-[var(--line)] bg-[rgba(255,251,246,0.58)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                  </div>
                  <Pill tone={hasPerformance ? "accent" : "default"}>
                    {item.orders} order{item.orders === 1 ? "" : "s"}
                  </Pill>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                      Revenue captured
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {formatCurrency(item.revenueCents)}
                    </p>
                  </div>
                  <p className="max-w-[14rem] text-right text-sm leading-6 text-[var(--muted-strong)]">
                    {item.highlight}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[24px] border border-[rgba(26,51,74,0.16)] bg-[rgba(26,51,74,0.08)] p-5 text-sm leading-7 text-[var(--brand-midnight)]">
            No promotions have been redeemed recently. When offers start converting, this panel will
            show which mechanic is actually moving revenue.
          </div>
        )}
      </div>
    </Surface>
  );
}
