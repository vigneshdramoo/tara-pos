import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getSessionCookieName,
  isProtectionEnabled,
  sanitizeNextPath,
  verifySessionToken,
} from "@/lib/auth";

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js"
  );
}

function isAuthPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth/");
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectionEnabled() || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (isAuthPath(pathname)) {
    if (pathname === "/login" && isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", sanitizeNextPath(`${pathname}${search}`));

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/:path*"],
};
