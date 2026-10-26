import { createHmac, timingSafeEqual } from 'node:crypto';

import { HttpError } from './errors';
import { getPrisma } from './prisma';
import { orderInclude, trackingCodeFor, type OrderWithRelations } from './serializers';
import { storeConfig } from './store-config';

const paystackApiBase = 'https://api.paystack.co';
const paystackReferencePattern = /^globacart-[a-z0-9]{20,64}$/;
const paystackUserAgent = 'GlobaCartGH/1.0 (+https://www.globacartgh.com)';

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackInitialization = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackVerification = {
  domain: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer?: { email?: string };
};

function getPaystackLiveSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    throw new HttpError(
      503,
      'Online payments are not configured. Set a Paystack live secret key.',
    );
  }
  if (!secret.startsWith('sk_live_')) {
    throw new HttpError(503, 'Online payments require a Paystack live secret key.');
  }
  return secret;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${paystackApiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getPaystackLiveSecret()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // Paystack can reject requests at its Cloudflare edge when the caller
        // has no identifiable user agent, particularly from serverless hosts.
        'User-Agent': paystackUserAgent,
        ...init?.headers,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error('[paystack] Request failed', error);
    throw new HttpError(502, 'Paystack could not be reached. Please try again.');
  }

  let payload: PaystackEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as PaystackEnvelope<T>;
  } catch {
    // The generic error below intentionally avoids exposing an upstream body.
  }

  if (!response.ok || !payload?.status || !payload.data) {
    console.error('[paystack] API rejected request', {
      status: response.status,
      message: payload?.message,
    });
    if (response.status === 401) {
      throw new HttpError(
        503,
        'Online payment is temporarily unavailable. The payment gateway configuration needs attention.',
      );
    }
    if (response.status === 403) {
      throw new HttpError(
        503,
        'Online payment is temporarily unavailable. Please try again shortly or choose pay on delivery.',
      );
    }
    if (response.status === 429) {
      throw new HttpError(503, 'Paystack is busy. Please wait a moment and try again.');
    }
    throw new HttpError(502, 'Paystack could not process the payment. Please try again.');
  }
  return payload.data;
}

export function paystackReferenceForOrder(orderId: string) {
  return `globacart-${orderId}`;
}

export function toPaystackAmount(amount: number) {
  const minorUnits = Math.round(amount * 100);
  if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
    throw new HttpError(400, 'The payment total is invalid.');
  }
  return minorUnits;
}

function checkoutUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(502, 'Paystack returned an invalid checkout link.');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.paystack.com') {
    throw new HttpError(502, 'Paystack returned an invalid checkout link.');
  }
  return url.toString();
}

function callbackUrl(publicBaseUrl: string) {
  const configured = process.env.PAYSTACK_CALLBACK_URL?.trim();
  let url: URL;
  try {
    url = new URL(configured || '/api/payments/paystack/callback', publicBaseUrl);
  } catch {
    throw new HttpError(503, 'PAYSTACK_CALLBACK_URL must be a fully qualified URL.');
  }
  if (url.protocol !== 'https:') {
    throw new HttpError(503, 'PAYSTACK_CALLBACK_URL must use HTTPS for live payments.');
  }
  return url.toString();
}

export async function initializePaystackPayment(
  order: OrderWithRelations,
  publicBaseUrl: string,
) {
  if (order.paymentMethod !== 'PAYSTACK' || !order.paymentReference) {
    throw new HttpError(400, 'This order is not configured for Paystack.');
  }
  if (order.paymentStatus === 'PAID') {
    return {
      authorizationUrl: new URL(
        `/account/orders/${order.trackingCode ?? trackingCodeFor(order.id)}?placed=1&payment=success`,
        publicBaseUrl,
      ).toString(),
      reference: order.paymentReference,
    };
  }
  if (order.paymentAuthorizationUrl) {
    return {
      authorizationUrl: checkoutUrl(order.paymentAuthorizationUrl),
      reference: order.paymentReference,
    };
  }

  const paymentCallbackUrl = callbackUrl(publicBaseUrl);
  const data = await paystackRequest<PaystackInitialization>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: order.customerEmail,
      amount: String(toPaystackAmount(order.total)),
      currency: storeConfig.currencyCode,
      reference: order.paymentReference,
      callback_url: paymentCallbackUrl,
      metadata: JSON.stringify({
        orderId: order.id,
        trackingCode: order.trackingCode ?? trackingCodeFor(order.id),
        environment: 'live',
      }),
    }),
  });

  if (data.reference !== order.paymentReference) {
    throw new HttpError(502, 'Paystack returned a mismatched payment reference.');
  }
  const authorizationUrl = checkoutUrl(data.authorization_url);
  await getPrisma().order.update({
    where: { id: order.id },
    data: { paymentAuthorizationUrl: authorizationUrl },
  });
  return { authorizationUrl, reference: data.reference };
}

export type PaystackSettlement = {
  order: OrderWithRelations;
  outcome: 'success' | 'pending' | 'cancelled';
  newlyPaid: boolean;
};

export async function settlePaystackPayment(
  reference: string,
): Promise<PaystackSettlement | null> {
  if (!paystackReferencePattern.test(reference)) {
    throw new HttpError(400, 'Invalid Paystack reference.');
  }

  const prisma = getPrisma();
  const existing = await prisma.order.findFirst({
    where: { paymentReference: reference },
    include: orderInclude,
  });
  if (!existing) {
    return null;
  }
  if (existing.status === 'CANCELLED') {
    return { order: existing, outcome: 'cancelled', newlyPaid: false };
  }
  if (existing.paymentStatus === 'PAID') {
    return { order: existing, outcome: 'success', newlyPaid: false };
  }

  const payment = await paystackRequest<PaystackVerification>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  const expectedEmail = existing.customerEmail?.trim().toLowerCase();
  const actualEmail = payment.customer?.email?.trim().toLowerCase();
  if (
    payment.domain !== 'live' ||
    payment.reference !== reference ||
    payment.amount !== toPaystackAmount(existing.total) ||
    payment.currency.toUpperCase() !== storeConfig.currencyCode ||
    (actualEmail && expectedEmail !== actualEmail)
  ) {
    throw new HttpError(409, 'Paystack verification did not match this order.');
  }
  if (payment.status !== 'success') {
    return { order: existing, outcome: 'pending', newlyPaid: false };
  }

  const paidAt = new Date();
  const update = await prisma.order.updateMany({
    where: { id: existing.id, paymentStatus: { not: 'PAID' } },
    data: { paymentStatus: 'PAID', paidAt },
  });
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: existing.id },
    include: orderInclude,
  });
  return { order, outcome: 'success', newlyPaid: update.count === 1 };
}

export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
  secret = getPaystackLiveSecret(),
) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) {
    return false;
  }
  const expected = createHmac('sha512', secret).update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
