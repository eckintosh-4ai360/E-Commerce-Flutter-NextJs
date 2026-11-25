import { requireAdmin } from '@/lib/auth';
import { jsonResponse, preflight, privateNoStoreHeaders, readJson, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { updateBuyForMeSchema } from '@/lib/validation';
export const runtime = 'nodejs';
export const PATCH = route<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const input = await readJson(request, updateBuyForMeSchema);
  const item = await getPrisma().buyForMeRequest.update({ where: { id }, data: input });
  return jsonResponse({ request: item }, { headers: privateNoStoreHeaders });
});
export const OPTIONS = preflight;
