import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthConfigurationIssue,
  getSessionCookieName,
  isAuthConfigured,
  verifySessionToken,
} from "@/lib/auth";
import { isClockEligibleStaff } from "@/lib/payroll";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";
import { getMalaysiaDateKey } from "@/lib/time";

export const preferredRegion = "sin1";

type ShiftAction = "CLOCK_IN" | "CLOCK_OUT";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function getSession() {
  const configurationIssue = getAuthConfigurationIssue();
  if (!isAuthConfigured() || configurationIssue) {
    return {
      response: jsonError(configurationIssue ?? "Authentication is not configured yet.", 503),
      session: null,
    };
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    return {
      response: jsonError("Sign in again to update your shift clock.", 401),
      session: null,
    };
  }

  return { response: null, session };
}

export async function POST(request: Request) {
  const { response, session } = await getSession();
  if (response || !session) {
    return response;
  }

  if (!isClockEligibleStaff(session.username)) {
    return jsonError("Shift clock is available for Scent Trail Crew accounts only.", 403);
  }

  const body = (await request.json().catch(() => null)) as { action?: ShiftAction } | null;
  const action = body?.action;

  if (action !== "CLOCK_IN" && action !== "CLOCK_OUT") {
    return jsonError("Choose clock in or clock out.", 400);
  }

  try {
    const prisma = requirePrisma();
    const now = new Date();
    const openShift = await prisma.staffShift.findFirst({
      where: {
        staffUserId: session.staffId,
        clockOutAt: null,
      },
      orderBy: {
        clockInAt: "desc",
      },
    });

    if (action === "CLOCK_IN") {
      if (openShift) {
        return jsonError("You already have an open shift. Clock out before starting another.", 400);
      }

      await prisma.staffShift.create({
        data: {
          staffUserId: session.staffId,
          dateKey: getMalaysiaDateKey(now),
          clockInAt: now,
        },
      });
    } else {
      if (!openShift) {
        return jsonError("No open shift was found to clock out from.", 400);
      }

      await prisma.staffShift.update({
        where: {
          id: openShift.id,
        },
        data: {
          clockOutAt: now,
        },
      });
    }

    revalidatePath("/account");
    revalidatePath("/payouts");
    revalidatePath("/staff");

    return NextResponse.json({ success: true });
  } catch (error) {
    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return jsonError(databaseIssue, 503);
    }

    console.error("[shifts]", error);
    return jsonError("Shift clock update failed. Please try again.", 500);
  }
}
