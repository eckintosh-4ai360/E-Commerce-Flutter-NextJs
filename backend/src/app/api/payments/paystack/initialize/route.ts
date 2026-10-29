import { after } from 'next/server';

import { requireUser } from '@/lib/auth';
import { rememberCheckoutDetails } from '@/lib/customers';
import { HttpError } from '@/lib/errors';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { createOrder, readIdempotencyKey } from '@/lib/orders';
import { paystackCheckoutForOrder } from '@/lib/paystack';
import { rateLimit, rateLimitByIp } from '@/lib/rate-limit';
import { createOrderSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export const POST = route(async (request) => {
  rateLimitByIp(request, 'paystack:initialize', { limit: 30, windowMs: 60_000 });
  const user = await requireUser(request);
  rateLimit(`paystack:initialize:${user.uid}`, { limit: 10, windowMs: 60_000 });

  const input = await readJson(request, createOrderSchema);
  if (input.paymentMethod !== 'PAYSTACK') {
    throw new HttpError(400, 'Choose Paystack before starting an online payment.');
  }
  if (!user.email) {
    throw new HttpError(
      400,
      'Paystack requires an email address. Sign in with an account that has an email address or choose payment on delivery.',
    );
  }

  const { order, created } = await createOrder(user, input, readIdempotencyKey(request));
  const payment = paystackCheckoutForOrder(order);

  if (created) {
    after(() =>
      rememberCheckoutDetails(user, {
        name: input.customerName,
        phone: input.customerPhone,
      }),
    );
  }

  return jsonResponse(
    {
      message: 'Paystack checkout is ready.',
      ...payment,
    },
    { status: created ? 201 : 200, headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
