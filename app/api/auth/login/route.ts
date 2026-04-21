import { NextResponse } from "next/server";
import {
  getAuthConfigurationIssue,
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  isAuthConfigured,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";

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

  const body = (await request.json().catch(() => null)) as {
    identifier?: string;
    password?: string;
  } | null;
  const identifier = body?.identifier?.trim().toLowerCase();
  const password = body?.password;

  if (!identifier || !password) {
    return NextResponse.json(
      { message: "Enter a username or email together with the password." },
      { status: 400 },
    );
  }

  try {
    const prisma = requirePrisma();
    const staff = await prisma.staffUser.findFirst({
      where: {
        active: true,
        OR: [
          {
            username: identifier,
          },
          {
            email: {
              equals: identifier,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!staff || !verifyPassword(password, staff.passwordHash)) {
      return NextResponse.json(
        { message: "Incorrect username, email, or password." },
        { status: 401 },
      );
    }

    await prisma.staffUser.update({
      where: { id: staff.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const session = await createSessionToken({
      staffId: staff.id,
      name: staff.name,
      username: staff.username,
      email: staff.email,
      role: staff.role,
    });
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: getSessionCookieName(),
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionMaxAge(),
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (error) {
    const databaseIssue = describeDatabaseIssue(error);

    if (databaseIssue) {
      const staffSetupMessage = databaseIssue.includes("schema has not been applied")
        ? "The hosted database is missing staff access tables. Re-run `pnpm db:deploy`, then `pnpm staff:bootstrap` against the same DATABASE_URL used in Vercel."
        : `${databaseIssue} For staff login, make sure Vercel uses the same hosted DATABASE_URL that was migrated locally.`;

      console.error("[auth:login] database issue", error);
      return NextResponse.json({ message: staffSetupMessage }, { status: 503 });
    }

    console.error("[auth:login] unexpected error", error);
    return NextResponse.json(
      { message: "Staff sign-in failed on the server. Check Vercel logs and staff auth environment values." },
      { status: 500 },
    );
  }
}
