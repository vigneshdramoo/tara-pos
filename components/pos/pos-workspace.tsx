"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { calculateCheckoutPricing } from "@/lib/checkout-pricing";
import { calculateLineCommissionFromTotal } from "@/lib/commissions";
import { CART_STORAGE_KEY, SALES_TAX_RATE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { CheckoutPayload, ProductCardData, RecentCustomerOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CartPanel } from "@/components/pos/cart-panel";
import { ProductCard } from "@/components/pos/product-card";

type CartLine = ProductCardData & {
  quantity: number;
};

const initialCustomer = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

export function PosWorkspace({
  products,
  recentCustomers,
}: {
  products: ProductCardData[];
  recentCustomers: RecentCustomerOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPayload["paymentMethod"]>("CARD");
  const [customer, setCustomer] = useState(initialCustomer);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [refreshing, startRefreshTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Array<{ productId: string; quantity: number }>;
      const nextCart = parsed
        .map((entry) => {
          const product = products.find((candidate) => candidate.id === entry.productId);
          if (!product || product.stock <= 0) return null;

          return {
            ...product,
            quantity: Math.min(entry.quantity, product.stock),
          };
        })
        .filter((item): item is CartLine => Boolean(item));

      const frame = window.requestAnimationFrame(() => {
        setCart(nextCart);
      });

      return () => window.cancelAnimationFrame(frame);
    } catch (error) {
      console.error("Failed to restore local cart", error);
    }
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(
        cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      ),
    );
  }, [cart]);

  const collections = ["All", ...new Set(products.map((product) => product.collection))];
  const filteredProducts = products.filter((product) => {
    const matchesCollection = activeCollection === "All" || product.collection === activeCollection;
    const haystack = `${product.name} ${product.collection} ${product.notes} ${product.mood}`.toLowerCase();
    const matchesQuery = haystack.includes(deferredQuery.trim().toLowerCase());

    return matchesCollection && matchesQuery;
  });

  const checkoutPricing = calculateCheckoutPricing(
    cart.map((item) => ({
      productId: item.id,
      sizeMl: item.sizeMl,
      priceCents: item.priceCents,
      quantity: item.quantity,
    })),
  );
  const subtotalCents = checkoutPricing.subtotalCents;
  const taxCents = Math.round(subtotalCents * SALES_TAX_RATE);
  const totalCents = subtotalCents + taxCents;
  const cartLinePricingMap = new Map(
    checkoutPricing.lines.map((linePricing) => [linePricing.productId, linePricing]),
  );
  const commissionCents = cart.reduce(
    (sum, item) =>
      sum +
      calculateLineCommissionFromTotal({
        sizeMl: item.sizeMl,
        totalPriceCents: cartLinePricingMap.get(item.id)?.totalPriceCents ?? 0,
      }).commissionCents,
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addProduct(product: ProductCardData) {
    setFeedback(null);
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, direction: "up" | "down") {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) return item;

          const latestStock = products.find((product) => product.id === productId)?.stock ?? item.stock;
          const nextQuantity =
            direction === "up" ? Math.min(item.quantity + 1, latestStock) : item.quantity - 1;

          return {
            ...item,
            quantity: nextQuantity,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function hydrateCustomer(recentCustomer: RecentCustomerOption) {
    setCustomer({
      name: recentCustomer.name,
      email: recentCustomer.email ?? "",
      phone: recentCustomer.phone ?? "",
      notes: "",
    });
  }

  async function handleCheckout() {
    if (!cart.length) {
      setFeedback({ type: "error", message: "Add at least one fragrance to the cart first." });
      return;
    }

    setFeedback(null);
    setSubmitting(true);

    try {
      const payload: CheckoutPayload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        notes,
        customer,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        orderNumber?: string;
        commissionCents?: number;
        salespersonName?: string | null;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Checkout failed.");
      }

      setCart([]);
      setNotes("");
      setCustomer(initialCustomer);
      setFeedback({
        type: "success",
        message: `Sale ${result.orderNumber} captured for ${
          result.salespersonName ?? "the floor"
        }. Commission: ${formatCurrency(result.commissionCents ?? 0)}.`,
      });

      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Checkout failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_420px]">
      <div className="grid gap-4">
        <div className="tara-surface sticky top-2 z-20 flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-5 xl:static">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fragrance, note, or collection"
              className="touch-target w-full rounded-[20px] border border-[var(--line)] bg-white/90 pl-12 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-950 md:rounded-[24px] md:text-base"
            />
          </div>
          <div className="scrollbar-hidden flex items-center gap-2 overflow-x-auto">
            {collections.map((collection) => (
              <button
                key={collection}
                type="button"
                onClick={() => setActiveCollection(collection)}
                className={cn(
                  "touch-target rounded-2xl px-3 text-xs font-semibold whitespace-nowrap transition sm:px-4 sm:text-sm",
                  activeCollection === collection
                    ? "bg-stone-950 text-stone-50"
                    : "bg-white text-stone-700",
                )}
              >
                {collection}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById("checkout-panel")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="tara-panel-dark touch-target flex items-center justify-between gap-3 rounded-2xl px-4 text-left xl:hidden"
          >
            <span className="flex min-w-0 items-center gap-3">
              <ShoppingBag className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-[0.2em] text-[rgba(202,158,91,0.9)]">
                  Basket
                </span>
                <span className="block truncate text-sm font-semibold">
                  {cartItemCount ? `${cartItemCount} item${cartItemCount === 1 ? "" : "s"}` : "Ready to start"}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold">
              {totalCents ? `RM ${(totalCents / 100).toFixed(2)}` : "Checkout"}
            </span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:gap-4 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addProduct} />
          ))}
        </div>
      </div>

      <CartPanel
        cart={cart}
        recentCustomers={recentCustomers}
        paymentMethod={paymentMethod}
        notes={notes}
        customer={customer}
        subtotalCents={subtotalCents}
        listSubtotalCents={checkoutPricing.listSubtotalCents}
        discountCents={checkoutPricing.discountCents}
        taxCents={taxCents}
        totalCents={totalCents}
        commissionCents={commissionCents}
        cartLinePricing={checkoutPricing.lines}
        eightMlBundleCount={checkoutPricing.eightMlBundleCount}
        eightMlEligibleUnits={checkoutPricing.eightMlEligibleUnits}
        eightMlUnitsUntilNextBundle={checkoutPricing.eightMlUnitsUntilNextBundle}
        submitting={submitting}
        refreshing={refreshing}
        feedback={feedback}
        onPaymentMethodChange={setPaymentMethod}
        onNotesChange={setNotes}
        onCustomerFieldChange={(field, value) =>
          setCustomer((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onHydrateCustomer={hydrateCustomer}
        onIncrease={(productId) => changeQuantity(productId, "up")}
        onDecrease={(productId) => changeQuantity(productId, "down")}
        onRemove={(productId) => setCart((current) => current.filter((item) => item.id !== productId))}
        onCheckout={handleCheckout}
      />
    </section>
  );
}
