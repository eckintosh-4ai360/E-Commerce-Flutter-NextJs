import { after } from 'next/server';

import { requireUser } from '@/lib/auth';
import { rememberCheckoutDetails } from '@/lib/customers';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { HttpError } from '@/lib/errors';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { createOrder, listCustomerOrders, readIdempotencyKey } from '@/lib/orders';
import { rateLimit, rateLimitByIp } from '@/lib/rate-limit';
import { serialiseOrder } from '@/lib/serializers';
import { createOrderSchema } from '@/lib/validation';

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
  rateLimitByIp(request, 'orders:create', { limit: 60, windowMs: 60_000 });
  const user = await requireUser(request);
  rateLimit(`orders:create:${user.uid}`, { limit: 10, windowMs: 60_000 });

  const input = await readJson(request, createOrderSchema);
  if (input.paymentMethod === 'PAYSTACK') {
    throw new HttpError(400, 'Start Paystack payments through the secure payment endpoint.');
  }
  const { order, created } = await createOrder(user, input, readIdempotencyKey(request));

  if (created) {
    after(async () => {
      await Promise.allSettled([
        sendOrderConfirmationEmail(order),
        rememberCheckoutDetails(user, {
          name: input.customerName,
          phone: input.customerPhone,
        }),
      ]);
    });
  }

  return jsonResponse(
    {
      message: created ? 'Order created successfully.' : 'Order already placed.',
      order: serialiseOrder(order, 'owner'),
    },
    { status: created ? 201 : 200, headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
