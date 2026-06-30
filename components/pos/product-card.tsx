"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import type { ProductCardData, ProductFamilyCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  onAdd,
}: {
  product: ProductFamilyCardData;
  onAdd: (product: ProductCardData) => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const selectedOption = product.options.find((option) => option.product.id === selectedProductId) ?? null;
  const selectedProduct = selectedOption?.product ?? null;
  const soldOut = selectedProduct ? selectedProduct.stock <= 0 : false;

  function getStockToneClasses(tone: ReturnType<typeof getStockStatus>["tone"]) {
    switch (tone) {
      case "healthy":
        return {
          badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
          bar: "bg-emerald-500",
        };
      case "low":
        return {
          badge: "border-amber-200 bg-amber-50 text-amber-700",
          bar: "bg-amber-500",
        };
      case "critical":
      case "soldOut":
        return {
          badge: "border-rose-200 bg-rose-50 text-rose-700",
          bar: "bg-rose-500",
        };
    }
  }

  const actionLabel = selectedOption
    ? `Add ${selectedOption.label} · ${formatCurrency(selectedOption.product.priceCents)}`
    : "Choose a format to add";

  return (
    <article className="tara-surface-strong flex flex-col gap-3 p-3 sm:gap-5 sm:p-5">
      <div
        className="relative min-h-[112px] overflow-hidden rounded-[20px] p-3 pr-28 text-white sm:min-h-0 sm:rounded-[28px] sm:p-5"
        style={{
          background: `linear-gradient(145deg, ${product.accentHex}, var(--brand-midnight) 78%)`,
        }}
      >
        <h3 className="font-display text-[2rem] leading-none sm:text-4xl">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/78 sm:hidden">
          {product.mood}
        </p>
        {(selectedProduct?.imageUrl ?? product.imageUrl) ? (
          <div className="absolute right-3 top-3 h-[88px] w-[88px] overflow-hidden rounded-[18px] border border-white/15 bg-white/8 shadow-[0_18px_48px_rgba(10,10,10,0.24)] sm:relative sm:right-auto sm:top-auto sm:mt-5 sm:aspect-[4/5] sm:h-auto sm:w-auto sm:rounded-[24px] sm:shadow-[0_30px_90px_rgba(10,10,10,0.28)]">
            <Image
              src={selectedProduct?.imageUrl ?? product.imageUrl ?? ""}
              alt={`${product.name} fragrance bottle`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1536px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold)] sm:text-sm sm:normal-case sm:tracking-normal sm:text-[var(--brand-midnight)]">
          Choose format
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3">
          {product.options.map((option) => {
            const optionProduct = option.product;
            const active = optionProduct.id === selectedProduct?.id;
            const stockStatus = getStockStatus(optionProduct.stock, optionProduct.reorderLevel);
            const stockTone = getStockToneClasses(stockStatus.tone);

            return (
              <button
                key={optionProduct.id}
                type="button"
                onClick={() => setSelectedProductId(optionProduct.id)}
                aria-pressed={active}
                className={cn(
                  "min-h-[74px] rounded-[18px] border px-3 py-2 text-left transition sm:min-h-[88px] sm:rounded-[20px] sm:px-4 sm:py-3",
                  active
                    ? "border-[var(--brand-gold)] bg-[rgba(202,158,91,0.12)] shadow-[0_12px_30px_rgba(202,158,91,0.12)]"
                    : "border-[var(--line)] bg-white/70 hover:border-[rgba(202,158,91,0.42)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                    {active ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)] sm:h-5 sm:w-5" strokeWidth={2} />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)] sm:h-5 sm:w-5" strokeWidth={1.9} />
                    )}
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                      <span className="mt-0.5 block text-base font-semibold text-[var(--brand-midnight)] sm:mt-1 sm:text-lg">
                        {formatCurrency(optionProduct.priceCents)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "hidden rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] tabular-nums sm:inline-flex",
                      stockTone.badge,
                    )}
                  >
                    {stockStatus.label}
                  </span>
                </div>
                <div className="mt-2 sm:mt-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <span className="hidden sm:inline">
                      {optionProduct.stock <= 0 ? "Unavailable" : "Inventory"}
                    </span>
                    <span className="tabular-nums">{stockStatus.detail}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(26,51,74,0.08)] sm:mt-2 sm:h-2">
                    <div
                      className={cn("h-full rounded-full transition-[width]", stockTone.bar)}
                      style={{ width: `${Math.max(stockStatus.progress, stockStatus.progress > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => {
            if (selectedProduct) {
              onAdd(selectedProduct);
            }
          }}
          disabled={!selectedProduct || soldOut}
          className={cn(
            "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition sm:min-h-[56px] sm:px-5 sm:text-base",
            !selectedProduct || soldOut
              ? "cursor-not-allowed border border-[var(--line)] bg-[rgba(247,243,235,0.92)] text-[var(--muted)]"
              : "tara-button-primary",
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {soldOut && selectedOption ? `${selectedOption.label} sold out` : actionLabel}
        </button>
      </div>
    </article>
  );
}
