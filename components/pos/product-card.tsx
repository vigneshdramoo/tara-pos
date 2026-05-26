"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  onAdd,
}: {
  product: ProductCardData;
  onAdd: (product: ProductCardData) => void;
}) {
  const soldOut = product.stock <= 0;

  return (
    <article className="tara-surface-strong flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
      <div
        className="relative overflow-hidden rounded-[22px] p-4 text-white sm:rounded-[28px] sm:p-5"
        style={{
          background: `linear-gradient(145deg, ${product.accentHex}, var(--brand-midnight) 78%)`,
        }}
      >
        <div className="absolute right-3 top-3 max-w-[58%] truncate rounded-full border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80 sm:right-4 sm:top-4 sm:max-w-none sm:px-3 sm:text-[11px] sm:tracking-[0.22em]">
          {product.collection}
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-white/70">{product.sku}</p>
        <h3 className="mt-3 font-display text-3xl leading-none sm:mt-4 sm:text-4xl">
          {product.name}
        </h3>
        <p className="mt-3 max-w-[18rem] text-sm leading-6 text-white/80 sm:mt-4">
          {product.description}
        </p>
        {product.imageUrl ? (
          <div className="relative mt-4 aspect-[5/4] overflow-hidden rounded-[20px] border border-white/15 bg-white/8 shadow-[0_30px_90px_rgba(10,10,10,0.28)] sm:mt-5 sm:aspect-[4/5] sm:rounded-[24px]">
            <Image
              src={product.imageUrl}
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
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Notes</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{product.notes}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{product.mood}</p>
      </div>

      <div className="mt-auto flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-strong)]">
            {product.sizeMl} ml bottle
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(product.priceCents)}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-medium",
              soldOut ? "text-[var(--brand-amber)]" : "text-[var(--muted)]",
            )}
          >
            {soldOut ? "Sold out" : `${product.stock} on hand`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={soldOut}
          className={cn(
            "touch-target inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition sm:w-auto",
            soldOut
              ? "cursor-not-allowed tara-button-secondary opacity-60"
              : "tara-button-primary",
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add
        </button>
      </div>
    </article>
  );
}
