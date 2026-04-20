import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  isAuthConfigured,
  isPasswordValid,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        message: "Set POS_ADMIN_PASSWORD and POS_SESSION_SECRET before taking the POS online.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password?.trim();

  if (!password || !isPasswordValid(password)) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  const session = await createSessionToken();
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
