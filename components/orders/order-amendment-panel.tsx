"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { OrderAmendmentProduct, OrderHistoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type AmendmentLine = {
  key: string;
  productId: string;
  quantity: string;
};

type AmendmentFeedback = {
  type: "success" | "error";
  message: string;
} | null;

function createLine(productId: string, quantity: number, index: number): AmendmentLine {
  return {
    key: `${productId}-${index}`,
    productId,
    quantity: String(quantity),
  };
}

function getVariantLabel(product: Pick<OrderAmendmentProduct, "sizeMl" | "sku">) {
  return `${product.sizeMl === 8 ? "Travel Pack" : `${product.sizeMl}mL`} · ${product.sku}`;
}

export function OrderAmendmentPanel({
  order,
  products,
}: {
  order: OrderHistoryItem;
  products: OrderAmendmentProduct[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<AmendmentLine[]>(() =>
    order.itemSummary.map((item, index) => createLine(item.productId, item.quantity, index)),
  );
  const [customer, setCustomer] = useState({
    name: order.customerName === "Walk-in guest" ? "" : order.customerName,
    email: order.customerSocialHandle ?? "",
    phone: order.customerPhone ?? "",
    notes: order.customerNotes ?? "",
  });
  const [notes, setNotes] = useState(order.notes ?? "");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<AmendmentFeedback>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefreshTransition] = useTransition();
  const catalog = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]));

    order.itemSummary.forEach((item) => {
      if (productMap.has(item.productId)) return;

      productMap.set(item.productId, {
        id: item.productId,
        name: item.productName,
        sku: item.productSku,
        sizeMl: item.productSizeMl,
        priceCents: item.unitPriceCents,
        stock: item.productStock,
        reorderLevel: item.productReorderLevel,
      });
    });

    return [...productMap.values()].sort((left, right) => {
      const nameComparison = left.name.localeCompare(right.name);
      return nameComparison || right.sizeMl - left.sizeMl;
    });
  }, [order.itemSummary, products]);
  const productById = useMemo(
    () => new Map(catalog.map((product) => [product.id, product])),
    [catalog],
  );
  const originalQuantityByProductId = useMemo(() => {
    const map = new Map<string, number>();
    order.itemSummary.forEach((item) => {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
    });
    return map;
  }, [order.itemSummary]);
  const selectedProductIds = new Set(lines.map((line) => line.productId).filter(Boolean));
  const firstAvailableProduct = catalog.find((product) => !selectedProductIds.has(product.id)) ?? catalog[0];
  const canSave = lines.some((line) => line.productId && Number(line.quantity) > 0) && reason.trim().length >= 3;

  function updateLine(lineKey: string, patch: Partial<AmendmentLine>) {
    setLines((current) =>
      current.map((line) => (line.key === lineKey ? { ...line, ...patch } : line)),
    );
  }

  function resetForm() {
    setLines(order.itemSummary.map((item, index) => createLine(item.productId, item.quantity, index)));
    setCustomer({
      name: order.customerName === "Walk-in guest" ? "" : order.customerName,
      email: order.customerSocialHandle ?? "",
      phone: order.customerPhone ?? "",
      notes: order.customerNotes ?? "",
    });
    setNotes(order.notes ?? "");
    setReason("");
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          notes,
          reason,
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
          })),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(result?.message ?? "Order amendment failed.");
      }

      setFeedback({
        type: "success",
        message: result?.message ?? "Order amended successfully.",
      });
      setReason("");
      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Order amendment failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[rgba(202,158,91,0.22)] bg-[rgba(202,158,91,0.08)] px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Manager correction
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Daniel can amend basket lines, customer follow-up details, and remarks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="touch-target rounded-full bg-stone-950 px-5 text-sm font-semibold text-stone-50 transition hover:bg-[var(--brand-midnight)]"
        >
          Amend order
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-[rgba(202,158,91,0.24)] bg-[rgba(255,251,246,0.82)] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Manager correction
          </p>
          <h4 className="mt-1 text-lg font-semibold text-stone-950">Amend {order.orderNumber}</h4>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen(false);
          }}
          className="touch-target rounded-full border border-[var(--line)] bg-white/80 px-4 text-sm font-semibold text-stone-700"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Basket lines
            </p>
            <button
              type="button"
              disabled={!firstAvailableProduct}
              onClick={() => {
                if (!firstAvailableProduct) return;
                setLines((current) => [
                  ...current,
                  createLine(firstAvailableProduct.id, 1, current.length + Date.now()),
                ]);
              }}
              className="touch-target rounded-full border border-[var(--line)] bg-white/90 px-4 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add product
            </button>
          </div>

          {lines.map((line) => {
            const product = productById.get(line.productId);
            const originalQuantity = originalQuantityByProductId.get(line.productId) ?? 0;
            const availableQuantity = (product?.stock ?? 0) + originalQuantity;

            return (
              <div
                key={line.key}
                className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-white/82 p-3 md:grid-cols-[minmax(0,1fr)_120px_auto]"
              >
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Product
                  </span>
                  <select
                    value={line.productId}
                    onChange={(event) =>
                      updateLine(line.key, {
                        productId: event.target.value,
                        quantity: "1",
                      })
                    }
                    className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
                  >
                    {catalog.map((productOption) => (
                      <option key={productOption.id} value={productOption.id}>
                        {productOption.name} · {getVariantLabel(productOption)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Qty
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={availableQuantity}
                    value={line.quantity}
                    onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                    className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
                  />
                </label>

                <div className="flex items-end justify-between gap-3 md:flex-col md:items-end">
                  <p className="text-xs leading-5 text-stone-500">
                    Available after correction:{" "}
                    <span className="font-semibold text-stone-800">
                      {formatInteger(availableQuantity)}
                    </span>
                    {product ? (
                      <>
                        <br />
                        {formatCurrency(product.priceCents)} current price
                      </>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                    className="touch-target rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Customer name
            </span>
            <input
              value={customer.name}
              onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
              className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
              placeholder="Walk-in guest"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Social handle
            </span>
            <input
              value={customer.email}
              onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
              className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
              placeholder="@instagram or TikTok"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Phone
            </span>
            <input
              value={customer.phone}
              onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
              className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
              placeholder="Optional"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Customer note
            </span>
            <input
              value={customer.notes}
              onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
              className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
              placeholder="Preference or follow-up note"
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Order remarks
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm leading-6 text-stone-900 outline-none focus:border-[var(--brand-gold)]"
            placeholder="Order remarks, promotion proof, or customer request"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Correction reason
          </span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="touch-target rounded-2xl border border-[var(--line)] bg-white px-3 text-sm text-stone-900 outline-none focus:border-[var(--brand-gold)]"
            placeholder="Example: corrected travel-size quantity"
            required
          />
        </label>

        {feedback ? (
          <p
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            {feedback.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSave || saving || refreshing}
          className="touch-target rounded-full bg-[var(--brand-gold)] px-5 text-sm font-semibold text-stone-950 transition hover:bg-[var(--brand-amber)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving amendment..." : refreshing ? "Refreshing orders..." : "Save amendment"}
        </button>
      </div>
    </form>
  );
}
