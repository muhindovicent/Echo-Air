/**
 * Shared, server-only Prisma Client singleton.
 *
 * A single PrismaClient instance is reused across API requests within the
 * same server process. This avoids exhausting database connections and
 * ensures consistent transactional behavior. The client is bound to
 * `DATABASE_URL` and must never be disconnected after each request.
 *
 * This module is server-only: it imports `@prisma/client` and must never be
 * imported from a Client Component.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
