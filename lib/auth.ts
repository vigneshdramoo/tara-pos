import type { StaffRole, StaffSession } from "@/lib/staff";
import { canAccessPath, isStaffRole } from "@/lib/staff";

const SESSION_COOKIE_NAME = "tara-pos-session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
let signingKeyPromise: Promise<CryptoKey> | null = null;

function toBase64Url(value: ArrayBuffer | Uint8Array) {
  const buffer = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  buffer.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodePayload(value: string) {
  return toBase64Url(encoder.encode(value));
}

function decodePayload(value: string) {
  return decoder.decode(fromBase64Url(value));
}

function getRequiredSecret() {
  const secret = process.env.POS_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing POS_SESSION_SECRET.");
  }

  return secret;
}

async function getSigningKey() {
  if (!signingKeyPromise) {
    signingKeyPromise = crypto.subtle.importKey(
      "raw",
      encoder.encode(getRequiredSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  return signingKeyPromise;
}

async function signPayload(payload: string) {
  const signature = await crypto.subtle.sign("HMAC", await getSigningKey(), encoder.encode(payload));
  return toBase64Url(signature);
}

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.POS_SESSION_SECRET);
}

export function isProtectionEnabled() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.POS_SESSION_SECRET);
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export function getAuthConfigurationIssue() {
  if (!process.env.POS_SESSION_SECRET) {
    return "Set POS_SESSION_SECRET before enabling staff sign-in.";
  }

  if (!process.env.DATABASE_URL) {
    return "Set DATABASE_URL and seed staff accounts before enabling staff sign-in.";
  }

  return null;
}

export async function createSessionToken(input: {
  staffId: string;
  name: string;
  username: string;
  email: string | null;
  role: StaffRole;
}) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = encodePayload(
    JSON.stringify({
      version: 1,
      expiresAt,
      staffId: input.staffId,
      name: input.name,
      username: input.username,
      email: input.email,
      role: input.role,
    }),
  );
  const signature = await signPayload(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt,
    session: {
      staffId: input.staffId,
      name: input.name,
      username: input.username,
      email: input.email,
      role: input.role,
      expiresAt,
    } satisfies StaffSession,
  };
}

export async function verifySessionToken(token?: string | null): Promise<StaffSession | null> {
  if (!token) return null;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const payload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);

  let expectedSignature: string;

  try {
    expectedSignature = await signPayload(payload);
  } catch {
    return null;
  }

  if (expectedSignature !== providedSignature) {
    return null;
  }

  try {
    const decoded = JSON.parse(decodePayload(payload)) as {
      version: number;
      expiresAt: number;
      staffId: string;
      name: string;
      username: string;
      email: string | null;
      role: string;
    };

    if (decoded.version !== 1) {
      return null;
    }

    if (!Number.isFinite(decoded.expiresAt) || decoded.expiresAt <= Date.now()) {
      return null;
    }

    if (!decoded.staffId || !decoded.name || !decoded.username || !isStaffRole(decoded.role)) {
      return null;
    }

    return {
      staffId: decoded.staffId,
      name: decoded.name,
      username: decoded.username,
      email: decoded.email ?? null,
      role: decoded.role,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

export function sanitizeNextPath(input?: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/";
  }

  return input;
}

export function canAccessWithSession(session: StaffSession, pathname: string) {
  return canAccessPath(session.role, pathname);
}
