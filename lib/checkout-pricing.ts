export const EIGHT_ML_EDP_BUNDLE_OFFER = {
  label: "3 x 8mL EDP",
  bundleSize: 3,
  bundlePriceCents: 9900,
  discountedUnitPriceCents: 3300,
} as const;

export type CheckoutPricingItem = {
  productId: string;
  sizeMl: number;
  priceCents: number;
  quantity: number;
};

export type CheckoutLinePricing = {
  productId: string;
  quantity: number;
  listTotalCents: number;
  totalPriceCents: number;
  discountCents: number;
  bundleUnits: number;
  regularUnits: number;
  effectiveUnitPriceCents: number;
};

export type CheckoutPricing = {
  lines: CheckoutLinePricing[];
  listSubtotalCents: number;
  subtotalCents: number;
  discountCents: number;
  eightMlBundleCount: number;
  eightMlEligibleUnits: number;
  eightMlUnitsUntilNextBundle: number;
};

export function isEightMlEdpBundleEligible(item: Pick<CheckoutPricingItem, "sizeMl">) {
  return item.sizeMl === 8;
}

export function calculateCheckoutPricing(items: CheckoutPricingItem[]): CheckoutPricing {
  const eightMlEligibleUnits = items.reduce(
    (sum, item) => sum + (isEightMlEdpBundleEligible(item) ? item.quantity : 0),
    0,
  );
  const eightMlBundleCount = Math.floor(
    eightMlEligibleUnits / EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize,
  );
  const eightMlBundledUnits = eightMlBundleCount * EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize;
  let remainingBundledUnits = eightMlBundledUnits;

  const lines = items.map((item) => {
    const listTotalCents = item.priceCents * item.quantity;
    const bundleUnits = isEightMlEdpBundleEligible(item)
      ? Math.min(item.quantity, remainingBundledUnits)
      : 0;
    remainingBundledUnits -= bundleUnits;

    const regularUnits = item.quantity - bundleUnits;
    const totalPriceCents =
      bundleUnits * EIGHT_ML_EDP_BUNDLE_OFFER.discountedUnitPriceCents +
      regularUnits * item.priceCents;

    return {
      productId: item.productId,
      quantity: item.quantity,
      listTotalCents,
      totalPriceCents,
      discountCents: listTotalCents - totalPriceCents,
      bundleUnits,
      regularUnits,
      effectiveUnitPriceCents: Math.round(totalPriceCents / item.quantity),
    } satisfies CheckoutLinePricing;
  });

  const listSubtotalCents = lines.reduce((sum, line) => sum + line.listTotalCents, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.totalPriceCents, 0);
  const eightMlRemainder = eightMlEligibleUnits % EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize;

  return {
    lines,
    listSubtotalCents,
    subtotalCents,
    discountCents: listSubtotalCents - subtotalCents,
    eightMlBundleCount,
    eightMlEligibleUnits,
    eightMlUnitsUntilNextBundle: eightMlRemainder
      ? EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlRemainder
      : 0,
  };
}
