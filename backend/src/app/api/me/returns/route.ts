import { requireUser } from '@/lib/auth';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { createReturnRequest, listCustomerReturns } from '@/lib/orders';
import { rateLimit } from '@/lib/rate-limit';
import { serialiseReturnRequest } from '@/lib/serializers';
import { createReturnSchema } from '@/lib/validation';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const returns = await listCustomerReturns(user);
  return jsonResponse(
    { returns: returns.map(serialiseReturnRequest) },
    { headers: privateNoStoreHeaders },
  );
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  rateLimit(`returns:create:${user.uid}`, { limit: 5, windowMs: 60_000 });
  const input = await readJson(request, createReturnSchema);
  const returnRequest = await createReturnRequest(user, input);
  return jsonResponse(
    {
      message: 'Return request submitted. We will email you once it is reviewed.',
      returnRequest: serialiseReturnRequest(returnRequest),
    },
    { status: 201, headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
