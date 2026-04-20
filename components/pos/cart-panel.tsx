"use client";

import { formatCurrency } from "@/lib/format";
import type { CheckoutPayload, ProductCardData, RecentCustomerOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type CartLine = ProductCardData & {
  quantity: number;
};

const paymentOptions: Array<CheckoutPayload["paymentMethod"]> = ["CARD", "CASH", "TRANSFER"];

type CartPanelProps = {
  cart: CartLine[];
  recentCustomers: RecentCustomerOption[];
  paymentMethod: CheckoutPayload["paymentMethod"];
  notes: string;
  customer: NonNullable<CheckoutPayload["customer"]>;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  submitting: boolean;
  refreshing: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
  onPaymentMethodChange: (value: CheckoutPayload["paymentMethod"]) => void;
  onNotesChange: (value: string) => void;
  onCustomerFieldChange: (
    field: keyof NonNullable<CheckoutPayload["customer"]>,
    value: string,
  ) => void;
  onHydrateCustomer: (customer: RecentCustomerOption) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
};

export function CartPanel({
  cart,
  recentCustomers,
  paymentMethod,
  notes,
  customer,
  subtotalCents,
  taxCents,
  totalCents,
  submitting,
  refreshing,
  feedback,
  onPaymentMethodChange,
  onNotesChange,
  onCustomerFieldChange,
  onHydrateCustomer,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: CartPanelProps) {
  const disabled = cart.length === 0 || submitting || refreshing;

  return (
    <aside className="tara-surface sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col gap-5 p-5 md:p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Cart</p>
        <h3 className="mt-3 text-3xl font-semibold text-stone-950">Checkout</h3>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="space-y-3">
          {cart.length ? (
            cart.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-950">{item.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {item.collection} · {formatCurrency(item.priceCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.id)}
                      className="touch-target h-12 w-12 rounded-2xl border border-[var(--line)] bg-white text-xl text-stone-900"
                    >
                      –
                    </button>
                    <div className="flex h-12 min-w-14 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-stone-50">
                      {item.quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.id)}
                      className="touch-target h-12 w-12 rounded-2xl border border-[var(--line)] bg-white text-xl text-stone-900"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-lg font-semibold text-stone-950">
                    {formatCurrency(item.quantity * item.priceCents)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 px-5 py-8 text-center text-sm leading-7 text-stone-600">
              Tap any fragrance card to start a basket.
            </div>
          )}
        </div>

        <div className="rounded-[24px] bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Recent customers</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentCustomers.map((recent) => (
              <button
                key={recent.id}
                type="button"
                onClick={() => onHydrateCustomer(recent)}
                className="touch-target rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
              >
                {recent.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-[24px] bg-white/70 p-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-stone-500">Customer name</label>
            <input
              value={customer.name ?? ""}
              onChange={(event) => onCustomerFieldChange("name", event.target.value)}
              placeholder="Optional walk-in capture"
              className="mt-2 touch-target w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-stone-900 outline-none transition focus:border-stone-950"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-stone-500">Email</label>
              <input
                value={customer.email ?? ""}
                onChange={(event) => onCustomerFieldChange("email", event.target.value)}
                placeholder="name@example.com"
                className="mt-2 touch-target w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-stone-900 outline-none transition focus:border-stone-950"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-stone-500">Phone</label>
              <input
                value={customer.phone ?? ""}
                onChange={(event) => onCustomerFieldChange("phone", event.target.value)}
                placeholder="+60..."
                className="mt-2 touch-target w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-stone-900 outline-none transition focus:border-stone-950"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-stone-500">Customer notes</label>
            <textarea
              value={customer.notes ?? ""}
              onChange={(event) => onCustomerFieldChange("notes", event.target.value)}
              rows={3}
              placeholder="Preferences, gifting, or follow-up details"
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-950"
            />
          </div>
        </div>

        <div className="rounded-[24px] bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Payment method</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {paymentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onPaymentMethodChange(option)}
                className={cn(
                  "touch-target rounded-2xl border px-3 text-sm font-semibold transition",
                  paymentMethod === option
                    ? "border-stone-950 bg-stone-950 text-stone-50"
                    : "border-[var(--line)] bg-white text-stone-700",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-white/70 p-4">
          <label className="text-xs uppercase tracking-[0.2em] text-stone-500">Order note</label>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Gift wrap, tester request, in-store follow up"
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-950"
          />
        </div>
      </div>

      <div className="rounded-[24px] bg-stone-950 p-5 text-stone-50">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-300">Subtotal</span>
            <span>{formatCurrency(subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-300">Tax</span>
            <span>{formatCurrency(taxCents)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totalCents)}</span>
          </div>
        </div>

        {feedback ? (
          <div
            className={cn(
              "mt-4 rounded-[18px] px-4 py-3 text-sm leading-6",
              feedback.type === "success"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-700",
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onCheckout}
          disabled={disabled}
          className={cn(
            "touch-target mt-5 w-full rounded-2xl text-sm font-semibold transition",
            disabled
              ? "cursor-not-allowed bg-white/12 text-stone-400"
              : "bg-white text-stone-950 hover:-translate-y-0.5",
          )}
        >
          {submitting ? "Processing sale..." : refreshing ? "Refreshing floor..." : "Complete checkout"}
        </button>
      </div>
    </aside>
  );
}
