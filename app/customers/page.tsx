import Link from "next/link";
import type { Route } from "next";
import { BoothLeadsWorkspace } from "@/components/leads/booth-leads-workspace";
import { PageIntro } from "@/components/page-intro";
import { Pill } from "@/components/ui/pill";
import { StatusNotice } from "@/components/ui/status-notice";
import { Surface } from "@/components/ui/surface";
import { formatCompactDate, formatCurrency } from "@/lib/format";
import { getCustomersData, getQuizLeadsData } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

type CustomersPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function ViewTab({ href, label, active }: { href: Route; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "touch-target inline-flex items-center rounded-full px-5 text-sm font-medium transition",
        active
          ? "tara-panel-dark shadow-lg"
          : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--brand-midnight)]",
      )}
    >
      {label}
    </Link>
  );
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { view: viewParam } = await searchParams;
  const view = viewParam === "leads" ? "leads" : "customers";

  if (view === "leads") {
    const leadsData = await getQuizLeadsData();

    return (
      <>
        <PageIntro
          eyebrow="Clienteling"
          title="Customers and leads"
          description="Quiz leads with scent result, consent, and purchase intent."
        />

        <div className="flex flex-wrap gap-2">
          <ViewTab href="/customers" label="Customers" active={false} />
          <ViewTab href={"/customers?view=leads" as Route} label="Leads" active />
        </div>

        {leadsData.databaseIssue ? <StatusNotice message={leadsData.databaseIssue} /> : null}
        <BoothLeadsWorkspace leads={leadsData.leads} />
      </>
    );
  }

  const { customers, databaseIssue } = await getCustomersData();
  const repeatCustomers = customers.filter((customer) => customer.ordersCount > 1).length;

  return (
    <>
      <PageIntro
        eyebrow="Clienteling"
        title="Customers and leads"
        description="Captured customers with repeat-buyer and lifetime-spend visibility."
      />

      <div className="flex flex-wrap gap-2">
        <ViewTab href="/customers" label="Customers" active />
        <ViewTab href={"/customers?view=leads" as Route} label="Leads" active={false} />
      </div>

      {databaseIssue ? <StatusNotice message={databaseIssue} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Captured profiles</p>
          <p className="mt-4 font-display text-5xl text-[var(--brand-midnight)]">{customers.length}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Stored in the live boutique database.</p>
        </Surface>
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Repeat buyers</p>
          <p className="mt-4 font-display text-5xl text-[var(--brand-midnight)]">{repeatCustomers}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Guests with more than one recorded order so far.
          </p>
        </Surface>
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Tracked value</p>
          <p className="mt-4 font-display text-5xl text-[var(--brand-midnight)]">
            {formatCurrency(
              customers.reduce((sum, customer) => sum + customer.lifetimeValueCents, 0),
            )}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Lifetime spend across captured customers.</p>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {customers.length ? (
          customers.map((customer) => (
            <Surface key={customer.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--brand-midnight)]">{customer.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {customer.email ? `Social handle · ${customer.email}` : "No social handle captured"}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{customer.phone ?? "No phone captured"}</p>
                </div>
                <Pill tone={customer.ordersCount > 1 ? "accent" : "default"}>
                  {customer.ordersCount > 1 ? "Repeat" : "New"} client
                </Pill>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Orders</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--brand-midnight)]">
                    {customer.ordersCount}
                  </p>
                </div>
                <div className="rounded-[22px] bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Lifetime spend
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--brand-midnight)]">
                    {formatCurrency(customer.lifetimeValueCents)}
                  </p>
                </div>
                <div className="rounded-[22px] bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Last purchase
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--brand-midnight)]">
                    {customer.lastPurchaseAt ? formatCompactDate(customer.lastPurchaseAt) : "—"}
                  </p>
                </div>
              </div>

              {customer.notes ? (
                <p className="rounded-[22px] bg-stone-950 px-4 py-3 text-sm text-stone-200">
                  {customer.notes}
                </p>
              ) : null}
            </Surface>
          ))
        ) : (
          <Surface className="text-sm leading-7 text-[var(--muted)]">
            {databaseIssue
              ? "Customer records will appear once the hosted database is connected and migrated."
              : "No customer profiles have been captured yet."}
          </Surface>
        )}
      </section>
    </>
  );
}
