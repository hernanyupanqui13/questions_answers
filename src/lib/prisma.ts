import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across hot-reloads in dev
// See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
