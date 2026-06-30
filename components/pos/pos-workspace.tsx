"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  calculateCheckoutPricing,
  isCheckoutPromotionId,
  normalizeCheckoutPromotionId,
  type CheckoutPromotionId,
} from "@/lib/checkout-pricing";
import {
  CART_STORAGE_KEY,
  CHECKOUT_PROMOTION_STORAGE_KEY,
  SALES_TAX_RATE,
} from "@/lib/constants";
import type {
  CheckoutPayload,
  ProductCardData,
  ProductFamilyCardData,
  RecentCustomerOption,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { CartPanel } from "@/components/pos/cart-panel";
import { ProductCard } from "@/components/pos/product-card";

type CartLine = ProductCardData & {
  quantity: number;
};

const DEFAULT_PROMOTION_ID: CheckoutPromotionId = "PUBLIC_MARKET_STOP04";

const initialCustomer = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

function getProductFamilyKey(product: ProductCardData) {
  return product.slug.replace(/-(10ml|8ml)$/i, "");
}

function getProductVariantLabel(product: ProductCardData) {
  if (product.sizeMl === 50) return "50mL";
  if (product.sizeMl === 8) return "Travel Pack";
  return `${product.sizeMl}mL`;
}

function buildProductFamilies(products: ProductCardData[]): ProductFamilyCardData[] {
  const families = new Map<string, ProductCardData[]>();

  products.forEach((product) => {
    const familyKey = getProductFamilyKey(product);
    const siblings = families.get(familyKey) ?? [];
    siblings.push(product);
    families.set(familyKey, siblings);
  });

  return [...families.entries()].map(([familyKey, variants]) => {
    const sortedVariants = [...variants].sort((left, right) => {
      if (left.sizeMl === right.sizeMl) {
        return left.name.localeCompare(right.name);
      }

      if (left.sizeMl === 50) return -1;
      if (right.sizeMl === 50) return 1;
      if (left.sizeMl === 8) return -1;
      if (right.sizeMl === 8) return 1;

      return left.sizeMl - right.sizeMl;
    });
    const hero = sortedVariants[0];

    return {
      id: familyKey,
      slug: familyKey,
      name: hero.name.replace(/\s+8mL$/i, ""),
      collection: hero.collection,
      description: hero.description,
      notes: hero.notes,
      mood: hero.mood,
      accentHex: hero.accentHex,
      imageUrl: hero.imageUrl,
      options: sortedVariants.map((variant) => ({
        label: getProductVariantLabel(variant),
        product: variant,
      })),
    };
  });
}

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
  const [promotionId, setPromotionId] = useState<CheckoutPromotionId>(DEFAULT_PROMOTION_ID);
  const [customer, setCustomer] = useState(initialCustomer);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [refreshing, startRefreshTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const productFamilies = buildProductFamilies(products);

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

  useEffect(() => {
    const rawPromotionId = window.localStorage.getItem(CHECKOUT_PROMOTION_STORAGE_KEY);

    if (isCheckoutPromotionId(rawPromotionId)) {
      const frame = window.requestAnimationFrame(() => {
        setPromotionId(normalizeCheckoutPromotionId(rawPromotionId));
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => {
      setPromotionId(DEFAULT_PROMOTION_ID);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHECKOUT_PROMOTION_STORAGE_KEY, promotionId);
  }, [promotionId]);

  const collections = ["All", ...new Set(productFamilies.map((product) => product.collection))];
  const travelGiftOptions = products.filter((product) => product.sizeMl === 8);
  const filteredProducts = productFamilies.filter((product) => {
    const matchesCollection = activeCollection === "All" || product.collection === activeCollection;
    const haystack = [
      product.name,
      product.collection,
      product.description,
      product.notes,
      product.mood,
      ...product.options.flatMap((option) => [
        option.label,
        option.product.name,
        option.product.sku,
        `${option.product.sizeMl}ml`,
      ]),
    ]
      .join(" ")
      .toLowerCase();
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
    promotionId,
  );
  const subtotalCents = checkoutPricing.subtotalCents;
  const taxCents = Math.round(subtotalCents * SALES_TAX_RATE);
  const totalCents = subtotalCents + taxCents;
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
        paymentMethod: "TRANSFER",
        promotionId,
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
        message: `Sale ${result.orderNumber} captured. Confirm DuitNow payment before handing over the order.`,
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
    <section className="grid gap-3 pb-4 sm:gap-4 xl:grid-cols-[minmax(0,1.35fr)_420px] xl:pb-0">
      <div className="grid gap-3 sm:gap-4">
        <div className="tara-surface sticky top-2 z-20 flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between md:gap-4 md:p-5 xl:static">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 sm:left-4 sm:h-5 sm:w-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fragrance, note, or collection"
              className="min-h-11 w-full rounded-[18px] border border-[var(--line)] bg-white/90 pl-10 pr-3 text-base text-stone-900 outline-none transition focus:border-stone-950 sm:min-h-[3.25rem] sm:rounded-[20px] sm:pl-12 sm:pr-4 md:rounded-[24px]"
            />
          </div>
          <div className="scrollbar-hidden -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 sm:mx-0 sm:gap-2 sm:px-0">
            {collections.map((collection) => (
              <button
                key={collection}
                type="button"
                onClick={() => setActiveCollection(collection)}
                className={cn(
                  "min-h-10 rounded-2xl px-3 text-xs font-semibold whitespace-nowrap transition sm:min-h-[3.25rem] sm:px-4 sm:text-sm",
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
            className="tara-panel-dark min-h-12 flex items-center justify-between gap-3 rounded-2xl px-3 text-left sm:min-h-[3.25rem] sm:px-4 xl:hidden"
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
        travelGiftOptions={travelGiftOptions}
        recentCustomers={recentCustomers}
        notes={notes}
        customer={customer}
        subtotalCents={subtotalCents}
        listSubtotalCents={checkoutPricing.listSubtotalCents}
        discountCents={checkoutPricing.discountCents}
        taxCents={taxCents}
        totalCents={totalCents}
        promotionId={promotionId}
        promotionLabel={checkoutPricing.promotionLabel}
        promotionDescription={checkoutPricing.promotionDescription}
        cartLinePricing={checkoutPricing.lines}
        eightMlBundleCount={checkoutPricing.eightMlBundleCount}
        eightMlEligibleUnits={checkoutPricing.eightMlEligibleUnits}
        eightMlUnitsUntilNextBundle={checkoutPricing.eightMlUnitsUntilNextBundle}
        freeGiftEligibleUnits={checkoutPricing.freeGiftEligibleUnits}
        freeGiftClaimedUnits={checkoutPricing.freeGiftClaimedUnits}
        freeGiftUnitsRemaining={checkoutPricing.freeGiftUnitsRemaining}
        publicMarketStop04PackageBreakdown={checkoutPricing.publicMarketStop04PackageBreakdown}
        offerHeadline={checkoutPricing.offerHeadline}
        offerCallout={checkoutPricing.offerCallout}
        submitting={submitting}
        refreshing={refreshing}
        feedback={feedback}
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
        onAddTravelGift={addProduct}
        onPromotionChange={setPromotionId}
        onCheckout={handleCheckout}
      />
    </section>
  );
}
