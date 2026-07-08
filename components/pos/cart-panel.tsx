"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BadgePercent,
  ChevronDown,
  QrCode,
  StickyNote,
  UserRound,
  X,
} from "lucide-react";
import {
  PUBLIC_MARKET_STOP04_OFFER,
  getCheckoutPromotionOptions,
  type CheckoutPromotionId,
  type CheckoutLinePricing,
  type PublicMarketStop04PackageBreakdown,
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
  voucherDiscountCents?: number;
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
  publicMarketStop04PackageBreakdown: PublicMarketStop04PackageBreakdown;
  offerHeadline: string | null;
  offerCallout: string | null;
  submitting: boolean;
  refreshing: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
  voucherSlot?: React.ReactNode;
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

function SectionToggle({
  icon: Icon,
  label,
  summary,
  open,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-12 w-full items-center justify-between gap-3 px-1 text-left"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.8} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {summary ? (
          <span className="truncate text-xs text-[var(--muted)]">{summary}</span>
        ) : null}
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-[var(--muted)] transition-transform",
          open ? "rotate-180" : "",
        )}
        strokeWidth={1.8}
      />
    </button>
  );
}

export function CartPanel({
  cart,
  travelGiftOptions,
  recentCustomers,
  notes,
  customer,
  subtotalCents,
  discountCents,
  voucherDiscountCents = 0,
  taxCents,
  totalCents,
  promotionId,
  promotionLabel,
  promotionDescription,
  cartLinePricing,
  eightMlBundleCount,
  eightMlEligibleUnits,
  freeGiftEligibleUnits,
  freeGiftClaimedUnits,
  freeGiftUnitsRemaining,
  publicMarketStop04PackageBreakdown,
  offerHeadline,
  offerCallout,
  submitting,
  refreshing,
  feedback,
  voucherSlot,
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
  const [promoOpen, setPromoOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const hasCustomerInput = Boolean(
    customer.name || customer.email || customer.phone || customer.notes,
  );

  // Keep the customer section open once it has content (e.g. after tapping
  // a recent customer chip while collapsed).
  const linePricingByProductId = new Map(
    cartLinePricing.map((linePricing) => [linePricing.productId, linePricing]),
  );
  const cartQuantityByProductId = new Map(cart.map((item) => [item.id, item.quantity]));
  const isStop04Promotion = promotionId === "PUBLIC_MARKET_STOP04";
  const stop04ProgressTarget =
    eightMlEligibleUnits < 3 ? 3 : eightMlEligibleUnits < 6 ? 6 : eightMlEligibleUnits;
  const stop04ProgressPercent = stop04ProgressTarget
    ? (Math.min(eightMlEligibleUnits, stop04ProgressTarget) / stop04ProgressTarget) * 100
    : 0;
  const stop04PackageSummary = PUBLIC_MARKET_STOP04_OFFER.packages
    .map((offerPackage) => ({
      ...offerPackage,
      count: publicMarketStop04PackageBreakdown[offerPackage.key],
    }))
    .filter((offerPackage) => offerPackage.count > 0);
  const checkoutPromotionOptions = getCheckoutPromotionOptions();

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
      className="tara-surface scroll-mt-24 flex flex-col gap-3 p-3 sm:p-4 md:p-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:gap-4 xl:p-6"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">Cart</p>
          <h3 className="mt-1 text-2xl font-semibold text-foreground md:text-3xl">Checkout</h3>
        </div>
        <p className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} items
        </p>
      </div>

      <div className="space-y-3 xl:scrollbar-hidden xl:flex-1 xl:overflow-y-auto xl:pr-1">
        {/* ------------------------------------------------ cart lines */}
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
                <div
                  key={item.id}
                  className="tara-card-soft rounded-[20px] p-3 sm:rounded-[24px] sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                        {unitLabel} · {formatCurrency(item.priceCents)} each
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.02em] tabular-nums",
                            stockTone.badge,
                          )}
                        >
                          After sale: {stockStatus.detail}
                        </span>
                      </div>
                      {linePricing?.promotionDetail ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold)]">
                          {linePricing.promotionDetail}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="tara-chip-default flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    >
                      <X className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDecrease(item.id)}
                        className="tara-button-secondary h-11 w-11 rounded-2xl text-xl"
                      >
                        –
                      </button>
                      <div className="tara-panel-dark flex h-11 min-w-12 items-center justify-center rounded-2xl px-3 text-sm font-semibold">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => onIncrease(item.id)}
                        className="tara-button-secondary h-11 w-11 rounded-2xl text-xl"
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
            <div className="rounded-[20px] border border-dashed border-[var(--line)] bg-[rgba(255,251,246,0.62)] px-4 py-6 text-center text-sm leading-7 text-[var(--muted)]">
              Tap any fragrance card to start a basket.
            </div>
          )}
        </div>

        {/* -------------------------------- contextual: Stop 04 tracker */}
        {isStop04Promotion ? (
          <div className="rounded-[20px] border border-[rgba(202,158,91,0.32)] bg-[linear-gradient(135deg,rgba(202,158,91,0.14),rgba(247,243,235,0.92))] p-3 sm:rounded-[24px] sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--brand-gold)] uppercase">
                  Scent Trail tracker
                </p>
                <h4 className="mt-1 text-base font-semibold text-foreground">{offerHeadline}</h4>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{offerCallout}</p>
              </div>
              <span className="rounded-full border border-[rgba(202,158,91,0.28)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-midnight)]">
                {`${eightMlEligibleUnits}/${stop04ProgressTarget || 3}`}
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-gold),var(--brand-amber))] transition-[width]"
                style={{
                  width: `${Math.max(stop04ProgressPercent, stop04ProgressPercent > 0 ? 12 : 0)}%`,
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(26,51,74,0.08)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                Travel sizes:{" "}
                <span className="tabular-nums font-semibold text-foreground">
                  {eightMlEligibleUnits}
                </span>
              </span>
              <span className="rounded-full border border-[rgba(26,51,74,0.08)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                Sets:{" "}
                <span className="tabular-nums font-semibold text-foreground">
                  {eightMlBundleCount}
                </span>
              </span>
              {stop04PackageSummary.map((offerPackage) => (
                <span
                  key={offerPackage.key}
                  className="rounded-full border border-[rgba(26,51,74,0.08)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]"
                >
                  {offerPackage.count} x {offerPackage.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* ------------------------------ contextual: free gift chooser */}
        {freeGiftUnitsRemaining > 0 ? (
          <div className="tara-card-soft rounded-[20px] p-3 sm:rounded-[24px] sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Travel size choice
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                  Add {freeGiftUnitsRemaining} complimentary 8mL travel size
                  {freeGiftUnitsRemaining === 1 ? "" : "s"} — customer&apos;s pick.
                </p>
              </div>
              <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                Choice needed
              </span>
            </div>

            <div className="mt-3 grid gap-2">
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
                      "flex items-center justify-between gap-3 rounded-[18px] border px-3 py-2.5 text-left transition",
                      soldOut
                        ? "cursor-not-allowed border-[var(--line)] bg-[rgba(255,251,246,0.72)] opacity-60"
                        : "border-[var(--line)] bg-white/80 hover:border-[rgba(202,158,91,0.42)] hover:bg-white",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {product.name}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {product.stock - quantityInCart} on hand
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                        soldOut
                          ? "bg-[rgba(247,243,235,0.92)] text-[var(--muted-strong)]"
                          : "bg-[rgba(26,51,74,0.08)] text-[var(--brand-midnight)]",
                      )}
                    >
                      {soldOut ? "Maxed" : "Add gift"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* --------------------------------------- discounts: promotion */}
        <div className="tara-card-soft rounded-[20px] px-3 py-1 sm:rounded-[24px] sm:px-4">
          <SectionToggle
            icon={BadgePercent}
            label="Promotion"
            summary={promotionLabel}
            open={promoOpen}
            onToggle={() => setPromoOpen((open) => !open)}
          />
          {promoOpen ? (
            <div className="grid gap-2 pb-3">
              <p className="px-1 text-sm leading-6 text-[var(--muted)]">{promotionDescription}</p>
              {checkoutPromotionOptions.map((option) => {
                const active = option.id === promotionId;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onPromotionChange(option.id);
                      setPromoOpen(false);
                    }}
                    className={cn(
                      "rounded-[18px] border px-3 py-2.5 text-left transition",
                      active
                        ? "border-[var(--brand-gold)] bg-[rgba(202,158,91,0.12)]"
                        : "border-[var(--line)] bg-white/70 hover:border-[rgba(202,158,91,0.42)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-gold)]">
                          {option.kicker}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{option.label}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-midnight)]">
                          {option.preview}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          active
                            ? "bg-[var(--brand-gold)] text-[var(--brand-onyx)]"
                            : "bg-[rgba(247,243,235,0.92)] text-[var(--muted-strong)]",
                        )}
                      >
                        {active ? "Selected" : "Use"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* ----------------------------------------- discounts: voucher */}
        {voucherSlot}

        {/* -------------------------------------------------- customer */}
        <div className="tara-card-soft rounded-[20px] px-3 py-1 sm:rounded-[24px] sm:px-4">
          <SectionToggle
            icon={UserRound}
            label="Customer"
            summary={hasCustomerInput ? customer.name || "details added" : "optional"}
            open={customerOpen}
            onToggle={() => setCustomerOpen((open) => !open)}
          />
          {customerOpen ? (
            <div className="grid gap-3 pb-3">
              {recentCustomers.length ? (
                <div className="flex flex-wrap gap-2">
                  {recentCustomers.map((recent) => (
                    <button
                      key={recent.id}
                      type="button"
                      onClick={() => onHydrateCustomer(recent)}
                      className="tara-button-secondary min-h-10 rounded-2xl px-3 text-sm font-medium transition"
                    >
                      {recent.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <input
                value={customer.name ?? ""}
                onChange={(event) => onCustomerFieldChange("name", event.target.value)}
                placeholder="Name"
                className="tara-input min-h-11 w-full rounded-2xl px-3 text-base outline-none transition"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={customer.email ?? ""}
                  onChange={(event) => onCustomerFieldChange("email", event.target.value)}
                  placeholder="@instagram or @tiktok"
                  className="tara-input min-h-11 w-full rounded-2xl px-3 text-base outline-none transition"
                />
                <input
                  value={customer.phone ?? ""}
                  onChange={(event) => onCustomerFieldChange("phone", event.target.value)}
                  placeholder="+60..."
                  className="tara-input min-h-11 w-full rounded-2xl px-3 text-base outline-none transition"
                />
              </div>
              <textarea
                value={customer.notes ?? ""}
                onChange={(event) => onCustomerFieldChange("notes", event.target.value)}
                rows={2}
                placeholder="Preferences, gifting, follow-up"
                className="tara-input w-full rounded-2xl px-4 py-3 outline-none transition"
              />
            </div>
          ) : null}
        </div>

        {/* ------------------------------------------------ order note */}
        <div className="tara-card-soft rounded-[20px] px-3 py-1 sm:rounded-[24px] sm:px-4">
          <SectionToggle
            icon={StickyNote}
            label="Order note"
            summary={notes ? "note added" : "optional"}
            open={noteOpen}
            onToggle={() => setNoteOpen((open) => !open)}
          />
          {noteOpen ? (
            <div className="pb-3">
              <textarea
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                rows={2}
                placeholder="Gift wrap, tester request, in-store follow up"
                className="tara-input w-full rounded-2xl px-4 py-3 outline-none transition"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* --------------------------- sticky footer: totals + pay + QR */}
      <div className="tara-panel-dark sticky bottom-2 z-10 rounded-[20px] p-3 shadow-[0_18px_50px_rgba(20,16,32,0.35)] sm:rounded-[24px] sm:p-4 md:p-5 xl:static xl:shrink-0 xl:shadow-none">
        <div className="space-y-2 text-sm">
          {offerHeadline || freeGiftEligibleUnits > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[rgba(247,243,235,0.72)]">
              {offerHeadline ? (
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                  {offerHeadline}
                </span>
              ) : null}
              {freeGiftEligibleUnits > 0 ? (
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                  Gifts {freeGiftClaimedUnits}/{freeGiftEligibleUnits}
                </span>
              ) : null}
            </div>
          ) : null}
          {discountCents > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[rgba(247,243,235,0.72)]">Offer savings</span>
              <span>-{formatCurrency(discountCents)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-[rgba(247,243,235,0.72)]">Subtotal</span>
            <span>{formatCurrency(subtotalCents)}</span>
          </div>
          {voucherDiscountCents > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[rgba(247,243,235,0.72)]">Voucher</span>
              <span>-{formatCurrency(voucherDiscountCents)}</span>
            </div>
          ) : null}
          {taxCents > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[rgba(247,243,235,0.72)]">Tax</span>
              <span>{formatCurrency(taxCents)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totalCents)}</span>
          </div>
        </div>

        {feedback ? (
          <div
            className={cn(
              "mt-3 rounded-[18px] px-4 py-3 text-sm leading-6",
              feedback.type === "success" ? "tara-alert-success" : "tara-alert-danger",
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 text-sm font-semibold text-[rgba(247,243,235,0.92)] transition hover:bg-white/12"
          >
            <QrCode className="h-4 w-4" strokeWidth={1.8} />
            DuitNow
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={disabled}
            className={cn(
              "min-h-12 flex-1 rounded-2xl text-sm font-semibold transition",
              disabled ? "cursor-not-allowed tara-button-inverse opacity-50" : "tara-button-primary",
            )}
          >
            {submitting
              ? "Processing sale..."
              : refreshing
                ? "Refreshing floor..."
                : "Complete checkout"}
          </button>
        </div>
      </div>

      {/* ------------------------------------------- DuitNow QR modal */}
      {qrOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/60 p-4"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-900">
                Scan to pay · {formatCurrency(totalCents)}
              </p>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-stone-600"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <Image
              src="/payments/tara-duitnow-qr.png"
              alt="TARA Scents DuitNow QR code"
              width={1071}
              height={1664}
              className="mx-auto h-auto max-h-[70vh] w-full object-contain"
              priority
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
