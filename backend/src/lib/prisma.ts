import { PrismaClient } from '@prisma/client';

// Reuse one client per process. In development, Next.js hot reloading
// re-evaluates modules, so the client is parked on globalThis to avoid
// opening a new connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}
