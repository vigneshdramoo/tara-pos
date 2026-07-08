"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import type { ProductCardData, ProductFamilyCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  onAdd,
  cartQuantities,
}: {
  product: ProductFamilyCardData;
  onAdd: (product: ProductCardData) => void;
  cartQuantities?: Map<string, number>;
}) {
  function getStockDotClass(tone: ReturnType<typeof getStockStatus>["tone"]) {
    switch (tone) {
      case "healthy":
        return "bg-emerald-500";
      case "low":
        return "bg-amber-500";
      case "critical":
      case "soldOut":
        return "bg-rose-500";
    }
  }

  return (
    <article className="tara-surface-strong flex flex-col gap-2.5 p-3 sm:p-4">
      {/* header band: identity at a glance */}
      <div
        className="relative flex min-h-[76px] items-center justify-between gap-3 overflow-hidden rounded-[18px] p-3 text-white sm:rounded-[20px]"
        style={{
          background: `linear-gradient(145deg, ${product.accentHex}, var(--brand-midnight) 82%)`,
        }}
      >
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-none sm:text-[1.7rem]">{product.name}</h3>
          <p className="mt-1.5 line-clamp-1 text-xs leading-4 text-white/72">{product.mood}</p>
        </div>
        {product.imageUrl ? (
          <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[14px] border border-white/15 bg-white/8">
            <Image
              src={product.imageUrl}
              alt={`${product.name} fragrance bottle`}
              fill
              sizes="60px"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>

      {/* one-tap format rows */}
      <div className="grid gap-2">
        {product.options.map((option) => {
          const optionProduct = option.product;
          const inCart = cartQuantities?.get(optionProduct.id) ?? 0;
          const remaining = optionProduct.stock - inCart;
          const soldOut = remaining <= 0;
          const stockStatus = getStockStatus(optionProduct.stock, optionProduct.reorderLevel);

          return (
            <button
              key={optionProduct.id}
              type="button"
              onClick={() => onAdd(optionProduct)}
              disabled={soldOut}
              className={cn(
                "flex min-h-12 w-full items-center justify-between gap-3 rounded-[16px] border px-3 py-2 text-left transition active:scale-[0.99]",
                soldOut
                  ? "cursor-not-allowed border-[var(--line)] bg-[rgba(247,243,235,0.92)] opacity-60"
                  : inCart > 0
                    ? "border-[var(--brand-gold)] bg-[rgba(202,158,91,0.10)] hover:bg-[rgba(202,158,91,0.16)]"
                    : "border-[var(--line)] bg-white/70 hover:border-[rgba(202,158,91,0.42)] hover:bg-white",
              )}
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="whitespace-nowrap text-sm font-semibold text-foreground">{option.label}</span>
                <span className="text-sm font-semibold text-[var(--brand-midnight)]">
                  {formatCurrency(optionProduct.priceCents)}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2.5">
                {inCart > 0 ? (
                  <span className="rounded-full bg-[var(--brand-gold)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-onyx)] tabular-nums">
                    ×{inCart}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <span
                    className={cn("h-2 w-2 rounded-full", getStockDotClass(stockStatus.tone))}
                  />
                  <span className="tabular-nums">
                    {soldOut ? "Sold out" : `${remaining} left`}
                  </span>
                </span>
                {!soldOut ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(26,51,74,0.08)] text-[var(--brand-midnight)]">
                    <Plus className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
