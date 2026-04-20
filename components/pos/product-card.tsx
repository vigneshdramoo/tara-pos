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
          background: `linear-gradient(145deg, ${product.accentHex}, #1d1916 80%)`,
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
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Notes</p>
        <p className="mt-2 text-sm leading-6 text-stone-700">{product.notes}</p>
        <p className="mt-2 text-sm text-stone-500">{product.mood}</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {product.sizeMl} ml bottle
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {formatCurrency(product.priceCents)}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-medium",
              soldOut ? "text-rose-600" : "text-stone-600",
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
              ? "cursor-not-allowed bg-stone-200 text-stone-400"
              : "bg-stone-950 text-stone-50 hover:-translate-y-0.5",
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add
        </button>
      </div>
    </article>
  );
}
