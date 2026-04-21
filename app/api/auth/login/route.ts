import { NextResponse } from "next/server";
import {
  getAuthConfigurationIssue,
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  isAuthConfigured,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
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
    return NextResponse.json({ message: "Incorrect username, email, or password." }, { status: 401 });
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
}
