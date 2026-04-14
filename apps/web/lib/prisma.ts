import type { PrismaClient as PgPrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PgPrismaClient | undefined;
};

function createPrismaClient(): PgPrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("file:")) {
    // SQLite mode — used for E2E tests only, never in production
    // require() is intentional: avoids bundling better-sqlite3 in non-test builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: SQLiteClient } = require("./generated/prisma-test/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url });
    return new SQLiteClient({ adapter }) as unknown as PgPrismaClient;
  }

  // PostgreSQL mode — production
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("./generated/prisma/client");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter }) as PgPrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
