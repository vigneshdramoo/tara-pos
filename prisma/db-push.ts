import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function fail(message: string): never {
  throw new Error(message);
}

const prismaDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(prismaDir, "..");

if (!process.env.DATABASE_URL) {
  const envPath = path.join(rootDir, ".env");

  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, "utf8");

    for (const rawLine of envFile.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const prismaBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("file:")) {
  fail("DATABASE_URL must use a local SQLite file URL such as file:./dev.db");
}

const dbPath = path.resolve(prismaDir, databaseUrl.slice("file:".length));
const diffUrl = pathToFileURL(dbPath).toString();
mkdirSync(path.dirname(dbPath), { recursive: true });

if (!existsSync(dbPath)) {
  writeFileSync(dbPath, "");
}

const diffSql = execFileSync(
  prismaBin,
  [
    "migrate",
    "diff",
    "--from-url",
    diffUrl,
    "--to-schema-datamodel",
    path.join("prisma", "schema.prisma"),
    "--script",
  ],
  {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);

if (!diffSql.trim()) {
  console.log("Database schema is already in sync.");
  process.exit(0);
}

const sqliteResult = spawnSync("sqlite3", [dbPath], {
  cwd: rootDir,
  input: diffSql,
  encoding: "utf8",
  stdio: ["pipe", "inherit", "inherit"],
});

if (sqliteResult.error) {
  fail(`Failed to execute sqlite3: ${sqliteResult.error.message}`);
}

if (sqliteResult.status !== 0) {
  process.exit(sqliteResult.status ?? 1);
}

console.log(`SQLite schema synced at ${path.relative(rootDir, dbPath)}`);
