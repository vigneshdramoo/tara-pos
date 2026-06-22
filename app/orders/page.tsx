import Link from "next/link";
import type { Route } from "next";
import { cookies } from "next/headers";
import { OrderAmendmentPanel } from "@/components/orders/order-amendment-panel";
import { PageIntro } from "@/components/page-intro";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { Surface } from "@/components/ui/surface";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { formatCurrency, formatFullDateTime } from "@/lib/format";
import { getOrderAmendmentProducts, getOrdersData } from "@/lib/queries";
import { canAmendOrders } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

function normalizePage(value?: string) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function buildOrdersPageHref(page: number) {
  return (page <= 1 ? "/orders" : `/orders?page=${page}`) as Route;
}

function PaginationLink({
  href,
  label,
  disabled,
}: {
  href: Route;
  label: string;
  disabled: boolean;
}) {
  const className = disabled
    ? "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-stone-400"
    : "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[var(--brand-gold)] hover:text-[var(--brand-midnight)]";

  if (disabled) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link href={href} className={className} prefetch={false}>
      {label}
    </Link>
  );
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const currentPage = normalizePage((await searchParams).page);
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);
  const canAmend = session ? canAmendOrders(session.role) : false;
  const [ordersData, amendmentProducts] = await Promise.all([
    getOrdersData(currentPage),
    canAmend ? getOrderAmendmentProducts() : Promise.resolve([]),
  ]);
  const { orders, databaseIssue, hasNextPage, hasPreviousPage, page, pageSize } = ordersData;

  return (
    <>
      <PageIntro
        eyebrow="Transaction archive"
        title="Order history"
        description="Review recent sales, customer attribution, payment mix, and item-level order composition without leaving the same local app."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">{orders.length} loaded</Pill>
            <Pill>{pageSize} per page</Pill>
            <Pill>Page {page}</Pill>
            {canAmend ? <Pill tone="accent">Manager amend</Pill> : null}
          </div>
        }
      />

      {databaseIssue ? <StatusNotice message={databaseIssue} /> : null}

      <section className="grid gap-4">
        <Surface className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Recent orders only</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              The archive loads a slimmer recent slice first to keep the boutique view responsive.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PaginationLink
              href={buildOrdersPageHref(page - 1)}
              label="Newer"
              disabled={!hasPreviousPage}
            />
            <PaginationLink
              href={buildOrdersPageHref(page + 1)}
              label="Older"
              disabled={!hasNextPage}
            />
          </div>
        </Surface>

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
                  <p className="mt-1 text-sm text-stone-500">
                    Sold by {order.salespersonName ?? "unassigned"}
                  </p>
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
                        key={item.id}
                        className="flex items-center justify-between rounded-[18px] border border-[var(--line)] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-stone-900">{item.productName}</p>
                          <p className="text-sm text-stone-600">
                            Qty {item.quantity} · {formatCurrency(item.totalPriceCents)}
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatCurrency(item.commissionCents)} commission
                          </p>
                        </div>
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
                    {order.taxCents > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-300">Tax</span>
                        <span>{formatCurrency(order.taxCents)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Commission</span>
                      <span>{formatCurrency(order.commissionCents)}</span>
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

              {canAmend ? (
                <OrderAmendmentPanel order={order} products={amendmentProducts} />
              ) : null}
            </Surface>
          ))
        ) : (
          <Surface className="text-sm leading-7 text-stone-600">
            {databaseIssue
              ? "Orders will appear here once the hosted database is connected and migrated."
              : hasPreviousPage
                ? "There are no older orders on this page. Jump back to a newer page."
                : "No orders have been recorded yet."}
          </Surface>
        )}

        {orders.length ? (
          <div className="flex justify-end gap-2">
            <PaginationLink
              href={buildOrdersPageHref(page - 1)}
              label="Newer"
              disabled={!hasPreviousPage}
            />
            <PaginationLink
              href={buildOrdersPageHref(page + 1)}
              label="Older"
              disabled={!hasNextPage}
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
