import { formatCurrency } from "@/lib/format";

const MALAYSIA_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

export const BASE_HOURLY_PAY_CENTS = 1000;

export const SENIOR_SCENT_TRAIL_OVERRIDE = {
  mentorUsername: "syaz",
  mentorTitle: "Senior Scent Trail Crew",
  rateBps: 200,
  effectiveFromDateKey: "2026-07-03",
  crewUsernames: ["rielyna.richard"],
} as const;

export const SCENT_TRAIL_DIRECT_COMMISSION_RATE_BPS = 1000;

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
  sameWeekdayAverageUnits: number | null;
};

export type StaffCommissionProgress = {
  totalSalesCents: number;
  totalCommissionCents: number;
  totalPayoutCommissionCents: number;
  todaySalesCents: number;
  todayCommissionCents: number;
  todayTargetBonusCents: number;
  todayPayoutPaceCents: number;
  todayOrderCount: number;
  todayWeekdayLabel: string;
  historicalSameWeekdayOrderAverage: number | null;
  sevenDayCommissionCents: number;
  sevenDayOrderCount: number;
  sevenDayStreakBonusCents: number;
  targets: BottleTargetProgress[];
  seniorOverride: SeniorScentTrailOverrideProgress | null;
  nextCoachingMessage: string;
};

export type SeniorScentTrailOverrideProgress = {
  title: string;
  rateBps: number;
  rateLabel: string;
  effectiveFromDateKey: string;
  crewNames: string[];
  todaySalesCents: number;
  todayCommissionCents: number;
  todayOrderCount: number;
  sevenDaySalesCents: number;
  sevenDayCommissionCents: number;
  sevenDayOrderCount: number;
  totalSalesCents: number;
  totalCommissionCents: number;
  totalOrderCount: number;
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

export type SeniorScentTrailOrder = CommissionProgressOrder & {
  salesperson: {
    name: string;
    username: string;
  } | null;
};

type BuildStaffCommissionProgressOptions = {
  staffUsername?: string;
  teamOrders?: SeniorScentTrailOrder[];
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

export function isScentTrailCommissionStaff(username?: string | null) {
  return Boolean(
    username &&
      (username === SENIOR_SCENT_TRAIL_OVERRIDE.mentorUsername ||
        SENIOR_SCENT_TRAIL_OVERRIDE.crewUsernames.includes(
          username as (typeof SENIOR_SCENT_TRAIL_OVERRIDE.crewUsernames)[number],
        )),
  );
}

function getDirectCommissionRateBps(sizeMl: number, staffUsername?: string | null) {
  const target = getCommissionTargetForSize(sizeMl);

  if (!target) {
    return 0;
  }

  if (staffUsername === "rielyna.richard") {
    return 1500;
  }

  return isScentTrailCommissionStaff(staffUsername)
    ? SCENT_TRAIL_DIRECT_COMMISSION_RATE_BPS
    : target.commissionRateBps;
}

export function calculateLineCommission(input: {
  sizeMl: number;
  unitPriceCents: number;
  quantity: number;
  staffUsername?: string | null;
}): CommissionLineResult {
  return calculateLineCommissionFromTotal({
    sizeMl: input.sizeMl,
    totalPriceCents: input.unitPriceCents * input.quantity,
    staffUsername: input.staffUsername,
  });
}

export function calculateLineCommissionFromTotal(input: {
  sizeMl: number;
  totalPriceCents: number;
  staffUsername?: string | null;
}): CommissionLineResult {
  const target = getCommissionTargetForSize(input.sizeMl);
  const commissionRateBps = getDirectCommissionRateBps(input.sizeMl, input.staffUsername);

  if (!target || commissionRateBps === 0) {
    return {
      targetKey: null,
      commissionRateBps: 0,
      commissionCents: 0,
    };
  }

  return {
    targetKey: target.key,
    commissionRateBps,
    commissionCents: roundCommissionCents(input.totalPriceCents, commissionRateBps),
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

function getMalaysiaWeekdayLabel(value: Date | string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
  }).format(asDate(value));
}

function isOnOrAfterDateKey(value: Date | string, dateKey: string) {
  return getMalaysiaDateKey(value) >= dateKey;
}

export function isSeniorScentTrailLead(username?: string | null) {
  return username === SENIOR_SCENT_TRAIL_OVERRIDE.mentorUsername;
}

function buildSeniorOverrideProgress(
  options: BuildStaffCommissionProgressOptions,
  todayKey: string,
  sevenDayKeySet: Set<string>,
): SeniorScentTrailOverrideProgress | null {
  if (!isSeniorScentTrailLead(options.staffUsername)) {
    return null;
  }

  const crewUsernameSet = new Set<string>(SENIOR_SCENT_TRAIL_OVERRIDE.crewUsernames);
  const eligibleOrders =
    options.teamOrders?.filter((order) => {
      const username = order.salesperson?.username;

      return (
        Boolean(username && crewUsernameSet.has(username)) &&
        isOnOrAfterDateKey(order.createdAt, SENIOR_SCENT_TRAIL_OVERRIDE.effectiveFromDateKey)
      );
    }) ?? [];
  const todayOrders = eligibleOrders.filter(
    (order) => getMalaysiaDateKey(order.createdAt) === todayKey,
  );
  const sevenDayOrders = eligibleOrders.filter((order) =>
    sevenDayKeySet.has(getMalaysiaDateKey(order.createdAt)),
  );
  const sumSales = (orders: SeniorScentTrailOrder[]) =>
    orders.reduce((sum, order) => sum + order.totalCents, 0);
  const uniqueCrewNames = Array.from(
    new Set(
      eligibleOrders
        .map((order) => order.salesperson?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  if (!uniqueCrewNames.length) {
    uniqueCrewNames.push("Rielyna");
  }

  const todaySalesCents = sumSales(todayOrders);
  const sevenDaySalesCents = sumSales(sevenDayOrders);
  const totalSalesCents = sumSales(eligibleOrders);

  return {
    title: SENIOR_SCENT_TRAIL_OVERRIDE.mentorTitle,
    rateBps: SENIOR_SCENT_TRAIL_OVERRIDE.rateBps,
    rateLabel: `${SENIOR_SCENT_TRAIL_OVERRIDE.rateBps / 100}%`,
    effectiveFromDateKey: SENIOR_SCENT_TRAIL_OVERRIDE.effectiveFromDateKey,
    crewNames: uniqueCrewNames,
    todaySalesCents,
    todayCommissionCents: roundCommissionCents(
      todaySalesCents,
      SENIOR_SCENT_TRAIL_OVERRIDE.rateBps,
    ),
    todayOrderCount: todayOrders.length,
    sevenDaySalesCents,
    sevenDayCommissionCents: roundCommissionCents(
      sevenDaySalesCents,
      SENIOR_SCENT_TRAIL_OVERRIDE.rateBps,
    ),
    sevenDayOrderCount: sevenDayOrders.length,
    totalSalesCents,
    totalCommissionCents: roundCommissionCents(
      totalSalesCents,
      SENIOR_SCENT_TRAIL_OVERRIDE.rateBps,
    ),
    totalOrderCount: eligibleOrders.length,
  };
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
  options: BuildStaffCommissionProgressOptions = {},
): StaffCommissionProgress {
  const todayKey = getMalaysiaDateKey(now);
  const todayWeekdayLabel = getMalaysiaWeekdayLabel(now);
  const sevenDayKeys = getLastMalaysiaDateKeys(7, now);
  const sevenDayKeySet = new Set(sevenDayKeys);
  const seniorOverride = buildSeniorOverrideProgress(options, todayKey, sevenDayKeySet);
  const todayOrders = orders.filter((order) => getMalaysiaDateKey(order.createdAt) === todayKey);
  const sevenDayOrders = orders.filter((order) =>
    sevenDayKeySet.has(getMalaysiaDateKey(order.createdAt)),
  );
  const historicalSameWeekdayOrders = orders.filter((order) => {
    const orderKey = getMalaysiaDateKey(order.createdAt);

    return orderKey !== todayKey && getMalaysiaWeekdayLabel(order.createdAt) === todayWeekdayLabel;
  });
  const historicalSameWeekdayGroups = new Map<string, CommissionProgressOrder[]>();

  historicalSameWeekdayOrders.forEach((order) => {
    const orderKey = getMalaysiaDateKey(order.createdAt);
    const existing = historicalSameWeekdayGroups.get(orderKey) ?? [];
    existing.push(order);
    historicalSameWeekdayGroups.set(orderKey, existing);
  });

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
      getDirectCommissionRateBps(target.key === "fullBottle" ? 50 : 8, options.staffUsername),
    );
    const dailyTargetPayoutCents = dailyTargetCommissionCents + target.targetBonusCents;

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
      sameWeekdayAverageUnits:
        historicalSameWeekdayGroups.size > 0
          ? Math.round(
              (Array.from(historicalSameWeekdayGroups.values()).reduce(
                (sum, dayOrders) => sum + sumTargetUnits(dayOrders, target.key),
                0,
              ) /
                historicalSameWeekdayGroups.size) *
                10,
            ) / 10
          : null,
    } satisfies BottleTargetProgress;
  });

  const todayCommissionCents = todayOrders.reduce(
    (sum, order) => sum + order.commissionCents,
    0,
  );
  const todayTargetBonusCents = targets.reduce((sum, target) => sum + target.targetBonusCents, 0);
  const todaySeniorOverrideCents = seniorOverride?.todayCommissionCents ?? 0;
  const totalCommissionCents = orders.reduce((sum, order) => sum + order.commissionCents, 0);
  const sevenDayStreakBonusCents = targets.reduce(
    (sum, target) =>
      sum + (target.sevenDayTargetDaysMet === sevenDayKeys.length ? target.sevenDayStreakBonusCents : 0),
    0,
  );
  const strongestOpportunityTarget = [...targets]
    .filter((target) => !target.targetMet)
    .sort((left, right) => left.remainingUnits - right.remainingUnits)[0];
  const nextCoachingMessage = strongestOpportunityTarget
    ? `Sell ${strongestOpportunityTarget.remainingUnits} more ${strongestOpportunityTarget.label} unit${strongestOpportunityTarget.remainingUnits === 1 ? "" : "s"} to unlock today's ${formatCurrency(strongestOpportunityTarget.targetBonusCents)} bonus.`
    : "Every target bonus is already unlocked today. Keep stacking commission while the floor is moving.";

  return {
    totalSalesCents: orders.reduce((sum, order) => sum + order.totalCents, 0),
    totalCommissionCents,
    totalPayoutCommissionCents: totalCommissionCents + (seniorOverride?.totalCommissionCents ?? 0),
    todaySalesCents: todayOrders.reduce((sum, order) => sum + order.totalCents, 0),
    todayCommissionCents,
    todayTargetBonusCents,
    todayPayoutPaceCents: todayCommissionCents + todayTargetBonusCents + todaySeniorOverrideCents,
    todayOrderCount: todayOrders.length,
    todayWeekdayLabel,
    historicalSameWeekdayOrderAverage:
      historicalSameWeekdayGroups.size > 0
        ? Math.round(
            (Array.from(historicalSameWeekdayGroups.values()).reduce(
              (sum, dayOrders) => sum + dayOrders.length,
              0,
            ) /
              historicalSameWeekdayGroups.size) *
              10,
          ) / 10
        : null,
    sevenDayCommissionCents: sevenDayOrders.reduce(
      (sum, order) => sum + order.commissionCents,
      0,
    ),
    sevenDayOrderCount: sevenDayOrders.length,
    sevenDayStreakBonusCents,
    targets,
    seniorOverride,
    nextCoachingMessage,
  };
}
