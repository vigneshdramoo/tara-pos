import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthConfigurationIssue,
  getSessionCookieName,
  isAuthConfigured,
  verifySessionToken,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { validatePasswordStrength } from "@/lib/password-policy";
import { requirePrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const configurationIssue = getAuthConfigurationIssue();
  if (!isAuthConfigured() || configurationIssue) {
    return NextResponse.json(
      {
        message: configurationIssue ?? "Authentication is not configured yet.",
      },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

  if (!session) {
    return NextResponse.json({ message: "Sign in again to change your password." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
    nextPassword?: string;
    confirmPassword?: string;
  } | null;

  const currentPassword = body?.currentPassword ?? "";
  const nextPassword = body?.nextPassword ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return NextResponse.json(
      { message: "Enter your current password, a new password, and the confirmation." },
      { status: 400 },
    );
  }

  if (nextPassword !== confirmPassword) {
    return NextResponse.json({ message: "The new password confirmation does not match." }, { status: 400 });
  }

  if (currentPassword === nextPassword) {
    return NextResponse.json(
      { message: "Choose a new password that is different from the current one." },
      { status: 400 },
    );
  }

  const strengthIssue = validatePasswordStrength(nextPassword);
  if (strengthIssue) {
    return NextResponse.json({ message: strengthIssue }, { status: 400 });
  }

  const prisma = requirePrisma();
  const staffUser = await prisma.staffUser.findUnique({
    where: { id: session.staffId },
  });

  if (!staffUser || !staffUser.active) {
    return NextResponse.json({ message: "This staff account is unavailable." }, { status: 404 });
  }

  if (!verifyPassword(currentPassword, staffUser.passwordHash)) {
    return NextResponse.json({ message: "The current password is incorrect." }, { status: 401 });
  }

  await prisma.staffUser.update({
    where: { id: staffUser.id },
    data: {
      passwordHash: hashPassword(nextPassword),
    },
  });

  return NextResponse.json({ success: true });
}
