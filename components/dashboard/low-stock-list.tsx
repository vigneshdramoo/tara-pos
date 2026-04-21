import { AlertTriangle } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import type { LowStockInsight } from "@/lib/types";

export function LowStockList({ items }: { items: LowStockInsight[] }) {
  return (
    <Surface className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Inventory alerts</p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">Low-stock watchlist</h3>
        </div>
        <Pill tone={items.length ? "danger" : "accent"}>
          {items.length ? `${items.length} alerts` : "Healthy"}
        </Pill>
      </div>

      <div className="grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[24px] border border-[rgba(200,142,77,0.24)] bg-[rgba(200,142,77,0.10)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: item.accentHex }}
                  >
                    <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {item.stock} left · floor level {item.reorderLevel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-amber)]">Restock</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--brand-amber)]">
                    +{item.recommendedRestock}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border border-[rgba(26,51,74,0.16)] bg-[rgba(26,51,74,0.08)] p-5 text-sm leading-7 text-[var(--brand-midnight)]">
            No fragrances are under their floor threshold right now. The boutique can stay
            focused on conversion instead of replenishment.
          </div>
        )}
      </div>
    </Surface>
  );
}
