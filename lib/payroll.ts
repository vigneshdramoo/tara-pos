import type { PayoutPreference, PayoutStatus } from "@prisma/client";
import {
  BASE_HOURLY_PAY_CENTS,
  COMMISSION_TARGETS,
  SCENT_TRAIL_DIRECT_COMMISSION_RATE_BPS,
  SENIOR_SCENT_TRAIL_OVERRIDE,
  isScentTrailCommissionStaff,
  isSeniorScentTrailLead,
} from "@/lib/commissions";
import { addUtcDays, getMalaysiaDateKey, getMalaysiaDayStart } from "@/lib/time";

const MINUTE_MS = 60 * 1000;

export type PayrollStaff = {
  id: string;
  name: string;
  username: string;
  payoutPreference: PayoutPreference;
};

export type PayrollOrder = {
  id: string;
  orderNumber: string;
  subtotalCents: number;
  totalCents: number;
  createdAt: Date | string;
  salesperson: {
    name: string;
    username: string;
  } | null;
  items: Array<{
    quantity: number;
    totalPriceCents: number;
    product: {
      name: string;
      sizeMl: number;
    };
  }>;
};

export type PayrollShift = {
  id: string;
  dateKey: string;
  clockInAt: Date | string;
  clockOutAt: Date | string | null;
  notes?: string | null;
};

export type PayrollPayout = {
  id: string;
  staffUserId: string;
  dateKey: string;
  status: PayoutStatus;
  payoutPreference: PayoutPreference;
  clockedHours: number;
  basePayCents: number;
  directCommissionCents: number;
  targetBonusCents: number;
  seniorOverrideCents: number;
  totalPayoutCents: number;
  completedAt: Date | string | null;
  notes: string | null;
  completedBy: {
    name: string;
  } | null;
};

export type ShiftClockSummary = {
  eligible: boolean;
  payoutPreference: PayoutPreference;
  currentShift: {
    id: string;
    dateKey: string;
    clockInAt: string;
  } | null;
  today: {
    dateKey: string;
    clockedMinutes: number;
    roundedHours: number;
    shifts: Array<{
      id: string;
      clockInAt: string;
      clockOutAt: string | null;
      clockedMinutes: number;
    }>;
  };
};

export type StaffPayoutDay = {
  staffUserId: string;
  staffName: string;
  username: string;
  dateKey: string;
  payoutPreference: PayoutPreference;
  status: PayoutStatus;
  payoutId: string | null;
  completedAt: string | null;
  completedByName: string | null;
  clockedMinutes: number;
  clockedHours: number;
  salesCents: number;
  orderCount: number;
  unitsSold: number;
  basePayCents: number;
  directCommissionCents: number;
  targetBonusCents: number;
  seniorOverrideCents: number;
  totalPayoutCents: number;
  isSnapshot: boolean;
  orderRows: Array<{
    orderNumber: string;
    totalCents: number;
    itemSummary: string;
  }>;
};

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function isSameDateKey(value: Date | string, dateKey: string) {
  return getMalaysiaDateKey(value) === dateKey;
}

export function getPayoutDateBounds(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, -8, 0, 0, 0));

  return {
    start,
    end: addUtcDays(start, 1),
  };
}

export function getRecentPayoutDateKeys(count = 7, now = new Date()) {
  const todayStart = getMalaysiaDayStart(now);

  return Array.from({ length: count }, (_, index) =>
    getMalaysiaDateKey(addUtcDays(todayStart, index - count + 1)),
  );
}

export function getClockedMinutes(shifts: PayrollShift[], now = new Date()) {
  return shifts.reduce((sum, shift) => {
    const start = asDate(shift.clockInAt);
    const end = shift.clockOutAt ? asDate(shift.clockOutAt) : now;
    const minutes = Math.max(Math.ceil((end.getTime() - start.getTime()) / MINUTE_MS), 0);

    return sum + minutes;
  }, 0);
}

export function roundUpClockedHours(minutes: number) {
  return minutes > 0 ? Math.ceil(minutes / 60) : 0;
}

export function isClockEligibleStaff(username?: string | null) {
  return isScentTrailCommissionStaff(username);
}

export function buildShiftClockSummary(input: {
  staff: PayrollStaff;
  shifts: PayrollShift[];
  now?: Date;
}): ShiftClockSummary {
  const now = input.now ?? new Date();
  const todayKey = getMalaysiaDateKey(now);
  const currentShift = input.shifts.find((shift) => !shift.clockOutAt) ?? null;
  const todayShifts = input.shifts.filter((shift) => shift.dateKey === todayKey);
  const clockedMinutes = getClockedMinutes(todayShifts, now);

  return {
    eligible: isClockEligibleStaff(input.staff.username),
    payoutPreference: input.staff.payoutPreference,
    currentShift: currentShift
      ? {
          id: currentShift.id,
          dateKey: currentShift.dateKey,
          clockInAt: asDate(currentShift.clockInAt).toISOString(),
        }
      : null,
    today: {
      dateKey: todayKey,
      clockedMinutes,
      roundedHours: roundUpClockedHours(clockedMinutes),
      shifts: todayShifts.map((shift) => ({
        id: shift.id,
        clockInAt: asDate(shift.clockInAt).toISOString(),
        clockOutAt: shift.clockOutAt ? asDate(shift.clockOutAt).toISOString() : null,
        clockedMinutes: getClockedMinutes([shift], now),
      })),
    },
  };
}

function getTargetBonusCents(orders: PayrollOrder[]) {
  const targetUnits = new Map<string, number>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const target = COMMISSION_TARGETS.find((candidate) => {
        if (candidate.key === "fullBottle") {
          return item.product.sizeMl === 50;
        }

        return item.product.sizeMl > 0 && item.product.sizeMl <= 10;
      });

      if (target) {
        targetUnits.set(target.key, (targetUnits.get(target.key) ?? 0) + item.quantity);
      }
    });
  });

  return COMMISSION_TARGETS.reduce(
    (sum, target) =>
      sum + ((targetUnits.get(target.key) ?? 0) >= target.dailyTargetUnits ? target.targetBonusCents : 0),
    0,
  );
}

function getDirectCommissionCents(staff: PayrollStaff, orders: PayrollOrder[]) {
  const salesCents = orders.reduce((sum, order) => sum + order.totalCents, 0);

  if (isScentTrailCommissionStaff(staff.username)) {
    return Math.round((salesCents * SCENT_TRAIL_DIRECT_COMMISSION_RATE_BPS) / 10000);
  }

  return orders.reduce((sum, order) => {
    const storedLineCommissions = order.items.reduce(
      (lineSum, item) => lineSum + Math.round((item.totalPriceCents * 1000) / 10000),
      0,
    );

    return sum + storedLineCommissions;
  }, 0);
}

function getSeniorOverrideCents(staff: PayrollStaff, dateKey: string, teamOrders: PayrollOrder[]) {
  if (!isSeniorScentTrailLead(staff.username)) {
    return 0;
  }

  const crewUsernameSet = new Set<string>(SENIOR_SCENT_TRAIL_OVERRIDE.crewUsernames);
  const eligibleSalesCents = teamOrders
    .filter(
      (order) =>
        isSameDateKey(order.createdAt, dateKey) &&
        Boolean(order.salesperson?.username && crewUsernameSet.has(order.salesperson.username)),
    )
    .reduce((sum, order) => sum + order.totalCents, 0);

  return Math.round((eligibleSalesCents * SENIOR_SCENT_TRAIL_OVERRIDE.rateBps) / 10000);
}

export function buildStaffPayoutDay(input: {
  staff: PayrollStaff;
  dateKey: string;
  orders: PayrollOrder[];
  teamOrders: PayrollOrder[];
  shifts: PayrollShift[];
  payout: PayrollPayout | null;
  now?: Date;
}): StaffPayoutDay {
  const now = input.now ?? new Date();
  const dailyOrders = input.orders.filter((order) => isSameDateKey(order.createdAt, input.dateKey));
  const dailyShifts = input.shifts.filter((shift) => shift.dateKey === input.dateKey);
  const clockedMinutes = getClockedMinutes(dailyShifts, now);
  const clockedHours = roundUpClockedHours(clockedMinutes);
  const salesCents = dailyOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const unitsSold = dailyOrders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const computed = {
    clockedHours,
    basePayCents: clockedHours * BASE_HOURLY_PAY_CENTS,
    directCommissionCents: getDirectCommissionCents(input.staff, dailyOrders),
    targetBonusCents: getTargetBonusCents(dailyOrders),
    seniorOverrideCents: getSeniorOverrideCents(input.staff, input.dateKey, input.teamOrders),
  };
  const useSnapshot = input.payout?.status === "COMPLETED";
  const payoutSnapshot = useSnapshot ? input.payout : null;
  const basePayCents = payoutSnapshot ? payoutSnapshot.basePayCents : computed.basePayCents;
  const directCommissionCents = payoutSnapshot
    ? payoutSnapshot.directCommissionCents
    : computed.directCommissionCents;
  const targetBonusCents = payoutSnapshot
    ? payoutSnapshot.targetBonusCents
    : computed.targetBonusCents;
  const seniorOverrideCents = payoutSnapshot
    ? payoutSnapshot.seniorOverrideCents
    : computed.seniorOverrideCents;
  const reportClockedHours = payoutSnapshot ? payoutSnapshot.clockedHours : computed.clockedHours;

  return {
    staffUserId: input.staff.id,
    staffName: input.staff.name,
    username: input.staff.username,
    dateKey: input.dateKey,
    payoutPreference: input.payout?.payoutPreference ?? input.staff.payoutPreference,
    status: input.payout?.status ?? "PENDING",
    payoutId: input.payout?.id ?? null,
    completedAt: input.payout?.completedAt ? asDate(input.payout.completedAt).toISOString() : null,
    completedByName: input.payout?.completedBy?.name ?? null,
    clockedMinutes,
    clockedHours: reportClockedHours,
    salesCents,
    orderCount: dailyOrders.length,
    unitsSold,
    basePayCents,
    directCommissionCents,
    targetBonusCents,
    seniorOverrideCents,
    totalPayoutCents:
      basePayCents + directCommissionCents + targetBonusCents + seniorOverrideCents,
    isSnapshot: useSnapshot,
    orderRows: dailyOrders.map((order) => ({
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      itemSummary: order.items
        .map((item) => `${item.product.name} x${item.quantity}`)
        .join(" | "),
    })),
  };
}
