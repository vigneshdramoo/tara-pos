import { PayoutPreference } from "@prisma/client";
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

export const preferredRegion = "sin1";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function PATCH(request: Request) {
  const configurationIssue = getAuthConfigurationIssue();
  if (!isAuthConfigured() || configurationIssue) {
    return jsonError(configurationIssue ?? "Authentication is not configured yet.", 503);
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    return jsonError("Sign in again to update your payout preference.", 401);
  }

  if (!isClockEligibleStaff(session.username)) {
    return jsonError("Payout preference is available for Scent Trail Crew accounts only.", 403);
  }

  const body = (await request.json().catch(() => null)) as {
    payoutPreference?: PayoutPreference;
  } | null;
  const payoutPreference = body?.payoutPreference;

  if (payoutPreference !== "DAILY" && payoutPreference !== "EVERY_TWO_DAYS") {
    return jsonError("Choose daily or every 2 days as the payout preference.", 400);
  }

  try {
    const prisma = requirePrisma();

    await prisma.staffUser.update({
      where: {
        id: session.staffId,
      },
      data: {
        payoutPreference,
      },
    });

    revalidatePath("/account");
    revalidatePath("/payouts");
    revalidatePath("/staff");

    return NextResponse.json({ success: true });
  } catch (error) {
    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return jsonError(databaseIssue, 503);
    }

    console.error("[payout-preference]", error);
    return jsonError("Payout preference update failed. Please try again.", 500);
  }
}
