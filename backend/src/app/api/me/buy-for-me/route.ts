import { requireUser } from '@/lib/auth';
import { jsonResponse, preflight, privateNoStoreHeaders, readJson, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { createBuyForMeSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const GET = route(async (request) => {
  const user = await requireUser(request);
  const requests = await getPrisma().buyForMeRequest.findMany({ where: { customerUid: user.uid }, orderBy: { createdAt: 'desc' }, take: 100 });
  return jsonResponse({ requests }, { headers: privateNoStoreHeaders });
});
export const POST = route(async (request) => {
  const user = await requireUser(request);
  rateLimit(`buy-for-me:create:${user.uid}`, { limit: 5, windowMs: 60_000 });
  const input = await readJson(request, createBuyForMeSchema);
  const item = await getPrisma().buyForMeRequest.create({ data: { ...input, deliveryAddress: input.deliveryMethod === 'DELIVERY' ? input.deliveryAddress : null, customerUid: user.uid, customerEmail: user.email } });
  return jsonResponse({ request: item, message: 'Request submitted. Our team will review it and contact you.' }, { status: 201, headers: privateNoStoreHeaders });
});
export const OPTIONS = preflight;
