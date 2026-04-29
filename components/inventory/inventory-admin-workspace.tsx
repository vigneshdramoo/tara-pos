"use client";

import { useDeferredValue, useState, useTransition } from "react";
import {
  Boxes,
  CircleSlash,
  PackagePlus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCurrency, formatFullDateTime, formatInteger } from "@/lib/format";
import type {
  InventoryAdminProduct,
  InventoryMovementInsight,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductFormState = {
  name: string;
  slug: string;
  sku: string;
  collection: string;
  description: string;
  notes: string;
  mood: string;
  sizeMl: string;
  price: string;
  reorderLevel: string;
  accentHex: string;
  active: boolean;
  initialStock: string;
};

function createBlankProductForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    sku: "",
    collection: "Signature",
    description: "",
    notes: "",
    mood: "",
    sizeMl: "50",
    price: "159.00",
    reorderLevel: "12",
    accentHex: "#CA9E5B",
    active: true,
    initialStock: "0",
  };
}

function productToFormState(product: InventoryAdminProduct): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    collection: product.collection,
    description: product.description,
    notes: product.notes,
    mood: product.mood,
    sizeMl: String(product.sizeMl),
    price: (product.priceCents / 100).toFixed(2),
    reorderLevel: String(product.reorderLevel),
    accentHex: product.accentHex,
    active: product.active,
    initialStock: "0",
  };
}

function formatSignedDelta(quantityDelta: number) {
  const abs = Math.abs(quantityDelta);
  return `${quantityDelta > 0 ? "+" : "-"}${formatInteger(abs)}`;
}

function movementTone(type: InventoryMovementInsight["type"], quantityDelta: number) {
  if (type === "RESTOCK" || quantityDelta > 0) {
    return "accent" as const;
  }

  if (type === "SALE" || quantityDelta < 0) {
    return "danger" as const;
  }

  return "default" as const;
}

export function InventoryAdminWorkspace({
  products,
  recentMovements,
}: {
  products: InventoryAdminProduct[];
  recentMovements: InventoryMovementInsight[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "low" | "inactive">("all");
  const [editorMode, setEditorMode] = useState<"edit" | "create">("edit");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id ?? null);
  const [form, setForm] = useState<ProductFormState>(() =>
    products[0] ? productToFormState(products[0]) : createBlankProductForm(),
  );
  const [restockQuantity, setRestockQuantity] = useState("6");
  const [restockNote, setRestockNote] = useState("");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("-1");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [productFeedback, setProductFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [movementFeedback, setMovementFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingMovement, setSavingMovement] = useState(false);
  const [, startRefreshTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const resolvedSelectedProductId = selectedProductId ?? products[0]?.id ?? null;

  const selectedProduct =
    editorMode === "edit"
      ? products.find((product) => product.id === resolvedSelectedProductId) ?? null
      : null;

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const haystack =
      `${product.name} ${product.sku} ${product.collection} ${product.notes} ${product.mood}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesView =
      view === "all"
        ? true
        : view === "low"
          ? product.stock <= product.reorderLevel
          : !product.active;

    return matchesQuery && matchesView;
  });

  function beginCreateMode() {
    setEditorMode("create");
    setProductFeedback(null);
    setForm(createBlankProductForm());
  }

  function beginEditMode(productId: string) {
    setEditorMode("edit");
    setSelectedProductId(productId);
    setProductFeedback(null);
    const product = products.find((candidate) => candidate.id === productId);
    if (product) {
      setForm(productToFormState(product));
    }
  }

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProduct(true);
    setProductFeedback(null);

    try {
      const endpoint =
        editorMode === "create"
          ? "/api/inventory/products"
          : `/api/inventory/products/${selectedProductId}`;
      const method = editorMode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            productId?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Inventory save failed.");
      }

      if (payload?.productId) {
        setSelectedProductId(payload.productId);
        setEditorMode("edit");
      }

      setProductFeedback({
        type: "success",
        message:
          payload?.message ??
          (editorMode === "create" ? "Product created successfully." : "Product updated successfully."),
      });

      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setProductFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Inventory save failed.",
      });
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleMovementSubmit(
    action: "RESTOCK" | "ADJUSTMENT",
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedProduct) {
      setMovementFeedback({
        type: "error",
        message: "Select a product before applying stock changes.",
      });
      return;
    }

    setSavingMovement(true);
    setMovementFeedback(null);

    try {
      const quantity = action === "RESTOCK" ? restockQuantity : adjustmentQuantity;
      const note = action === "RESTOCK" ? restockNote : adjustmentNote;
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          action,
          quantity,
          note,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Stock update failed.");
      }

      if (action === "RESTOCK") {
        setRestockQuantity("6");
        setRestockNote("");
      } else {
        setAdjustmentQuantity("-1");
        setAdjustmentNote("");
      }

      setMovementFeedback({
        type: "success",
        message: payload?.message ?? "Stock updated successfully.",
      });

      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMovementFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Stock update failed.",
      });
    } finally {
      setSavingMovement(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <div className="grid gap-4">
        <Surface className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                Product library
              </p>
              <h3 className="mt-2 font-display text-4xl text-foreground">Catalog and stock</h3>
            </div>

            <button
              type="button"
              onClick={beginCreateMode}
              className="tara-button-primary touch-target inline-flex items-center justify-center gap-2 rounded-[22px] px-5 text-sm font-medium"
            >
              <PackagePlus className="h-4 w-4" strokeWidth={1.8} />
              Create product
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by product, SKU, note, or collection"
                className="tara-input touch-target w-full rounded-[24px] pl-12 pr-4 text-base outline-none"
              />
            </div>

            <div className="scrollbar-hidden flex items-center gap-2 overflow-x-auto">
              {[
                { value: "all", label: "All" },
                { value: "low", label: "Low stock" },
                { value: "inactive", label: "Inactive" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value as "all" | "low" | "inactive")}
                  className={cn(
                    "touch-target rounded-2xl px-4 text-sm font-semibold whitespace-nowrap transition",
                    view === option.value
                      ? "tara-panel-dark"
                      : "tara-button-secondary",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {filteredProducts.length ? (
              filteredProducts.map((product) => {
                const active = editorMode === "edit" && resolvedSelectedProductId === product.id;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => beginEditMode(product.id)}
                    className={cn(
                      "w-full rounded-[26px] border px-5 py-4 text-left transition",
                      active
                        ? "border-[var(--brand-gold)] bg-[rgba(202,158,91,0.08)] shadow-[0_20px_50px_rgba(202,158,91,0.16)]"
                        : "border-[var(--line)] bg-white/72 hover:border-[rgba(202,158,91,0.36)]",
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                          {product.collection}
                        </p>
                        <h4 className="mt-2 text-xl font-semibold text-[var(--brand-midnight)]">
                          {product.name}
                        </h4>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {product.sku} · {product.sizeMl} ml · {formatCurrency(product.priceCents)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!product.active ? <Pill tone="danger">Inactive</Pill> : null}
                        {product.stock <= product.reorderLevel ? (
                          <Pill tone="accent">Low stock</Pill>
                        ) : (
                          <Pill>Healthy stock</Pill>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[20px] bg-[var(--surface-soft)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          On hand
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {formatInteger(product.stock)}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[var(--surface-soft)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Reorder at
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {formatInteger(product.reorderLevel)}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-[var(--surface-soft)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Updated
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatFullDateTime(product.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 px-5 py-8 text-sm leading-7 text-[var(--muted)]">
                No products match the current search or filter.
              </div>
            )}
          </div>
        </Surface>

        <Surface className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                Recent movements
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-[var(--brand-midnight)]">
                Stock activity feed
              </h3>
            </div>
          </div>

          <div className="grid gap-3">
            {recentMovements.length ? (
              recentMovements.map((movement) => (
                <article
                  key={movement.id}
                  className="rounded-[22px] border border-[var(--line)] bg-white/72 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{movement.productName}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {movement.note ?? movement.orderNumber ?? "Inventory activity"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={movementTone(movement.type, movement.quantityDelta)}>
                        {movement.type.toLowerCase()}
                      </Pill>
                      <span className="text-sm font-semibold text-[var(--brand-midnight)]">
                        {formatSignedDelta(movement.quantityDelta)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {formatFullDateTime(movement.createdAt)}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 px-5 py-8 text-sm leading-7 text-[var(--muted)]">
                Inventory movement history will appear here once stock actions begin.
              </div>
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-4">
        <Surface className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                {editorMode === "create" ? "New product" : "Edit product"}
              </p>
              <h3 className="mt-2 font-display text-4xl text-foreground">
                {editorMode === "create"
                  ? "Add to the catalog"
                  : selectedProduct?.name ?? "Choose a product"}
              </h3>
            </div>

            {editorMode === "create" && products.length ? (
              <button
                type="button"
                onClick={() => beginEditMode(resolvedSelectedProductId ?? products[0].id)}
                className="tara-button-secondary touch-target rounded-[22px] px-5 text-sm font-medium"
              >
                Back to editing
              </button>
            ) : null}
          </div>

          <form className="grid gap-4" onSubmit={handleProductSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Product name
                </span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  SKU
                </span>
                <input
                  value={form.sku}
                  onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))}
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Slug
                </span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="aureya"
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Collection
                </span>
                <input
                  value={form.collection}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, collection: event.target.value }))
                  }
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Bottle size (ml)
                </span>
                <input
                  value={form.sizeMl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sizeMl: event.target.value }))
                  }
                  inputMode="numeric"
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Price (MYR)
                </span>
                <input
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  inputMode="decimal"
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Reorder level
                </span>
                <input
                  value={form.reorderLevel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, reorderLevel: event.target.value }))
                  }
                  inputMode="numeric"
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Accent colour
                </span>
                <input
                  value={form.accentHex}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, accentHex: event.target.value.toUpperCase() }))
                  }
                  placeholder="#CA9E5B"
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
            </div>

            {editorMode === "create" ? (
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Opening stock
                </span>
                <input
                  value={form.initialStock}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, initialStock: event.target.value }))
                  }
                  inputMode="numeric"
                  className="tara-input touch-target rounded-[20px] px-4 outline-none"
                />
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                className="tara-input rounded-[20px] px-4 py-4 outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={3}
                  className="tara-input rounded-[20px] px-4 py-4 outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  Mood
                </span>
                <textarea
                  value={form.mood}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, mood: event.target.value }))
                  }
                  rows={3}
                  className="tara-input rounded-[20px] px-4 py-4 outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, active: true }))}
                className={cn(
                  "touch-target rounded-2xl px-4 text-sm font-semibold transition",
                  form.active ? "tara-panel-dark" : "tara-button-secondary",
                )}
              >
                Live on selling floor
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, active: false }))}
                className={cn(
                  "touch-target rounded-2xl px-4 text-sm font-semibold transition",
                  !form.active ? "tara-panel-dark" : "tara-button-secondary",
                )}
              >
                Archive from POS
              </button>
            </div>

            {productFeedback ? (
              <p
                className={cn(
                  "rounded-[18px] px-4 py-3 text-sm",
                  productFeedback.type === "success" ? "tara-alert-success" : "tara-alert-danger",
                )}
              >
                {productFeedback.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={savingProduct}
              className="tara-button-primary touch-target rounded-[22px] px-5 text-base font-medium disabled:cursor-not-allowed"
            >
              {savingProduct
                ? editorMode === "create"
                  ? "Creating product..."
                  : "Saving changes..."
                : editorMode === "create"
                  ? "Create product"
                  : "Save product changes"}
            </button>
          </form>
        </Surface>

        <Surface className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
              <Boxes className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                Stock actions
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-[var(--brand-midnight)]">
                Restock or adjust
              </h3>
            </div>
          </div>

          {selectedProduct ? (
            <>
              <div className="rounded-[24px] bg-[var(--surface-soft)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                  Selected product
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-foreground">{selectedProduct.name}</h4>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {selectedProduct.sku} · {selectedProduct.collection}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={selectedProduct.stock <= selectedProduct.reorderLevel ? "accent" : "default"}>
                      {selectedProduct.stock} on hand
                    </Pill>
                    {!selectedProduct.active ? <Pill tone="danger">Inactive</Pill> : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <form className="grid gap-3" onSubmit={(event) => handleMovementSubmit("RESTOCK", event)}>
                  <div className="flex items-center gap-2">
                    <PackagePlus className="h-4 w-4 text-[var(--brand-amber)]" strokeWidth={1.8} />
                    <p className="text-sm font-semibold text-foreground">Restock</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <input
                      value={restockQuantity}
                      onChange={(event) => setRestockQuantity(event.target.value)}
                      inputMode="numeric"
                      className="tara-input touch-target rounded-[20px] px-4 outline-none"
                    />
                    <input
                      value={restockNote}
                      onChange={(event) => setRestockNote(event.target.value)}
                      placeholder="Optional note, supplier, or batch"
                      className="tara-input touch-target rounded-[20px] px-4 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingMovement}
                    className="tara-button-secondary touch-target rounded-[22px] px-5 text-sm font-medium"
                  >
                    Add stock
                  </button>
                </form>

                <form className="grid gap-3" onSubmit={(event) => handleMovementSubmit("ADJUSTMENT", event)}>
                  <div className="flex items-center gap-2">
                    <CircleSlash className="h-4 w-4 text-[var(--brand-purple)]" strokeWidth={1.8} />
                    <p className="text-sm font-semibold text-foreground">Manual adjustment</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <input
                      value={adjustmentQuantity}
                      onChange={(event) => setAdjustmentQuantity(event.target.value)}
                      inputMode="numeric"
                      placeholder="-1 or +3"
                      className="tara-input touch-target rounded-[20px] px-4 outline-none"
                    />
                    <input
                      value={adjustmentNote}
                      onChange={(event) => setAdjustmentNote(event.target.value)}
                      placeholder="Reason for the adjustment"
                      className="tara-input touch-target rounded-[20px] px-4 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingMovement}
                    className="tara-button-secondary touch-target rounded-[22px] px-5 text-sm font-medium"
                  >
                    Save adjustment
                  </button>
                </form>
              </div>

              {movementFeedback ? (
                <p
                  className={cn(
                    "rounded-[18px] px-4 py-3 text-sm",
                    movementFeedback.type === "success"
                      ? "tara-alert-success"
                      : "tara-alert-danger",
                  )}
                >
                  {movementFeedback.message}
                </p>
              ) : null}
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 px-5 py-8 text-sm leading-7 text-[var(--muted)]">
              Pick a product from the catalog list to unlock restocks and manual adjustments.
            </div>
          )}

          <div className="rounded-[24px] bg-[var(--surface-soft)] px-5 py-4 text-sm leading-7 text-[var(--muted-strong)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--brand-amber)]" strokeWidth={1.8} />
              Inventory actions update the live dashboard, low-stock alerts, and selling floor
              catalog after each save.
            </div>
          </div>
        </Surface>
      </div>
    </section>
  );
}
