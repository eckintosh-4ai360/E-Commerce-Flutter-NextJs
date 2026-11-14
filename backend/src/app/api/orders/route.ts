import { requireUser } from '@/lib/auth';
import { HttpError } from '@/lib/errors';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  route,
} from '@/lib/http';
import { listCustomerOrders } from '@/lib/orders';
import { rateLimit } from '@/lib/rate-limit';
import { serialiseOrder } from '@/lib/serializers';

export const runtime = 'nodejs';

/** The signed-in customer's own orders. */
export const GET = route(async (request) => {
  const user = await requireUser(request);
  rateLimit(`orders:list:${user.uid}`, { limit: 60, windowMs: 60_000 });

  const orders = await listCustomerOrders(user);
  return jsonResponse(
    { orders: orders.map((order) => serialiseOrder(order, 'owner')) },
    { headers: privateNoStoreHeaders },
  );
});

export const POST = route(async (request) => {
  await requireUser(request);
  throw new HttpError(410, 'Payment on delivery is no longer available. Update the app to pay online.');
});

export const OPTIONS = preflight;
