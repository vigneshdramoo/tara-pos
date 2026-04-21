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
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Cart</p>
        <h3 className="mt-3 text-3xl font-semibold text-foreground">Checkout</h3>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="space-y-3">
          {cart.length ? (
            cart.map((item) => (
              <div
                key={item.id}
                className="tara-card-soft rounded-[24px] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.collection} · {formatCurrency(item.priceCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="tara-chip-default rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.id)}
                      className="tara-button-secondary touch-target h-12 w-12 rounded-2xl text-xl"
                    >
                      –
                    </button>
                    <div className="tara-panel-dark flex h-12 min-w-14 items-center justify-center rounded-2xl px-4 text-sm font-semibold">
                      {item.quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.id)}
                      className="tara-button-secondary touch-target h-12 w-12 rounded-2xl text-xl"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(item.quantity * item.priceCents)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[rgba(255,251,246,0.62)] px-5 py-8 text-center text-sm leading-7 text-[var(--muted)]">
              Tap any fragrance card to start a basket.
            </div>
          )}
        </div>

        <div className="tara-card-soft rounded-[24px] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Recent customers</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentCustomers.map((recent) => (
              <button
                key={recent.id}
                type="button"
                onClick={() => onHydrateCustomer(recent)}
                className="tara-button-secondary touch-target rounded-2xl px-4 text-sm font-medium transition"
              >
                {recent.name}
              </button>
            ))}
          </div>
        </div>

        <div className="tara-card-soft grid gap-3 rounded-[24px] p-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Customer name</label>
            <input
              value={customer.name ?? ""}
              onChange={(event) => onCustomerFieldChange("name", event.target.value)}
              placeholder="Optional walk-in capture"
              className="tara-input mt-2 touch-target w-full rounded-2xl px-4 outline-none transition"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Email</label>
              <input
                value={customer.email ?? ""}
                onChange={(event) => onCustomerFieldChange("email", event.target.value)}
                placeholder="name@example.com"
                className="tara-input mt-2 touch-target w-full rounded-2xl px-4 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Phone</label>
              <input
                value={customer.phone ?? ""}
                onChange={(event) => onCustomerFieldChange("phone", event.target.value)}
                placeholder="+60..."
                className="tara-input mt-2 touch-target w-full rounded-2xl px-4 outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Customer notes</label>
            <textarea
              value={customer.notes ?? ""}
              onChange={(event) => onCustomerFieldChange("notes", event.target.value)}
              rows={3}
              placeholder="Preferences, gifting, or follow-up details"
              className="tara-input mt-2 w-full rounded-2xl px-4 py-3 outline-none transition"
            />
          </div>
        </div>

        <div className="tara-card-soft rounded-[24px] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Payment method</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {paymentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onPaymentMethodChange(option)}
                className={cn(
                  "touch-target rounded-2xl border px-3 text-sm font-semibold transition",
                  paymentMethod === option
                    ? "tara-panel-dark border-transparent"
                    : "tara-button-secondary",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="tara-card-soft rounded-[24px] p-4">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Order note</label>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Gift wrap, tester request, in-store follow up"
            className="tara-input mt-2 w-full rounded-2xl px-4 py-3 outline-none transition"
          />
        </div>
      </div>

      <div className="tara-panel-dark rounded-[24px] p-5">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[rgba(247,243,235,0.72)]">Subtotal</span>
            <span>{formatCurrency(subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[rgba(247,243,235,0.72)]">Tax</span>
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
                ? "tara-alert-success"
                : "tara-alert-danger",
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
              ? "cursor-not-allowed tara-button-inverse opacity-50"
              : "tara-button-primary",
          )}
        >
          {submitting ? "Processing sale..." : refreshing ? "Refreshing floor..." : "Complete checkout"}
        </button>
      </div>
    </aside>
  );
}
