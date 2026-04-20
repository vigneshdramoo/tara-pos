const SESSION_COOKIE_NAME = "tara-pos-session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();
let signingKeyPromise: Promise<CryptoKey> | null = null;

function toBase64Url(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
  return Boolean(process.env.POS_ADMIN_PASSWORD && process.env.POS_SESSION_SECRET);
}

export function isProtectionEnabled() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.POS_ADMIN_PASSWORD);
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export async function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `v1:${expiresAt}`;
  const signature = await signPayload(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt,
  };
}

export async function verifySessionToken(token?: string | null) {
  if (!token) return false;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return false;

  const payload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const [version, expiresAtRaw] = payload.split(":");

  if (version !== "v1" || !expiresAtRaw) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expectedSignature = await signPayload(payload);
  return expectedSignature === providedSignature;
}

export function isPasswordValid(password: string) {
  return Boolean(process.env.POS_ADMIN_PASSWORD) && password === process.env.POS_ADMIN_PASSWORD;
}

export function sanitizeNextPath(input?: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/";
  }

  return input;
}
