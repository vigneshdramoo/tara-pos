"use client";

import Image from "next/image";
import {
  CHECKOUT_PROMOTION_OPTIONS,
  EIGHT_ML_EDP_BUNDLE_OFFER,
  type CheckoutPromotionId,
  type CheckoutLinePricing,
} from "@/lib/checkout-pricing";
import { formatCurrency } from "@/lib/format";
import type { CheckoutPayload, ProductCardData, RecentCustomerOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type CartLine = ProductCardData & {
  quantity: number;
};

type CartPanelProps = {
  cart: CartLine[];
  recentCustomers: RecentCustomerOption[];
  notes: string;
  customer: NonNullable<CheckoutPayload["customer"]>;
  subtotalCents: number;
  listSubtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  promotionId: CheckoutPromotionId;
  promotionLabel: string;
  promotionDescription: string;
  cartLinePricing: CheckoutLinePricing[];
  eightMlBundleCount: number;
  eightMlEligibleUnits: number;
  eightMlUnitsUntilNextBundle: number;
  freeGiftEligibleUnits: number;
  freeGiftClaimedUnits: number;
  freeGiftUnitsRemaining: number;
  offerHeadline: string | null;
  offerCallout: string | null;
  submitting: boolean;
  refreshing: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
  onNotesChange: (value: string) => void;
  onCustomerFieldChange: (
    field: keyof NonNullable<CheckoutPayload["customer"]>,
    value: string,
  ) => void;
  onHydrateCustomer: (customer: RecentCustomerOption) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onPromotionChange: (promotionId: CheckoutPromotionId) => void;
  onCheckout: () => void;
};

export function CartPanel({
  cart,
  recentCustomers,
  notes,
  customer,
  subtotalCents,
  listSubtotalCents,
  discountCents,
  taxCents,
  totalCents,
  promotionId,
  promotionLabel,
  promotionDescription,
  cartLinePricing,
  eightMlBundleCount,
  eightMlEligibleUnits,
  eightMlUnitsUntilNextBundle,
  freeGiftEligibleUnits,
  freeGiftClaimedUnits,
  freeGiftUnitsRemaining,
  offerHeadline,
  offerCallout,
  submitting,
  refreshing,
  feedback,
  onNotesChange,
  onCustomerFieldChange,
  onHydrateCustomer,
  onIncrease,
  onDecrease,
  onRemove,
  onPromotionChange,
  onCheckout,
}: CartPanelProps) {
  const disabled = cart.length === 0 || submitting || refreshing;
  const linePricingByProductId = new Map(
    cartLinePricing.map((linePricing) => [linePricing.productId, linePricing]),
  );
  const showNextBundleHint =
    promotionId === "EIGHT_ML_BUNDLE" &&
    eightMlEligibleUnits > 0 &&
    eightMlUnitsUntilNextBundle > 0;

  return (
    <aside
      id="checkout-panel"
      className="tara-surface scroll-mt-24 flex flex-col gap-4 p-4 md:p-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:gap-5 xl:p-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Cart</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground md:mt-3 md:text-3xl">
            Checkout
          </h3>
        </div>
        <p className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} items
        </p>
      </div>

      <div className="space-y-4 xl:scrollbar-hidden xl:flex-1 xl:overflow-y-auto xl:pr-1">
        <div className="space-y-3">
          {cart.length ? (
            cart.map((item) => {
              const linePricing = linePricingByProductId.get(item.id);
              const lineTotalCents =
                linePricing?.totalPriceCents ?? item.quantity * item.priceCents;
              const lineDiscountCents = linePricing?.discountCents ?? 0;

              return (
                <div key={item.id} className="tara-card-soft rounded-[24px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {item.collection} · {formatCurrency(item.priceCents)}
                      </p>
                      {linePricing?.promotionDetail ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold)]">
                          {linePricing.promotionDetail}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="tara-chip-default shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
                    <div className="text-right">
                      {lineDiscountCents > 0 ? (
                        <p className="text-sm text-[rgba(75,48,106,0.58)] line-through">
                          {formatCurrency(linePricing?.listTotalCents ?? 0)}
                        </p>
                      ) : null}
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(lineTotalCents)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[rgba(255,251,246,0.62)] px-5 py-8 text-center text-sm leading-7 text-[var(--muted)]">
              Tap any fragrance card to start a basket.
            </div>
          )}
        </div>

        <div className="tara-card-soft rounded-[22px] p-4 md:rounded-[24px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Promotion</p>
              <h4 className="mt-2 text-lg font-semibold text-foreground">{promotionLabel}</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{promotionDescription}</p>
            </div>
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              Event-ready
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {CHECKOUT_PROMOTION_OPTIONS.map((option) => {
              const active = option.id === promotionId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onPromotionChange(option.id)}
                  className={cn(
                    "rounded-[20px] border px-4 py-3 text-left transition",
                    active
                      ? "border-[var(--brand-gold)] bg-[rgba(202,158,91,0.12)] shadow-[0_12px_30px_rgba(202,158,91,0.12)]"
                      : "border-[var(--line)] bg-white/70 hover:border-[rgba(202,158,91,0.42)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold)]">
                        {option.kicker}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{option.label}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                        active
                          ? "bg-[var(--brand-gold)] text-[var(--brand-onyx)]"
                          : "bg-[rgba(247,243,235,0.92)] text-[var(--muted-strong)]",
                      )}
                    >
                      {active ? "Selected" : "Tap to use"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{option.requirements}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-midnight)]">
                    {option.preview}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="tara-card-soft rounded-[22px] p-4 md:rounded-[24px]">
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

        <div className="tara-card-soft grid gap-3 rounded-[22px] p-4 md:rounded-[24px]">
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

        <div className="tara-card-soft rounded-[22px] p-4 md:rounded-[24px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                Payment
              </p>
              <h4 className="mt-2 text-lg font-semibold text-foreground">DuitNow QR</h4>
            </div>
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              QR only
            </span>
          </div>
          <div className="mt-4 rounded-[20px] border border-[var(--line)] bg-white p-2">
            <Image
              src="/payments/tara-duitnow-qr.png"
              alt="TARA Scents DuitNow QR code"
              width={1071}
              height={1664}
              className="mx-auto h-auto max-h-[520px] w-full max-w-[340px] object-contain"
              priority
            />
          </div>
        </div>

        <div className="tara-card-soft rounded-[22px] p-4 md:rounded-[24px]">
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

      <div className="tara-panel-dark rounded-[22px] p-4 md:rounded-[24px] md:p-5 xl:shrink-0">
        <div className="space-y-3 text-sm">
          {offerHeadline ? (
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[rgba(247,243,235,0.72)]">Active promotion</span>
                <span className="font-semibold">{offerHeadline}</span>
              </div>
              {offerCallout ? (
                <p className="mt-2 text-xs leading-6 text-[rgba(247,243,235,0.72)]">{offerCallout}</p>
              ) : null}
            </div>
          ) : null}
          {eightMlBundleCount > 0 ? (
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[rgba(247,243,235,0.72)]">
                  {EIGHT_ML_EDP_BUNDLE_OFFER.label} offer
                </span>
                <span className="font-semibold">
                  {eightMlBundleCount} x {formatCurrency(EIGHT_ML_EDP_BUNDLE_OFFER.bundlePriceCents)}
                </span>
              </div>
            </div>
          ) : null}
          {showNextBundleHint ? (
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3 text-[rgba(247,243,235,0.72)]">
              Add {eightMlUnitsUntilNextBundle} more 8mL EDP to unlock{" "}
              {EIGHT_ML_EDP_BUNDLE_OFFER.label} for{" "}
              {formatCurrency(EIGHT_ML_EDP_BUNDLE_OFFER.bundlePriceCents)}.
            </div>
          ) : null}
          {promotionId === "SUNWAY_STUDENT" && freeGiftEligibleUnits > 0 ? (
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[rgba(247,243,235,0.72)]">Student travel gifts</span>
                <span className="font-semibold">
                  {freeGiftClaimedUnits}/{freeGiftEligibleUnits} claimed
                </span>
              </div>
              {freeGiftUnitsRemaining > 0 ? (
                <p className="mt-2 text-xs leading-6 text-[rgba(247,243,235,0.72)]">
                  Add {freeGiftUnitsRemaining} x 8mL travel size to the basket so the free gift is
                  captured in inventory.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-6 text-[rgba(247,243,235,0.72)]">
                  Every eligible student freebie is already in the basket and priced correctly.
                </p>
              )}
            </div>
          ) : null}
          {discountCents > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[rgba(247,243,235,0.72)]">Before offer</span>
                <span>{formatCurrency(listSubtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[rgba(247,243,235,0.72)]">Offer savings</span>
                <span>-{formatCurrency(discountCents)}</span>
              </div>
            </>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-[rgba(247,243,235,0.72)]">Subtotal</span>
            <span>{formatCurrency(subtotalCents)}</span>
          </div>
          {taxCents > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[rgba(247,243,235,0.72)]">Tax</span>
              <span>{formatCurrency(taxCents)}</span>
            </div>
          ) : null}
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
