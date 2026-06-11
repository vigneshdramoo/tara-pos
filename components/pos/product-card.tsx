"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
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

  const selectedOption =
    product.options.find((option) => option.product.id === selectedProductId) ?? product.options[0];

  if (!selectedOption) {
    return null;
  }

  const selectedProduct = selectedOption.product;
  const soldOut = selectedProduct.stock <= 0;
  const selectedFormatLabel =
    selectedOption.label === "Travel Pack"
      ? `Travel Pack · ${selectedProduct.sizeMl}mL`
      : `${selectedProduct.sizeMl}mL bottle`;

  return (
    <article className="tara-surface-strong flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
      <div
        className="relative overflow-hidden rounded-[22px] p-4 text-white sm:rounded-[28px] sm:p-5"
        style={{
          background: `linear-gradient(145deg, ${product.accentHex}, var(--brand-midnight) 78%)`,
        }}
      >
        <h3 className="font-display text-3xl leading-none sm:text-4xl">
          {product.name}
        </h3>
        {(selectedProduct.imageUrl ?? product.imageUrl) ? (
          <div className="relative mt-4 aspect-[5/4] overflow-hidden rounded-[20px] border border-white/15 bg-white/8 shadow-[0_30px_90px_rgba(10,10,10,0.28)] sm:mt-5 sm:aspect-[4/5] sm:rounded-[24px]">
            <Image
              src={selectedProduct.imageUrl ?? product.imageUrl ?? ""}
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
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Choose format</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {product.options.map((option) => {
            const optionProduct = option.product;
            const active = optionProduct.id === selectedProduct.id;
            const optionSoldOut = optionProduct.stock <= 0;

            return (
              <button
                key={optionProduct.id}
                type="button"
                onClick={() => setSelectedProductId(optionProduct.id)}
                className={cn(
                  "touch-target rounded-[20px] border px-4 py-3 text-left transition",
                  active
                    ? "border-[var(--brand-gold)] bg-[rgba(202,158,91,0.12)] shadow-[0_12px_30px_rgba(202,158,91,0.12)]"
                    : "border-[var(--line)] bg-white/70 hover:border-[rgba(202,158,91,0.42)]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="text-sm font-semibold text-[var(--brand-midnight)]">
                    {formatCurrency(optionProduct.priceCents)}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {optionSoldOut ? "Sold out" : `${optionProduct.stock} on hand`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(selectedProduct.priceCents)}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-medium",
              soldOut ? "text-[var(--brand-amber)]" : "text-[var(--muted)]",
            )}
          >
            {soldOut ? "Sold out" : `${selectedFormatLabel} · ${selectedProduct.stock} on hand`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(selectedProduct)}
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
