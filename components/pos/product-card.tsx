"use client";

import { Plus } from "lucide-react";
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
    <article className="tara-surface-strong flex flex-col gap-5 p-5">
      <div
        className="relative overflow-hidden rounded-[28px] p-5 text-white"
        style={{
          background: `linear-gradient(145deg, ${product.accentHex}, var(--brand-midnight) 78%)`,
        }}
      >
        <div className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/80">
          {product.collection}
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-white/70">{product.sku}</p>
        <h3 className="mt-4 font-display text-4xl leading-none">{product.name}</h3>
        <p className="mt-4 max-w-[18rem] text-sm leading-6 text-white/80">{product.description}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Notes</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{product.notes}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{product.mood}</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4">
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
            "touch-target inline-flex items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
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
