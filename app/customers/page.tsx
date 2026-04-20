import { PageIntro } from "@/components/page-intro";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCompactDate, formatCurrency } from "@/lib/format";
import { getCustomersData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomersData();
  const repeatCustomers = customers.filter((customer) => customer.ordersCount > 1).length;

  return (
    <>
      <PageIntro
        eyebrow="Clienteling"
        title="Customer capture"
        description="Every checkout can feed a richer customer record, making it easy to remember preferences, repeat buyers, and high-value fragrance clients."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Captured profiles</p>
          <p className="mt-4 font-display text-5xl text-stone-950">{customers.length}</p>
          <p className="mt-2 text-sm text-stone-600">Stored in the live boutique database.</p>
        </Surface>
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Repeat buyers</p>
          <p className="mt-4 font-display text-5xl text-stone-950">{repeatCustomers}</p>
          <p className="mt-2 text-sm text-stone-600">
            Guests with more than one recorded order so far.
          </p>
        </Surface>
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Tracked value</p>
          <p className="mt-4 font-display text-5xl text-stone-950">
            {formatCurrency(
              customers.reduce((sum, customer) => sum + customer.lifetimeValueCents, 0),
            )}
          </p>
          <p className="mt-2 text-sm text-stone-600">Lifetime spend across captured customers.</p>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {customers.map((customer) => (
          <Surface key={customer.id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-stone-950">{customer.name}</h3>
                <p className="mt-1 text-sm text-stone-600">
                  {customer.email ?? "No email captured"}
                </p>
                <p className="text-sm text-stone-600">{customer.phone ?? "No phone captured"}</p>
              </div>
              <Pill tone={customer.ordersCount > 1 ? "accent" : "default"}>
                {customer.ordersCount > 1 ? "Repeat" : "New"} client
              </Pill>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Orders</p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">{customer.ordersCount}</p>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Lifetime spend</p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">
                  {formatCurrency(customer.lifetimeValueCents)}
                </p>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Last purchase</p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">
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
        ))}
      </section>
    </>
  );
}
