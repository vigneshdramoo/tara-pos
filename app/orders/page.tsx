import { PageIntro } from "@/components/page-intro";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { Surface } from "@/components/ui/surface";
import { formatCompactDate, formatCurrency, formatFullDateTime } from "@/lib/format";
import { getOrdersData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { orders, databaseIssue } = await getOrdersData();

  return (
    <>
      <PageIntro
        eyebrow="Transaction archive"
        title="Order history"
        description="Review recent sales, customer attribution, payment mix, and item-level order composition without leaving the same local app."
      />

      {databaseIssue ? <StatusNotice message={databaseIssue} /> : null}

      <section className="grid gap-4">
        {orders.length ? (
          orders.map((order) => (
            <Surface key={order.id} className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {formatFullDateTime(order.createdAt)}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-stone-950">
                    {order.orderNumber}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">{order.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Pill tone="accent">{order.paymentMethod}</Pill>
                  <p className="text-2xl font-semibold text-stone-950">
                    {formatCurrency(order.totalCents)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[24px] bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Items</p>
                  <div className="mt-4 grid gap-3">
                    {order.itemSummary.map((item) => (
                      <div
                        key={`${order.id}-${item.productName}`}
                        className="flex items-center justify-between rounded-[18px] border border-[var(--line)] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-stone-900">{item.productName}</p>
                          <p className="text-sm text-stone-600">
                            Qty {item.quantity} · {formatCurrency(item.totalPriceCents)}
                          </p>
                        </div>
                        <p className="text-sm text-stone-500">
                          {formatCompactDate(order.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] bg-stone-950 p-5 text-stone-50">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Breakdown</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Subtotal</span>
                      <span>{formatCurrency(order.subtotalCents)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Tax</span>
                      <span>{formatCurrency(order.taxCents)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalCents)}</span>
                    </div>
                  </div>
                  {order.notes ? (
                    <p className="mt-4 rounded-[18px] bg-white/8 px-4 py-3 text-sm leading-6 text-stone-200">
                      {order.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            </Surface>
          ))
        ) : (
          <Surface className="text-sm leading-7 text-stone-600">
            {databaseIssue
              ? "Orders will appear here once the hosted database is connected and migrated."
              : "No orders have been recorded yet."}
          </Surface>
        )}
      </section>
    </>
  );
}
