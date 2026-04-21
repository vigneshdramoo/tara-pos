import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCompactDate, formatCurrency } from "@/lib/format";
import type { RecentOrderInsight } from "@/lib/types";

export function RecentOrders({ orders }: { orders: RecentOrderInsight[] }) {
  return (
    <Surface className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Recent orders</p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">Latest transactions</h3>
        </div>
        <Pill>{orders.length} visible</Pill>
      </div>

      <div className="grid gap-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-white/80 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-gold)]">{order.orderNumber}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{order.customerName}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {order.itemCount} items · {formatCompactDate(order.createdAt)}
              </p>
            </div>
            <div className="self-center text-right">
              <Pill tone="accent">{order.paymentMethod}</Pill>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {formatCurrency(order.totalCents)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
