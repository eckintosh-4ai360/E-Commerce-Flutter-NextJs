import { PrismaClient } from '@prisma/client';

const neonTimeoutSeconds = '30';

/**
 * Neon can take several seconds to wake an idle compute. Give both opening a
 * connection and acquiring one from Prisma's local pool enough time to finish
 * instead of failing the first website/API requests with P1001 or P2024.
 * Larger explicit settings (and zero, which disables a timeout) still win.
 */
export function withNeonTimeoutDefaults(value: string | undefined) {
  if (!value) {
    return value;
  }

  try {
    const url = new URL(value);
    if (!url.hostname.endsWith('.neon.tech')) {
      return value;
    }

    ensureMinimumTimeout(url, 'connect_timeout');
    ensureMinimumTimeout(url, 'pool_timeout');
    return url.toString();
  } catch {
    // Let Prisma report malformed connection strings with its normal error.
    return value;
  }
}

function ensureMinimumTimeout(url: URL, parameter: string) {
  const configured = Number(url.searchParams.get(parameter));
  if (
    !url.searchParams.has(parameter) ||
    !Number.isFinite(configured) ||
    (configured > 0 && configured < Number(neonTimeoutSeconds))
  ) {
    url.searchParams.set(parameter, neonTimeoutSeconds);
  }
}

// Reuse one client per process. In development, Next.js hot reloading
// re-evaluates modules, so the client is parked on globalThis to avoid
// opening a new connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    const datasourceUrl = withNeonTimeoutDefaults(process.env.DATABASE_URL);
    globalForPrisma.prisma = new PrismaClient(
      datasourceUrl ? { datasourceUrl } : undefined,
    );
  }

  return globalForPrisma.prisma;
}
