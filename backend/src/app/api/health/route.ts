import { jsonResponse, preflight, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';

export const GET = route(async () => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return jsonResponse(
      { status: 'ok', checkedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[health] Database check failed', error);
    return jsonResponse(
      { status: 'degraded', checkedAt: new Date().toISOString() },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
});

export const OPTIONS = preflight;
