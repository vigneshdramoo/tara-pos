const MALAYSIA_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

export const BASIC_DAILY_PAY_CENTS = 7000;

export const COMMISSION_TARGETS = [
  {
    key: "fullBottle",
    label: "50mL",
    commissionRateBps: 1500,
    dailyTargetUnits: 5,
    targetBonusCents: 8000,
    sevenDayStreakBonusCents: 50000,
    targetUnitPriceCents: 16900,
  },
  {
    key: "travelBottle",
    label: "8mL",
    commissionRateBps: 1000,
    dailyTargetUnits: 25,
    targetBonusCents: 5000,
    sevenDayStreakBonusCents: 35000,
    targetUnitPriceCents: 4500,
  },
] as const;

export type CommissionTargetKey = (typeof COMMISSION_TARGETS)[number]["key"];

export type CommissionLineResult = {
  targetKey: CommissionTargetKey | null;
  commissionRateBps: number;
  commissionCents: number;
};

export type BottleTargetProgress = {
  key: CommissionTargetKey;
  label: string;
  soldUnits: number;
  targetUnits: number;
  remainingUnits: number;
  progressPercent: number;
  commissionCents: number;
  targetBonusCents: number;
  targetMet: boolean;
  dailyTargetPayoutCents: number;
  sevenDayTargetPayoutCents: number;
  sevenDayStreakBonusCents: number;
  sevenDayTargetDaysMet: number;
};

export type StaffCommissionProgress = {
  totalSalesCents: number;
  totalCommissionCents: number;
  todaySalesCents: number;
  todayCommissionCents: number;
  todayTargetBonusCents: number;
  todayPayoutPaceCents: number;
  todayOrderCount: number;
  sevenDayCommissionCents: number;
  sevenDayOrderCount: number;
  sevenDayStreakBonusCents: number;
  targets: BottleTargetProgress[];
};

type CommissionProgressItem = {
  quantity: number;
  commissionCents: number;
  product: {
    sizeMl: number;
  };
};

export type CommissionProgressOrder = {
  totalCents: number;
  commissionCents: number;
  createdAt: Date | string;
  items: CommissionProgressItem[];
};

function roundCommissionCents(amountCents: number, commissionRateBps: number) {
  return Math.round((amountCents * commissionRateBps) / 10000);
}

export function getCommissionTargetForSize(sizeMl: number) {
  if (sizeMl === 50) {
    return COMMISSION_TARGETS[0];
  }

  if (sizeMl > 0 && sizeMl <= 10) {
    return COMMISSION_TARGETS[1];
  }

  return null;
}

export function calculateLineCommission(input: {
  sizeMl: number;
  unitPriceCents: number;
  quantity: number;
}): CommissionLineResult {
  const target = getCommissionTargetForSize(input.sizeMl);

  if (!target) {
    return {
      targetKey: null,
      commissionRateBps: 0,
      commissionCents: 0,
    };
  }

  return {
    targetKey: target.key,
    commissionRateBps: target.commissionRateBps,
    commissionCents: roundCommissionCents(
      input.unitPriceCents * input.quantity,
      target.commissionRateBps,
    ),
  };
}

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function getMalaysiaDateKey(value: Date | string) {
  return new Date(asDate(value).getTime() + MALAYSIA_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function getMalaysiaDayStart(value: Date | string) {
  const [year, month, day] = getMalaysiaDateKey(value).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) - MALAYSIA_UTC_OFFSET_MS);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getLastMalaysiaDateKeys(count: number, now: Date) {
  const todayStart = getMalaysiaDayStart(now);

  return Array.from({ length: count }, (_, index) =>
    getMalaysiaDateKey(addDays(todayStart, index - count + 1)),
  );
}

function isSameTarget(item: CommissionProgressItem, key: CommissionTargetKey) {
  return getCommissionTargetForSize(item.product.sizeMl)?.key === key;
}

function sumTargetUnits(orders: CommissionProgressOrder[], key: CommissionTargetKey) {
  return orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + (isSameTarget(item, key) ? item.quantity : 0),
        0,
      ),
    0,
  );
}

function sumTargetCommission(orders: CommissionProgressOrder[], key: CommissionTargetKey) {
  return orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + (isSameTarget(item, key) ? item.commissionCents : 0),
        0,
      ),
    0,
  );
}

export function buildStaffCommissionProgress(
  orders: CommissionProgressOrder[],
  now = new Date(),
): StaffCommissionProgress {
  const todayKey = getMalaysiaDateKey(now);
  const sevenDayKeys = getLastMalaysiaDateKeys(7, now);
  const sevenDayKeySet = new Set(sevenDayKeys);
  const todayOrders = orders.filter((order) => getMalaysiaDateKey(order.createdAt) === todayKey);
  const sevenDayOrders = orders.filter((order) =>
    sevenDayKeySet.has(getMalaysiaDateKey(order.createdAt)),
  );

  const targets = COMMISSION_TARGETS.map((target) => {
    const soldUnits = sumTargetUnits(todayOrders, target.key);
    const targetMet = soldUnits >= target.dailyTargetUnits;
    const sevenDayTargetDaysMet = sevenDayKeys.filter((dateKey) => {
      const dayOrders = sevenDayOrders.filter(
        (order) => getMalaysiaDateKey(order.createdAt) === dateKey,
      );

      return sumTargetUnits(dayOrders, target.key) >= target.dailyTargetUnits;
    }).length;
    const dailyTargetCommissionCents = roundCommissionCents(
      target.targetUnitPriceCents * target.dailyTargetUnits,
      target.commissionRateBps,
    );
    const dailyTargetPayoutCents =
      BASIC_DAILY_PAY_CENTS + dailyTargetCommissionCents + target.targetBonusCents;

    return {
      key: target.key,
      label: target.label,
      soldUnits,
      targetUnits: target.dailyTargetUnits,
      remainingUnits: Math.max(target.dailyTargetUnits - soldUnits, 0),
      progressPercent: Math.min(Math.round((soldUnits / target.dailyTargetUnits) * 100), 100),
      commissionCents: sumTargetCommission(todayOrders, target.key),
      targetBonusCents: targetMet ? target.targetBonusCents : 0,
      targetMet,
      dailyTargetPayoutCents,
      sevenDayTargetPayoutCents:
        dailyTargetPayoutCents * sevenDayKeys.length + target.sevenDayStreakBonusCents,
      sevenDayStreakBonusCents: target.sevenDayStreakBonusCents,
      sevenDayTargetDaysMet,
    } satisfies BottleTargetProgress;
  });

  const todayCommissionCents = todayOrders.reduce(
    (sum, order) => sum + order.commissionCents,
    0,
  );
  const todayTargetBonusCents = targets.reduce((sum, target) => sum + target.targetBonusCents, 0);
  const sevenDayStreakBonusCents = targets.reduce(
    (sum, target) =>
      sum + (target.sevenDayTargetDaysMet === sevenDayKeys.length ? target.sevenDayStreakBonusCents : 0),
    0,
  );

  return {
    totalSalesCents: orders.reduce((sum, order) => sum + order.totalCents, 0),
    totalCommissionCents: orders.reduce((sum, order) => sum + order.commissionCents, 0),
    todaySalesCents: todayOrders.reduce((sum, order) => sum + order.totalCents, 0),
    todayCommissionCents,
    todayTargetBonusCents,
    todayPayoutPaceCents: BASIC_DAILY_PAY_CENTS + todayCommissionCents + todayTargetBonusCents,
    todayOrderCount: todayOrders.length,
    sevenDayCommissionCents: sevenDayOrders.reduce(
      (sum, order) => sum + order.commissionCents,
      0,
    ),
    sevenDayOrderCount: sevenDayOrders.length,
    sevenDayStreakBonusCents,
    targets,
  };
}
