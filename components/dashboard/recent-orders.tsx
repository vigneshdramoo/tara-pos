import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCompactDate, formatCurrency, formatTimeOnly } from "@/lib/format";
import type { RecentOrderInsight } from "@/lib/types";

export function RecentOrders({ orders }: { orders: RecentOrderInsight[] }) {
  function getPaymentPresentation(paymentMethod: RecentOrderInsight["paymentMethod"]) {
    if (paymentMethod === "TRANSFER") {
      return {
        label: "QR Payment",
        tone: "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500",
      };
    }

    if (paymentMethod === "CARD") {
      return {
        label: "Card",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    }

    return {
      label: "Cash",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  }

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
        {orders.map((order) => {
          const payment = getPaymentPresentation(order.paymentMethod);

          return (
            <div
              key={order.id}
              className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-white/80 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-gold)]">{order.orderNumber}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{order.customerName}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {order.itemCount} items · {formatCompactDate(order.createdAt)} · {formatTimeOnly(order.createdAt)}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Sold by {order.salespersonName ?? "unassigned"}
                </p>
              </div>
              <div className="self-center text-right">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${payment.tone}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${payment.dot}`} />
                  {payment.label}
                </span>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {formatCurrency(order.totalCents)}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatCurrency(order.commissionCents)} commission
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
