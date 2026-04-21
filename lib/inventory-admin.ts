import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { describeDatabaseIssue } from "@/lib/prisma";

export class InventoryAdminError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function requireText(value: unknown, label: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new InventoryAdminError(`${label} is required.`, 400);
  }

  return normalized;
}

export function optionalText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

export function parseNonNegativeInteger(value: unknown, label: string) {
  const normalized = typeof value === "number" ? value : Number(normalizeText(value));

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new InventoryAdminError(`${label} must be a whole number of 0 or more.`, 400);
  }

  return normalized;
}

export function parsePositiveInteger(value: unknown, label: string) {
  const normalized = typeof value === "number" ? value : Number(normalizeText(value));

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new InventoryAdminError(`${label} must be a whole number greater than 0.`, 400);
  }

  return normalized;
}

export function parseSignedInteger(value: unknown, label: string) {
  const normalized = typeof value === "number" ? value : Number(normalizeText(value));

  if (!Number.isInteger(normalized) || normalized === 0) {
    throw new InventoryAdminError(`${label} must be a whole number above or below zero.`, 400);
  }

  return normalized;
}

export function parsePriceToCents(value: unknown) {
  const normalized = typeof value === "number" ? value : Number(normalizeText(value));

  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new InventoryAdminError("Price must be 0 or higher.", 400);
  }

  return Math.round(normalized * 100);
}

export function normalizeAccentHex(value: unknown) {
  const normalized = normalizeText(value).toUpperCase();

  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    throw new InventoryAdminError("Accent colour must be a hex value like #CA9E5B.", 400);
  }

  return normalized;
}

export function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function revalidateInventoryPaths() {
  revalidatePath("/");
  revalidatePath("/assistant");
  revalidatePath("/inventory");
  revalidatePath("/pos");
}

export function duplicateFieldMessage(error: Prisma.PrismaClientKnownRequestError) {
  const target = Array.isArray(error.meta?.target)
    ? error.meta?.target.join(", ")
    : String(error.meta?.target ?? "");

  if (/sku/i.test(target)) {
    return "That SKU is already in use.";
  }

  if (/slug/i.test(target)) {
    return "That product slug already exists.";
  }

  return "A product with one of these values already exists.";
}

export function describeInventoryAdminIssue(error: unknown) {
  if (error instanceof InventoryAdminError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return {
      message: duplicateFieldMessage(error),
      status: 409,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return {
      message: "That product could not be found anymore.",
      status: 404,
    };
  }

  const databaseIssue = describeDatabaseIssue(error);
  if (databaseIssue) {
    return {
      message: databaseIssue,
      status: 503,
    };
  }

  return null;
}
