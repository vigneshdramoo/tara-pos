import { AlertTriangle } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import type { LowStockInsight } from "@/lib/types";

export function LowStockList({ items }: { items: LowStockInsight[] }) {
  return (
    <Surface className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Inventory alerts</p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-950">Low-stock watchlist</h3>
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
              className="rounded-[24px] border border-rose-200 bg-rose-50/70 p-4"
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
                    <p className="font-semibold text-stone-950">{item.name}</p>
                    <p className="text-sm text-stone-600">
                      {item.stock} left · floor level {item.reorderLevel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-600">Restock</p>
                  <p className="mt-1 text-2xl font-semibold text-rose-700">
                    +{item.recommendedRestock}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5 text-sm leading-7 text-emerald-800">
            No fragrances are under their floor threshold right now. The boutique can stay
            focused on conversion instead of replenishment.
          </div>
        )}
      </div>
    </Surface>
  );
}
