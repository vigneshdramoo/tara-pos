"use client";

import Image from "next/image";
import {
  CHECKOUT_PROMOTION_OPTIONS,
  EIGHT_ML_EDP_BUNDLE_OFFER,
  type CheckoutPromotionId,
  type CheckoutLinePricing,
} from "@/lib/checkout-pricing";
import { formatCurrency } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import type { CheckoutPayload, ProductCardData, RecentCustomerOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type CartLine = ProductCardData & {
  quantity: number;
};

type CartPanelProps = {
  cart: CartLine[];
  travelGiftOptions: ProductCardData[];
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
  onAddTravelGift: (product: ProductCardData) => void;
  onPromotionChange: (promotionId: CheckoutPromotionId) => void;
  onCheckout: () => void;
};

export function CartPanel({
  cart,
  travelGiftOptions,
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
  onAddTravelGift,
  onPromotionChange,
  onCheckout,
}: CartPanelProps) {
  const disabled = cart.length === 0 || submitting || refreshing;
  const linePricingByProductId = new Map(
    cartLinePricing.map((linePricing) => [linePricing.productId, linePricing]),
  );
  const cartQuantityByProductId = new Map(cart.map((item) => [item.id, item.quantity]));
  const isTravelBundlePromotion =
    promotionId === "EIGHT_ML_BUNDLE" || promotionId === "HUUHA_TRAVEL_BUNDLE";
  const travelBundleUnitsInProgress = isTravelBundlePromotion
    ? eightMlEligibleUnits === 0
      ? 0
      : eightMlUnitsUntilNextBundle === 0
        ? EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize
        : EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlUnitsUntilNextBundle
    : 0;
  const travelBundleProgressPercent =
    (travelBundleUnitsInProgress / EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize) * 100;
  const travelBundleHeadline = isTravelBundlePromotion
    ? eightMlBundleCount > 0
      ? `${eightMlBundleCount} bundle${eightMlBundleCount === 1 ? "" : "s"} unlocked`
      : "Build the RM99 travel bundle"
    : null;
  const travelBundleMessage = isTravelBundlePromotion
    ? eightMlEligibleUnits === 0
      ? `Add any ${EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize} travel sizes to unlock ${promotionLabel} at ${formatCurrency(EIGHT_ML_EDP_BUNDLE_OFFER.bundlePriceCents)}.`
      : eightMlUnitsUntilNextBundle === 0
        ? `This set is complete at ${formatCurrency(EIGHT_ML_EDP_BUNDLE_OFFER.bundlePriceCents)}. Add more travel sizes to start the next bundle.`
        : `Add ${eightMlUnitsUntilNextBundle} more travel size${eightMlUnitsUntilNextBundle === 1 ? "" : "s"} to unlock the next ${formatCurrency(EIGHT_ML_EDP_BUNDLE_OFFER.bundlePriceCents)} bundle.`
    : null;

  function getStockToneClasses(tone: ReturnType<typeof getStockStatus>["tone"]) {
    switch (tone) {
      case "healthy":
        return {
          badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        };
      case "low":
        return {
          badge: "border-amber-200 bg-amber-50 text-amber-700",
        };
      case "critical":
      case "soldOut":
        return {
          badge: "border-rose-200 bg-rose-50 text-rose-700",
        };
    }
  }

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
              const projectedRemainingStock = Math.max(item.stock - item.quantity, 0);
              const unitLabel = item.sizeMl === 8 ? "Travel Pack · 8mL" : `${item.sizeMl}mL`;
              const stockStatus = getStockStatus(projectedRemainingStock, item.reorderLevel);
              const stockTone = getStockToneClasses(stockStatus.tone);

              return (
                <div key={item.id} className="tara-card-soft rounded-[24px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {unitLabel} · {item.sku}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] tabular-nums",
                            stockTone.badge,
                          )}
                        >
                          After sale: {stockStatus.detail}
                        </span>
                        <span className="text-xs font-medium text-[var(--muted)]">
                          {stockStatus.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted)]">
                        {formatCurrency(item.priceCents)} each
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

        {isTravelBundlePromotion ? (
          <div className="rounded-[24px] border border-[rgba(202,158,91,0.32)] bg-[linear-gradient(135deg,rgba(202,158,91,0.14),rgba(247,243,235,0.92))] p-4 shadow-[0_18px_50px_rgba(202,158,91,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--brand-gold)] uppercase">
                  Travel bundle tracker
                </p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">
                  {travelBundleHeadline}
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                  {travelBundleMessage}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(202,158,91,0.28)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-midnight)]">
                {travelBundleUnitsInProgress}/{EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize}
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-gold),var(--brand-amber))] transition-[width]"
                style={{ width: `${Math.max(travelBundleProgressPercent, travelBundleProgressPercent > 0 ? 12 : 0)}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(26,51,74,0.08)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                Travel sizes in cart: <span className="tabular-nums font-semibold text-foreground">{eightMlEligibleUnits}</span>
              </span>
              <span className="rounded-full border border-[rgba(26,51,74,0.08)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                RM99 bundles: <span className="tabular-nums font-semibold text-foreground">{eightMlBundleCount}</span>
              </span>
            </div>
          </div>
        ) : null}

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

        {freeGiftUnitsRemaining > 0 ? (
          <div className="tara-card-soft rounded-[22px] p-4 md:rounded-[24px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Travel size choice
                </p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">
                  Pick the complimentary 8mL variant
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Add {freeGiftUnitsRemaining} more 8mL travel size
                  {freeGiftUnitsRemaining === 1 ? "" : "s"} from the customer&apos;s preferred scent.
                </p>
              </div>
              <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                Choice needed
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {travelGiftOptions.map((product) => {
                const quantityInCart = cartQuantityByProductId.get(product.id) ?? 0;
                const soldOut = quantityInCart >= product.stock;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onAddTravelGift(product)}
                    disabled={soldOut}
                    className={cn(
                      "rounded-[20px] border px-4 py-3 text-left transition",
                      soldOut
                        ? "cursor-not-allowed border-[var(--line)] bg-[rgba(255,251,246,0.72)] opacity-60"
                        : "border-[var(--line)] bg-white/80 hover:border-[rgba(202,158,91,0.42)] hover:bg-white",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--brand-gold)]">
                          {product.collection} · 8mL travel size
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          soldOut
                            ? "bg-[rgba(247,243,235,0.92)] text-[var(--muted-strong)]"
                            : "bg-[rgba(26,51,74,0.08)] text-[var(--brand-midnight)]",
                        )}
                      >
                        {soldOut ? "Maxed" : "Add gift"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {product.stock - quantityInCart} available on hand
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

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
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                Social handle
              </label>
              <input
                value={customer.email ?? ""}
                onChange={(event) => onCustomerFieldChange("email", event.target.value)}
                placeholder="@instagram or @tiktok"
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
              {offerCallout && !isTravelBundlePromotion ? (
                <p className="mt-2 text-xs leading-6 text-[rgba(247,243,235,0.72)]">{offerCallout}</p>
              ) : null}
            </div>
          ) : null}
          {freeGiftEligibleUnits > 0 ? (
            <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[rgba(247,243,235,0.72)]">
                  {promotionId === "SUNWAY_STUDENT"
                    ? "Student travel gifts"
                    : "Complimentary travel gifts"}
                </span>
                <span className="font-semibold">
                  {freeGiftClaimedUnits}/{freeGiftEligibleUnits} claimed
                </span>
              </div>
              {freeGiftUnitsRemaining > 0 ? (
                <p className="mt-2 text-xs leading-6 text-[rgba(247,243,235,0.72)]">
                  Add {freeGiftUnitsRemaining} x 8mL travel size to the basket so the{" "}
                  {promotionId === "SUNWAY_STUDENT" ? "free student gift" : "complimentary gift"}{" "}
                  is captured in inventory.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-6 text-[rgba(247,243,235,0.72)]">
                  Every eligible {promotionId === "SUNWAY_STUDENT" ? "student freebie" : "complimentary travel gift"} is already in the basket and priced correctly.
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
