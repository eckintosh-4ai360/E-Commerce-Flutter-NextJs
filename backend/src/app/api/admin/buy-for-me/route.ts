import { requireAdmin } from '@/lib/auth';
import { jsonResponse, preflight, privateNoStoreHeaders, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
export const runtime = 'nodejs';
export const GET = route(async (request) => {
  await requireAdmin(request);
  const requests = await getPrisma().buyForMeRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return jsonResponse({ requests }, { headers: privateNoStoreHeaders });
});
export const OPTIONS = preflight;
