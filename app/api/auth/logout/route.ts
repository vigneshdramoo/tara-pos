import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);

  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
