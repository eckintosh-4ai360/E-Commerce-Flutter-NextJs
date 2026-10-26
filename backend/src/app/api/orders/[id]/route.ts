import { getAuthenticatedUser } from '@/lib/auth';
import { HttpError } from '@/lib/errors';
import { jsonResponse, preflight, privateNoStoreHeaders, route } from '@/lib/http';
import { findOrderByReference, ownsOrder } from '@/lib/orders';
import { rateLimitByIp } from '@/lib/rate-limit';
import { serialiseOrder } from '@/lib/serializers';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

/**
 * Order tracking by tracking code or full order id. Anyone with the code sees
 * status and items; contact details are only returned to the order's owner.
 */
export const GET = route<Context>(async (request, { params }) => {
  rateLimitByIp(request, 'orders:track', { limit: 60, windowMs: 60_000 });
  const { id } = await params;

  const order = await findOrderByReference(id);
  if (!order) {
    throw new HttpError(404, 'We could not find an order with that tracking code.');
  }

  // An expired session should still see the public tracking view.
  const user = await getAuthenticatedUser(request).catch(() => null);
  const view = user && ownsOrder(user, order) ? 'owner' : 'public';

  return jsonResponse(
    { order: serialiseOrder(order, view) },
    { headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
