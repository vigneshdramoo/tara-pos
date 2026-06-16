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

export const PUBLIC_MARKET_STOP04_OFFER = {
  label: "Stop 04 Public Market Scent Trail",
  packages: [
    { key: "threeSet", label: "3-set", units: 3, priceCents: 9900 },
    { key: "fourSet", label: "4-set", units: 4, priceCents: 12900 },
    { key: "sixSet", label: "6-set", units: 6, priceCents: 18800 },
  ],
} as const;

export const SUNWAY_STUDENT_OFFER = {
  label: "Student discount",
  fiftyMlDiscountRate: 0.2,
} as const;

export const CHECKOUT_PROMOTION_IDS = [
  "NONE",
  "EIGHT_ML_BUNDLE",
  "HUUHA_TRAVEL_BUNDLE",
  "PUBLIC_MARKET_STOP04",
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
    description: "Use the shelf price, with a complimentary 8mL travel size on each 50mL bottle.",
    requirements: "Add the 8mL gift to the basket so inventory is captured correctly.",
    preview: "50mL at regular price + free 8mL travel size",
  },
  {
    id: "PUBLIC_MARKET_STOP04",
    label: PUBLIC_MARKET_STOP04_OFFER.label,
    kicker: "Stop 04",
    description:
      "Use the Public Market 5.0 Booth 7 strategy for fast Scent Trail checkout and sell-through tracking.",
    requirements: "Public Market 5.0, MRT Tunnel MyTOWNKL, Booth 7, 19-21 June 2026.",
    preview: "3 x 8mL RM99 · 4 x 8mL RM129 · 6 x 8mL RM188",
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
    label: SUNWAY_STUDENT_OFFER.label,
    kicker: "Student offer",
    description: "Apply the student appreciation price on full-size bottles.",
    requirements: "Verify student status. 20% off each 50mL and 1 free 8mL travel size per 50mL purchased.",
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

export type PublicMarketStop04PackageBreakdown = {
  threeSet: number;
  fourSet: number;
  sixSet: number;
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
  publicMarketStop04PackageBreakdown: PublicMarketStop04PackageBreakdown;
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

export function normalizeCheckoutPromotionId(
  promotionId: CheckoutPromotionId,
): CheckoutPromotionId {
  if (promotionId === "EIGHT_ML_BUNDLE" || promotionId === "HUUHA_TRAVEL_BUNDLE") {
    return "PUBLIC_MARKET_STOP04";
  }

  return promotionId;
}

export function getCheckoutPromotionOption(promotionId: CheckoutPromotionId) {
  const normalizedPromotionId = normalizeCheckoutPromotionId(promotionId);

  return (
    CHECKOUT_PROMOTION_OPTIONS.find((option) => option.id === normalizedPromotionId) ??
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
  const eligibleFiftyMlUnits = items.reduce(
    (sum, item) => sum + (isFiftyMlEdpEligible(item) ? item.quantity : 0),
    0,
  );
  let remainingFreeGiftUnits = eligibleFiftyMlUnits;

  const lines = finalizeLines(
    items.map((item) => {
      const listTotalCents = item.priceCents * item.quantity;

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
          promotionLabel: freeUnits ? "Complimentary travel size" : null,
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
        promotionDetail: isFiftyMlEdpEligible(item)
          ? `${item.quantity} complimentary 8mL gift${item.quantity === 1 ? "" : "s"} eligible`
          : null,
      };
    }),
  );

  const freeGiftClaimedUnits = Math.min(
    eligibleFiftyMlUnits,
    items.reduce((sum, item) => sum + (isEightMlEdpBundleEligible(item) ? item.quantity : 0), 0),
  );
  const freeGiftUnitsRemaining = eligibleFiftyMlUnits - freeGiftClaimedUnits;

  return buildPricingSummary({
    promotionId,
    lines,
    eligibleFiftyMlUnits,
    freeGiftEligibleUnits: eligibleFiftyMlUnits,
    freeGiftClaimedUnits,
    freeGiftUnitsRemaining,
    offerHeadline:
      eligibleFiftyMlUnits > 0
        ? `${eligibleFiftyMlUnits} complimentary 8mL gift${eligibleFiftyMlUnits === 1 ? "" : "s"} unlocked`
        : null,
    offerCallout:
      freeGiftUnitsRemaining > 0
        ? `Add ${freeGiftUnitsRemaining} more 8mL travel size${
            freeGiftUnitsRemaining === 1 ? "" : "s"
          } to the basket so the complimentary gift is captured in inventory.`
        : eligibleFiftyMlUnits > 0
          ? `${freeGiftClaimedUnits} complimentary 8mL travel size${
              freeGiftClaimedUnits === 1 ? "" : "s"
            } already added to this order.`
          : null,
  });
}

function calculateEightMlBundlePricing(
  items: CheckoutPricingItem[],
  promotionId: Extract<CheckoutPromotionId, "EIGHT_ML_BUNDLE" | "HUUHA_TRAVEL_BUNDLE">,
) {
  const promotion = getCheckoutPromotionOption(promotionId);
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
        promotionLabel: bundleUnits ? promotion.label : null,
        promotionDetail: bundleUnits
          ? `${bundleUnits} unit${bundleUnits === 1 ? "" : "s"} in the RM99 travel bundle`
          : null,
      };
    }),
  );

  const eightMlRemainder = eightMlEligibleUnits % EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize;

  return buildPricingSummary({
    promotionId,
    lines,
    eightMlBundleCount,
    eightMlEligibleUnits,
    eightMlUnitsUntilNextBundle: eightMlRemainder
      ? EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlRemainder
      : 0,
    offerHeadline:
      eightMlBundleCount > 0
        ? `${eightMlBundleCount} ${promotion.label} offer${eightMlBundleCount === 1 ? "" : "s"} applied`
        : null,
    offerCallout:
      eightMlEligibleUnits > 0 && eightMlRemainder
        ? `Add ${
            EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlRemainder
          } more 8mL travel size${EIGHT_ML_EDP_BUNDLE_OFFER.bundleSize - eightMlRemainder === 1 ? "" : "s"} to unlock another RM99 bundle.`
        : null,
  });
}

function createEmptyStop04PackageBreakdown(): PublicMarketStop04PackageBreakdown {
  return {
    threeSet: 0,
    fourSet: 0,
    sixSet: 0,
  };
}

function getStop04PackageDetail(breakdown: PublicMarketStop04PackageBreakdown) {
  return PUBLIC_MARKET_STOP04_OFFER.packages
    .map((offerPackage) => ({
      ...offerPackage,
      count: breakdown[offerPackage.key],
    }))
    .filter((offerPackage) => offerPackage.count > 0);
}

export function formatPublicMarketStop04PackageSummary(
  breakdown: PublicMarketStop04PackageBreakdown,
) {
  const packageDetail = getStop04PackageDetail(breakdown);

  if (!packageDetail.length) {
    return "No Stop 04 package unlocked yet";
  }

  return packageDetail
    .map(
      (offerPackage) =>
        `${offerPackage.count} x ${offerPackage.label} RM${(
          offerPackage.priceCents / 100
        ).toFixed(0)}`,
    )
    .join(" · ");
}

function findBestStop04PackageMix(eligibleUnits: number, regularUnitPriceCents: number) {
  const startingState = {
    totalPriceCents: 0,
    packageUnits: 0,
    packageCount: 0,
    breakdown: createEmptyStop04PackageBreakdown(),
  };
  const states = Array.from({ length: eligibleUnits + 1 }, () => startingState);
  states[0] = startingState;

  for (let units = 1; units <= eligibleUnits; units += 1) {
    let bestState = {
      totalPriceCents: states[units - 1].totalPriceCents + regularUnitPriceCents,
      packageUnits: states[units - 1].packageUnits,
      packageCount: states[units - 1].packageCount,
      breakdown: { ...states[units - 1].breakdown },
    };

    PUBLIC_MARKET_STOP04_OFFER.packages.forEach((offerPackage) => {
      if (units < offerPackage.units) return;

      const previousState = states[units - offerPackage.units];
      const candidate = {
        totalPriceCents: previousState.totalPriceCents + offerPackage.priceCents,
        packageUnits: previousState.packageUnits + offerPackage.units,
        packageCount: previousState.packageCount + 1,
        breakdown: {
          ...previousState.breakdown,
          [offerPackage.key]: previousState.breakdown[offerPackage.key] + 1,
        },
      };

      if (
        candidate.totalPriceCents < bestState.totalPriceCents ||
        (candidate.totalPriceCents === bestState.totalPriceCents &&
          candidate.packageUnits > bestState.packageUnits) ||
        (candidate.totalPriceCents === bestState.totalPriceCents &&
          candidate.packageUnits === bestState.packageUnits &&
          candidate.packageCount < bestState.packageCount)
      ) {
        bestState = candidate;
      }
    });

    states[units] = bestState;
  }

  return states[eligibleUnits];
}

function getStop04UnitsUntilNextPackage(eligibleUnits: number) {
  if (eligibleUnits < 3) return 3 - eligibleUnits;
  if (eligibleUnits === 3) return 1;
  if (eligibleUnits < 6) return 6 - eligibleUnits;
  return 0;
}

function getStop04OfferCopy(eligibleUnits: number, breakdown: PublicMarketStop04PackageBreakdown) {
  if (eligibleUnits === 0) {
    return {
      offerHeadline: "Build the Stop 04 Scent Trail set",
      offerCallout: "Add any 3 travel sizes to unlock the RM99 event set.",
    };
  }

  if (eligibleUnits < 3) {
    return {
      offerHeadline: "Stop 04 set in progress",
      offerCallout: `Add ${3 - eligibleUnits} more 8mL travel size${
        3 - eligibleUnits === 1 ? "" : "s"
      } to unlock the RM99 event set.`,
    };
  }

  if (eligibleUnits === 3) {
    return {
      offerHeadline: "Stop 04 RM99 set unlocked",
      offerCallout: "Add 1 more 8mL to complete all four scents for RM129.",
    };
  }

  if (eligibleUnits < 6) {
    return {
      offerHeadline: formatPublicMarketStop04PackageSummary(breakdown),
      offerCallout: `Add ${6 - eligibleUnits} more 8mL travel size${
        6 - eligibleUnits === 1 ? "" : "s"
      } to unlock the 6 x 8mL RM188 group set.`,
    };
  }

  return {
    offerHeadline: formatPublicMarketStop04PackageSummary(breakdown),
    offerCallout: "Stop 04 event package applied. Confirm payment and capture the buyer for follow-up.",
  };
}

function calculatePublicMarketStop04Pricing(items: CheckoutPricingItem[]) {
  const eightMlItems = items.filter(isEightMlEdpBundleEligible);
  const eightMlEligibleUnits = eightMlItems.reduce((sum, item) => sum + item.quantity, 0);
  const regularUnitPriceCents = eightMlItems[0]?.priceCents ?? 4500;
  const packageMix = findBestStop04PackageMix(eightMlEligibleUnits, regularUnitPriceCents);
  const publicMarketStop04PackageBreakdown = packageMix.breakdown;
  const eightMlListTotalCents = eightMlItems.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const totalEightMlDiscountCents = eightMlListTotalCents - packageMix.totalPriceCents;
  let allocatedDiscountCents = 0;
  let remainingDiscountedUnits = packageMix.packageUnits;
  const lastEightMlProductId = eightMlItems.at(-1)?.productId ?? null;
  const stop04Copy = getStop04OfferCopy(eightMlEligibleUnits, publicMarketStop04PackageBreakdown);

  const lines = finalizeLines(
    items.map((item) => {
      const listTotalCents = item.priceCents * item.quantity;

      if (!isEightMlEdpBundleEligible(item) || eightMlEligibleUnits === 0) {
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
          promotionDetail: isFiftyMlEdpEligible(item)
            ? "First-batch 50mL anchor bottle"
            : null,
        };
      }

      const lineDiscountCents =
        item.productId === lastEightMlProductId
          ? totalEightMlDiscountCents - allocatedDiscountCents
          : Math.floor((totalEightMlDiscountCents * listTotalCents) / eightMlListTotalCents);
      allocatedDiscountCents += lineDiscountCents;

      const bundleUnits = Math.min(item.quantity, remainingDiscountedUnits);
      remainingDiscountedUnits -= bundleUnits;
      const regularUnits = item.quantity - bundleUnits;

      return {
        productId: item.productId,
        quantity: item.quantity,
        listTotalCents,
        totalPriceCents: listTotalCents - lineDiscountCents,
        discountCents: lineDiscountCents,
        bundleUnits,
        regularUnits,
        discountedUnits: bundleUnits,
        freeUnits: 0,
        promotionLabel: bundleUnits ? PUBLIC_MARKET_STOP04_OFFER.label : null,
        promotionDetail: bundleUnits
          ? `${bundleUnits} unit${bundleUnits === 1 ? "" : "s"} in Stop 04 package`
          : null,
      };
    }),
  );

  return buildPricingSummary({
    promotionId: "PUBLIC_MARKET_STOP04",
    lines,
    eightMlBundleCount: packageMix.packageCount,
    eightMlEligibleUnits,
    eightMlUnitsUntilNextBundle: getStop04UnitsUntilNextPackage(eightMlEligibleUnits),
    publicMarketStop04PackageBreakdown,
    offerHeadline: stop04Copy.offerHeadline,
    offerCallout: stop04Copy.offerCallout,
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
          : "Add a 50mL bottle to unlock the student discount.",
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
  publicMarketStop04PackageBreakdown = createEmptyStop04PackageBreakdown(),
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
  publicMarketStop04PackageBreakdown?: PublicMarketStop04PackageBreakdown;
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
    publicMarketStop04PackageBreakdown,
    offerHeadline,
    offerCallout,
  };
}

export function calculateCheckoutPricing(
  items: CheckoutPricingItem[],
  promotionId: CheckoutPromotionId = "NONE",
): CheckoutPricing {
  const normalizedPromotionId = normalizeCheckoutPromotionId(promotionId);

  switch (normalizedPromotionId) {
    case "HUUHA_TRAVEL_BUNDLE":
      return calculateEightMlBundlePricing(items, "HUUHA_TRAVEL_BUNDLE");
    case "PUBLIC_MARKET_STOP04":
      return calculatePublicMarketStop04Pricing(items);
    case "FOLLOW_TAG_UNLOCK":
      return calculateBoothUnlockPricing(items);
    case "SUNWAY_STUDENT":
      return calculateSunwayStudentPricing(items);
    case "NONE":
    default:
      return calculateStandardPricing(items, "NONE");
  }
}
