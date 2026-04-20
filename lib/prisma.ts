import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaInitError: unknown;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function requirePrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    const client = createPrismaClient();

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }

    prismaInitError = undefined;
    return client;
  } catch (error) {
    prismaInitError = error;
    throw error;
  }
}

export function describeDatabaseIssue(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (/DATABASE_URL/i.test(error.message)) {
      return "The hosted database is not configured yet. Add DATABASE_URL in Vercel, redeploy, then run Prisma migrations.";
    }

    return "The hosted database cannot be reached right now. Check the Postgres connection string and network access.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return "The hosted database is online, but the schema has not been applied yet. Run `pnpm db:deploy` and `pnpm db:seed`.";
    }
  }

  const message = error instanceof Error ? error.message : String(error ?? "");

  if (/DATABASE_URL/i.test(message)) {
    return "The hosted database is not configured yet. Add DATABASE_URL in Vercel, redeploy, then run Prisma migrations.";
  }

  if (/P1001|can't reach database server|ECONNREFUSED|ECONNRESET|timeout/i.test(message)) {
    return "The hosted database cannot be reached right now. Check the Postgres connection string and network access.";
  }

  if (/relation .* does not exist|table .* does not exist|no such table|P2021|P2022/i.test(message)) {
    return "The hosted database is online, but the schema has not been applied yet. Run `pnpm db:deploy` and `pnpm db:seed`.";
  }

  return prismaInitError ? "The hosted database is not ready yet. Check the connection string and rerun the Prisma migration and seed steps." : null;
}
