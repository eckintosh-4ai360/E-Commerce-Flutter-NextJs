import { after } from 'next/server';

import { requireUser } from '@/lib/auth';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import { jsonResponse, preflight, privateNoStoreHeaders, route } from '@/lib/http';
import { cancelOrder } from '@/lib/orders';
import { rateLimit } from '@/lib/rate-limit';
import { serialiseOrder } from '@/lib/serializers';

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (request, { params }) => {
  const user = await requireUser(request);
  rateLimit(`orders:cancel:${user.uid}`, { limit: 10, windowMs: 60_000 });
  const { id } = await params;

  const order = await cancelOrder(user, id);
  after(() =>
    sendOrderStatusUpdateEmail({
      order,
      previousStatus: 'PENDING',
      note: 'You cancelled this order.',
    }),
  );

  return jsonResponse(
    { message: 'Order cancelled.', order: serialiseOrder(order, 'owner') },
    { headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
