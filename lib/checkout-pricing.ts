export const EIGHT_ML_EDP_BUNDLE_OFFER = {
  label: "3 x 8mL EDP",
  bundleSize: 3,
  bundlePriceCents: 9900,
  discountedUnitPriceCents: 3300,
} as const;

export const BOOTH_UNLOCK_OFFER = {
  label: "Follow.Tag.Unlock",
  eightMlUnitPriceCents: 3800,
  fiftyMlUnitPriceCents: 15800,
} as const;

export const SUNWAY_STUDENT_OFFER = {
  label: "Sunway Lakeside student",
  fiftyMlDiscountRate: 0.2,
} as const;

export const CHECKOUT_PROMOTION_IDS = [
  "NONE",
  "EIGHT_ML_BUNDLE",
  "FOLLOW_TAG_UNLOCK",
  "SUNWAY_STUDENT",
] as const;

export type CheckoutPromotionId = (typeof CHECKOUT_PROMOTION_IDS)[number];

export type CheckoutPromotionOption = {
  id: CheckoutPromotionId;
  label: string;
  kicker: string;
  description: string;
  requirements: string;
  preview: string;
};

export const CHECKOUT_PROMOTION_OPTIONS: CheckoutPromotionOption[] = [
  {
    id: "NONE",
    label: "Regular pricing",
    kicker: "Standard",
    description: "Use the shelf price with no temporary event offer.",
    requirements: "No additional promo conditions.",
    preview: "50mL at regular price, 8mL at regular price",
  },
  {
    id: "EIGHT_ML_BUNDLE",
    label: EIGHT_ML_EDP_BUNDLE_OFFER.label,
    kicker: "Travel bundle",
    description: "Great for discovery sets and gifting bundles.",
    requirements: "Applies when the cart has 3 or more 8mL EDP units.",
    preview: `3 x 8mL for RM ${(EIGHT_ML_EDP_BUNDLE_OFFER.bundlePriceCents / 100).toFixed(0)}`,
  },
  {
    id: "FOLLOW_TAG_UNLOCK",
    label: "Booth 66 Follow.Tag.Unlock",
    kicker: "Booth-only",
    description: "Unlock event pricing after following @tara_scents.my and tagging TARA SCENTS on an IG Story.",
    requirements: "Foodie Tour v27, Booth 66 near the Wish Tree.",
    preview: "8mL at RM38, 50mL at RM158",
  },
  {
    id: "SUNWAY_STUDENT",
    label: "Sunway Lakeside student",
    kicker: "Student offer",
    description: "Apply the student appreciation price on full-size bottles.",
    requirements: "20% off each 50mL and 1 free 8mL travel size per 50mL purchased.",
    preview: "50mL at 20% off + free 8mL travel size",
  },
];

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
  discountedUnits: number;
  freeUnits: number;
  promotionLabel: string | null;
  promotionDetail: string | null;
};

export type CheckoutPricing = {
  promotionId: CheckoutPromotionId;
  promotionLabel: string;
  promotionDescription: string;
  lines: CheckoutLinePricing[];
  listSubtotalCents: number;
  subtotalCents: number;
  discountCents: number;
  eightMlBundleCount: number;
  eightMlEligibleUnits: number;
  eightMlUnitsUntilNextBundle: number;
  eligibleFiftyMlUnits: number;
  freeGiftEligibleUnits: number;
  freeGiftClaimedUnits: number;
  freeGiftUnitsRemaining: number;
  offerHeadline: string | null;
  offerCallout: string | null;
};

export function isEightMlEdpBundleEligible(item: Pick<CheckoutPricingItem, "sizeMl">) {
  return item.sizeMl === 8;
}

export function isFiftyMlEdpEligible(item: Pick<CheckoutPricingItem, "sizeMl">) {
  return item.sizeMl === 50;
}

export function isCheckoutPromotionId(value: string | undefined | null): value is CheckoutPromotionId {
  return CHECKOUT_PROMOTION_IDS.some((id) => id === value);
}

export function getCheckoutPromotionOption(promotionId: CheckoutPromotionId) {
  return (
    CHECKOUT_PROMOTION_OPTIONS.find((option) => option.id === promotionId) ??
    CHECKOUT_PROMOTION_OPTIONS[0]
  );
}

type LineAccumulator = Omit<
  CheckoutLinePricing,
  "effectiveUnitPriceCents" | "listTotalCents" | "discountCents"
> & {
  listTotalCents: number;
  discountCents: number;
};

function finalizeLines(lines: LineAccumulator[]) {
  return lines.map((line) => ({
    ...line,
    effectiveUnitPriceCents: line.quantity
      ? Math.round(line.totalPriceCents / line.quantity)
      : 0,
    discountCents: line.listTotalCents - line.totalPriceCents,
  }));
}

function calculateStandardPricing(items: CheckoutPricingItem[], promotionId: CheckoutPromotionId) {
  const lines = finalizeLines(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      listTotalCents: item.priceCents * item.quantity,
      totalPriceCents: item.priceCents * item.quantity,
      discountCents: 0,
      bundleUnits: 0,
      regularUnits: item.quantity,
      discountedUnits: 0,
      freeUnits: 0,
      promotionLabel: null,
      promotionDetail: null,
    })),
  );

  return buildPricingSummary({
    promotionId,
    lines,
  });
}

function calculateEightMlBundlePricing(items: CheckoutPricingItem[]) {
  const eightMlEligibleUnits = items.reduce(
    (sum, item) => sum + (isEightMlEdpBundleEligible(item) ? item.quantity : 0),
    0,
  );
  const eightMlBundleCount = Math.floor(
    eightMlEligibleUnits / EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize,
  );
  const eightMlBundledUnits = eightMlBundleCount * EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize;
  let remainingBundledUnits = eightMlBundledUnits;

  const lines = finalizeLines(
    items.map((item) => {
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
        discountedUnits: bundleUnits,
        freeUnits: 0,
        promotionLabel: bundleUnits ? EIGHT_ML_EDP_BUNDLE_OFFER.label : null,
        promotionDetail: bundleUnits
          ? `${bundleUnits} unit${bundleUnits === 1 ? "" : "s"} in the RM99 travel bundle`
          : null,
      };
    }),
  );

  const eightMlRemainder = eightMlEligibleUnits % EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize;

  return buildPricingSummary({
    promotionId: "EIGHT_ML_BUNDLE",
    lines,
    eightMlBundleCount,
    eightMlEligibleUnits,
    eightMlUnitsUntilNextBundle: eightMlRemainder
      ? EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlRemainder
      : 0,
    offerHeadline:
      eightMlBundleCount > 0
        ? `${eightMlBundleCount} ${EIGHT_ML_EDP_BUNDLE_OFFER.label} offer${eightMlBundleCount === 1 ? "" : "s"} applied`
        : null,
    offerCallout:
      eightMlEligibleUnits > 0 && eightMlRemainder
        ? `Add ${
            EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlRemainder
          } more 8mL EDP to unlock another RM99 bundle.`
        : null,
  });
}

function calculateBoothUnlockPricing(items: CheckoutPricingItem[]) {
  const lines = finalizeLines(
    items.map((item) => {
      const listTotalCents = item.priceCents * item.quantity;
      const boothUnitPriceCents = isEightMlEdpBundleEligible(item)
        ? BOOTH_UNLOCK_OFFER.eightMlUnitPriceCents
        : isFiftyMlEdpEligible(item)
          ? BOOTH_UNLOCK_OFFER.fiftyMlUnitPriceCents
          : item.priceCents;
      const discountedUnits = boothUnitPriceCents === item.priceCents ? 0 : item.quantity;
      const totalPriceCents = boothUnitPriceCents * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        listTotalCents,
        totalPriceCents,
        discountCents: listTotalCents - totalPriceCents,
        bundleUnits: 0,
        regularUnits: discountedUnits ? 0 : item.quantity,
        discountedUnits,
        freeUnits: 0,
        promotionLabel: discountedUnits ? BOOTH_UNLOCK_OFFER.label : null,
        promotionDetail: discountedUnits
          ? `${item.sizeMl}mL unlocked at RM ${(boothUnitPriceCents / 100).toFixed(0)} each`
          : null,
      };
    }),
  );

  return buildPricingSummary({
    promotionId: "FOLLOW_TAG_UNLOCK",
    lines,
    offerHeadline: "Booth-only unlock price active",
    offerCallout:
      "Follow @tara_scents.my and tag TARA SCENTS on an IG Story before handing over the order.",
  });
}

function calculateSunwayStudentPricing(items: CheckoutPricingItem[]) {
  const eligibleFiftyMlUnits = items.reduce(
    (sum, item) => sum + (isFiftyMlEdpEligible(item) ? item.quantity : 0),
    0,
  );
  let remainingFreeGiftUnits = eligibleFiftyMlUnits;

  const lines = finalizeLines(
    items.map((item) => {
      const listTotalCents = item.priceCents * item.quantity;

      if (isFiftyMlEdpEligible(item)) {
        const studentUnitPriceCents = Math.round(
          item.priceCents * (1 - SUNWAY_STUDENT_OFFER.fiftyMlDiscountRate),
        );
        const totalPriceCents = studentUnitPriceCents * item.quantity;

        return {
          productId: item.productId,
          quantity: item.quantity,
          listTotalCents,
          totalPriceCents,
          discountCents: listTotalCents - totalPriceCents,
          bundleUnits: 0,
          regularUnits: 0,
          discountedUnits: item.quantity,
          freeUnits: 0,
          promotionLabel: SUNWAY_STUDENT_OFFER.label,
          promotionDetail: `${item.quantity} full-size bottle${
            item.quantity === 1 ? "" : "s"
          } at 20% off`,
        };
      }

      if (isEightMlEdpBundleEligible(item)) {
        const freeUnits = Math.min(item.quantity, remainingFreeGiftUnits);
        remainingFreeGiftUnits -= freeUnits;
        const paidUnits = item.quantity - freeUnits;
        const totalPriceCents = paidUnits * item.priceCents;

        return {
          productId: item.productId,
          quantity: item.quantity,
          listTotalCents,
          totalPriceCents,
          discountCents: listTotalCents - totalPriceCents,
          bundleUnits: 0,
          regularUnits: paidUnits,
          discountedUnits: 0,
          freeUnits,
          promotionLabel: freeUnits ? SUNWAY_STUDENT_OFFER.label : null,
          promotionDetail: freeUnits
            ? `${freeUnits} free 8mL travel size${freeUnits === 1 ? "" : "s"}`
            : null,
        };
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        listTotalCents,
        totalPriceCents: listTotalCents,
        discountCents: 0,
        bundleUnits: 0,
        regularUnits: item.quantity,
        discountedUnits: 0,
        freeUnits: 0,
        promotionLabel: null,
        promotionDetail: null,
      };
    }),
  );

  const freeGiftClaimedUnits = Math.min(
    eligibleFiftyMlUnits,
    items.reduce((sum, item) => sum + (isEightMlEdpBundleEligible(item) ? item.quantity : 0), 0),
  );
  const freeGiftUnitsRemaining = eligibleFiftyMlUnits - freeGiftClaimedUnits;

  return buildPricingSummary({
    promotionId: "SUNWAY_STUDENT",
    lines,
    eligibleFiftyMlUnits,
    freeGiftEligibleUnits: eligibleFiftyMlUnits,
    freeGiftClaimedUnits,
    freeGiftUnitsRemaining,
    offerHeadline:
      eligibleFiftyMlUnits > 0
        ? `${eligibleFiftyMlUnits} student 50mL offer${eligibleFiftyMlUnits === 1 ? "" : "s"} applied`
        : null,
    offerCallout:
      freeGiftUnitsRemaining > 0
        ? `Add ${freeGiftUnitsRemaining} more 8mL travel size${
            freeGiftUnitsRemaining === 1 ? "" : "s"
          } to claim the free student gift.`
        : eligibleFiftyMlUnits > 0
          ? `${freeGiftClaimedUnits} free 8mL travel size${
              freeGiftClaimedUnits === 1 ? "" : "s"
            } claimed in this cart.`
          : "Add a 50mL bottle to unlock the student offer.",
  });
}

function buildPricingSummary({
  promotionId,
  lines,
  eightMlBundleCount = 0,
  eightMlEligibleUnits = 0,
  eightMlUnitsUntilNextBundle = 0,
  eligibleFiftyMlUnits = 0,
  freeGiftEligibleUnits = 0,
  freeGiftClaimedUnits = 0,
  freeGiftUnitsRemaining = 0,
  offerHeadline = null,
  offerCallout = null,
}: {
  promotionId: CheckoutPromotionId;
  lines: CheckoutLinePricing[];
  eightMlBundleCount?: number;
  eightMlEligibleUnits?: number;
  eightMlUnitsUntilNextBundle?: number;
  eligibleFiftyMlUnits?: number;
  freeGiftEligibleUnits?: number;
  freeGiftClaimedUnits?: number;
  freeGiftUnitsRemaining?: number;
  offerHeadline?: string | null;
  offerCallout?: string | null;
}): CheckoutPricing {
  const listSubtotalCents = lines.reduce((sum, line) => sum + line.listTotalCents, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.totalPriceCents, 0);
  const option = getCheckoutPromotionOption(promotionId);

  return {
    promotionId,
    promotionLabel: option.label,
    promotionDescription: option.description,
    lines,
    listSubtotalCents,
    subtotalCents,
    discountCents: listSubtotalCents - subtotalCents,
    eightMlBundleCount,
    eightMlEligibleUnits,
    eightMlUnitsUntilNextBundle,
    eligibleFiftyMlUnits,
    freeGiftEligibleUnits,
    freeGiftClaimedUnits,
    freeGiftUnitsRemaining,
    offerHeadline,
    offerCallout,
  };
}

export function calculateCheckoutPricing(
  items: CheckoutPricingItem[],
  promotionId: CheckoutPromotionId = "NONE",
): CheckoutPricing {
  switch (promotionId) {
    case "EIGHT_ML_BUNDLE":
      return calculateEightMlBundlePricing(items);
    case "FOLLOW_TAG_UNLOCK":
      return calculateBoothUnlockPricing(items);
    case "SUNWAY_STUDENT":
      return calculateSunwayStudentPricing(items);
    case "NONE":
    default:
      return calculateStandardPricing(items, "NONE");
  }
}
