import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCurrency } from "@/lib/format";
import type { TopProductInsight } from "@/lib/types";

export function TopProducts({ items }: { items: TopProductInsight[] }) {
  return (
    <Surface className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Top products</p>
          <h3 className="mt-3 text-2xl font-semibold text-stone-950">Best-selling fragrances</h3>
        </div>
        <Pill tone="accent">Last 30 days</Pill>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-white/78 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <div
              className="luxury-ring flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${item.accentHex}, #1d1916)`,
              }}
            >
              {index + 1}
            </div>
            <div>
              <p className="text-lg font-semibold text-stone-950">{item.name}</p>
              <p className="mt-1 text-sm text-stone-600">{item.collection}</p>
              <p className="mt-3 text-sm text-stone-500">
                {item.quantitySold} units sold · {formatCurrency(item.revenueCents)} revenue
              </p>
            </div>
            <div className="self-center text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Floor stock</p>
              <p className="mt-2 text-2xl font-semibold text-stone-950">{item.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
