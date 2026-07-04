import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthConfigurationIssue,
  getSessionCookieName,
  isAuthConfigured,
  verifySessionToken,
} from "@/lib/auth";
import { BASE_HOURLY_PAY_CENTS } from "@/lib/commissions";
import {
  buildStaffPayoutDay,
  getPayoutDateBounds,
  isClockEligibleStaff,
} from "@/lib/payroll";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";
import { canManageStaff } from "@/lib/staff";

export const preferredRegion = "sin1";

const PAYOUT_CREW_USERNAMES = ["syaz", "rielyna.richard"] as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function normalizeDateKey(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function normalizeClockedHours(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 24) {
    return null;
  }

  return parsed;
}

export async function POST(request: Request) {
  const configurationIssue = getAuthConfigurationIssue();
  if (!isAuthConfigured() || configurationIssue) {
    return jsonError(configurationIssue ?? "Authentication is not configured yet.", 503);
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    return jsonError("Sign in again to complete payout.", 401);
  }

  if (!canManageStaff(session.role)) {
    return jsonError("Only Daniel can mark crew payouts as completed.", 403);
  }

  const body = (await request.json().catch(() => null)) as {
    staffUserId?: string;
    dateKey?: string;
    notes?: string;
  } | null;
  const staffUserId = body?.staffUserId?.trim();
  const dateKey = normalizeDateKey(body?.dateKey);

  if (!staffUserId || !dateKey) {
    return jsonError("Choose a staff member and payout date before completing payout.", 400);
  }

  try {
    const prisma = requirePrisma();
    const dateBounds = getPayoutDateBounds(dateKey);
    const targetStaff = await prisma.staffUser.findUnique({
      where: {
        id: staffUserId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        payoutPreference: true,
      },
    });

    if (!targetStaff || !isClockEligibleStaff(targetStaff.username)) {
      return jsonError("That payout account is not an active Scent Trail payout account.", 404);
    }

    const [orders, shifts, existingPayout] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: dateBounds.start,
            lt: dateBounds.end,
          },
          salesperson: {
            username: {
              in: [...PAYOUT_CREW_USERNAMES],
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          subtotalCents: true,
          totalCents: true,
          createdAt: true,
          salesperson: {
            select: {
              name: true,
              username: true,
            },
          },
          items: {
            select: {
              quantity: true,
              totalPriceCents: true,
              product: {
                select: {
                  name: true,
                  sizeMl: true,
                },
              },
            },
          },
        },
      }),
      prisma.staffShift.findMany({
        where: {
          staffUserId: targetStaff.id,
          dateKey,
        },
        select: {
          id: true,
          dateKey: true,
          clockInAt: true,
          clockOutAt: true,
          notes: true,
        },
      }),
      prisma.staffPayout.findUnique({
        where: {
          staffUserId_dateKey: {
            staffUserId: targetStaff.id,
            dateKey,
          },
        },
        include: {
          completedBy: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    if (existingPayout?.status === "COMPLETED") {
      return jsonError("This payout is already marked completed.", 400);
    }

    const report = buildStaffPayoutDay({
      staff: targetStaff,
      dateKey,
      orders: orders.filter((order) => order.salesperson?.username === targetStaff.username),
      teamOrders: orders,
      shifts,
      payout: existingPayout,
    });
    const notes = body?.notes?.trim() || null;

    await prisma.staffPayout.upsert({
      where: {
        staffUserId_dateKey: {
          staffUserId: targetStaff.id,
          dateKey,
        },
      },
      update: {
        status: "COMPLETED",
        payoutPreference: targetStaff.payoutPreference,
        clockedHours: report.clockedHours,
        basePayCents: report.basePayCents,
        directCommissionCents: report.directCommissionCents,
        targetBonusCents: report.targetBonusCents,
        seniorOverrideCents: report.seniorOverrideCents,
        totalPayoutCents: report.totalPayoutCents,
        completedAt: new Date(),
        completedById: session.staffId,
        notes,
      },
      create: {
        staffUserId: targetStaff.id,
        dateKey,
        status: "COMPLETED",
        payoutPreference: targetStaff.payoutPreference,
        clockedHours: report.clockedHours,
        basePayCents: report.basePayCents,
        directCommissionCents: report.directCommissionCents,
        targetBonusCents: report.targetBonusCents,
        seniorOverrideCents: report.seniorOverrideCents,
        totalPayoutCents: report.totalPayoutCents,
        completedAt: new Date(),
        completedById: session.staffId,
        notes,
      },
    });

    revalidatePath("/payouts");
    revalidatePath("/account");
    revalidatePath("/staff");

    return NextResponse.json({ success: true });
  } catch (error) {
    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return jsonError(databaseIssue, 503);
    }

    console.error("[payouts]", error);
    return jsonError("Payout completion failed. Please try again.", 500);
  }
}

export async function PATCH(request: Request) {
  const configurationIssue = getAuthConfigurationIssue();
  if (!isAuthConfigured() || configurationIssue) {
    return jsonError(configurationIssue ?? "Authentication is not configured yet.", 503);
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    return jsonError("Sign in again to adjust payable hours.", 401);
  }

  if (!canManageStaff(session.role)) {
    return jsonError("Only Daniel can adjust crew payout hours.", 403);
  }

  const body = (await request.json().catch(() => null)) as {
    staffUserId?: string;
    dateKey?: string;
    clockedHours?: number | string;
    notes?: string;
  } | null;
  const staffUserId = body?.staffUserId?.trim();
  const dateKey = normalizeDateKey(body?.dateKey);
  const adjustedClockedHours = normalizeClockedHours(body?.clockedHours);

  if (!staffUserId || !dateKey || adjustedClockedHours === null) {
    return jsonError("Choose a staff member, payout date, and whole payable hours from 0 to 24.", 400);
  }

  try {
    const prisma = requirePrisma();
    const dateBounds = getPayoutDateBounds(dateKey);
    const targetStaff = await prisma.staffUser.findUnique({
      where: {
        id: staffUserId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        payoutPreference: true,
      },
    });

    if (!targetStaff || !isClockEligibleStaff(targetStaff.username)) {
      return jsonError("That payout account is not an active Scent Trail payout account.", 404);
    }

    const [orders, shifts, existingPayout] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: {
            gte: dateBounds.start,
            lt: dateBounds.end,
          },
          salesperson: {
            username: {
              in: [...PAYOUT_CREW_USERNAMES],
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          subtotalCents: true,
          totalCents: true,
          createdAt: true,
          salesperson: {
            select: {
              name: true,
              username: true,
            },
          },
          items: {
            select: {
              quantity: true,
              totalPriceCents: true,
              product: {
                select: {
                  name: true,
                  sizeMl: true,
                },
              },
            },
          },
        },
      }),
      prisma.staffShift.findMany({
        where: {
          staffUserId: targetStaff.id,
          dateKey,
        },
        select: {
          id: true,
          dateKey: true,
          clockInAt: true,
          clockOutAt: true,
          notes: true,
        },
      }),
      prisma.staffPayout.findUnique({
        where: {
          staffUserId_dateKey: {
            staffUserId: targetStaff.id,
            dateKey,
          },
        },
        include: {
          completedBy: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);
    const report = buildStaffPayoutDay({
      staff: targetStaff,
      dateKey,
      orders: orders.filter((order) => order.salesperson?.username === targetStaff.username),
      teamOrders: orders,
      shifts,
      payout: existingPayout?.status === "COMPLETED" ? existingPayout : null,
    });
    const basePayCents = adjustedClockedHours * BASE_HOURLY_PAY_CENTS;
    const totalPayoutCents =
      basePayCents +
      report.directCommissionCents +
      report.targetBonusCents +
      report.seniorOverrideCents;
    const now = new Date();
    const manualAdjustmentNotes = body?.notes?.trim() || null;

    await prisma.staffPayout.upsert({
      where: {
        staffUserId_dateKey: {
          staffUserId: targetStaff.id,
          dateKey,
        },
      },
      update: {
        payoutPreference: targetStaff.payoutPreference,
        clockedHours: adjustedClockedHours,
        basePayCents,
        directCommissionCents: report.directCommissionCents,
        targetBonusCents: report.targetBonusCents,
        seniorOverrideCents: report.seniorOverrideCents,
        totalPayoutCents,
        manualClockedHours: adjustedClockedHours,
        manualAdjustedAt: now,
        manualAdjustedById: session.staffId,
        manualAdjustmentNotes,
      },
      create: {
        staffUserId: targetStaff.id,
        dateKey,
        status: "PENDING",
        payoutPreference: targetStaff.payoutPreference,
        clockedHours: adjustedClockedHours,
        basePayCents,
        directCommissionCents: report.directCommissionCents,
        targetBonusCents: report.targetBonusCents,
        seniorOverrideCents: report.seniorOverrideCents,
        totalPayoutCents,
        manualClockedHours: adjustedClockedHours,
        manualAdjustedAt: now,
        manualAdjustedById: session.staffId,
        manualAdjustmentNotes,
      },
    });

    revalidatePath("/payouts");
    revalidatePath("/account");
    revalidatePath("/staff");

    return NextResponse.json({ success: true });
  } catch (error) {
    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return jsonError(databaseIssue, 503);
    }

    console.error("[payout-hours]", error);
    return jsonError("Payable hours adjustment failed. Please try again.", 500);
  }
}
