import { createHmac, timingSafeEqual } from 'node:crypto';

import { HttpError } from './errors';
import { getSiteBaseUrl } from './http';
import { getPrisma } from './prisma';
import { orderInclude, trackingCodeFor, type OrderWithRelations } from './serializers';
import { storeConfig } from './store-config';

const paystackReferencePattern = /^globacart-[a-z0-9]{20,64}$/;

export type PaystackWebhookPayment = {
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
      'Online payments are not configured. Set a Paystack secret key.',
    );
  }
  if (!secret.startsWith('sk_live_') && !secret.startsWith('sk_test_')) {
    throw new HttpError(503, 'Online payments require a valid Paystack secret key.');
  }
  return secret;
}

function getPaystackLivePublicKey() {
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new HttpError(
      503,
      'Online payments are not configured. Set a Paystack public key.',
    );
  }
  if (!publicKey.startsWith('pk_live_') && !publicKey.startsWith('pk_test_')) {
    throw new HttpError(503, 'Online payments require a valid Paystack public key.');
  }
  return publicKey;
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

/**
 * The browser uses this public data to open Paystack InlineJS. The live secret
 * never leaves the server; a signed Paystack webhook is still required before
 * the order is marked paid.
 */
export function paystackCheckoutForOrder(order: OrderWithRelations) {
  if (order.paymentMethod !== 'PAYSTACK' || !order.paymentReference) {
    throw new HttpError(400, 'This order is not configured for Paystack.');
  }
  if (order.status === 'CANCELLED') {
    throw new HttpError(409, 'This order has been cancelled.');
  }
  if (order.paymentStatus === 'PAID') {
    throw new HttpError(409, 'This order has already been paid.');
  }
  if (!order.customerEmail) {
    throw new HttpError(400, 'An email address is required for Paystack payment.');
  }

  // The secret is never returned, but checking it here prevents checkout from
  // opening when the webhook could not safely confirm the payment afterwards.
  getPaystackLiveSecret();

  return {
    publicKey: getPaystackLivePublicKey(),
    email: order.customerEmail,
    phone: order.customerPhone,
    amount: toPaystackAmount(order.total),
    currency: storeConfig.currencyCode,
    reference: order.paymentReference,
    trackingCode: order.trackingCode ?? trackingCodeFor(order.id),
  };
}

export function readHostedCheckoutUrl(value: unknown, expectedReference: string) {
  const response = value as {
    status?: boolean;
    data?: { authorization_url?: string; reference?: string };
  } | null;
  const urlText = response?.data?.authorization_url;
  if (
    response?.status !== true ||
    response.data?.reference !== expectedReference ||
    typeof urlText !== 'string'
  ) {
    throw new HttpError(502, 'Paystack could not start this payment. Please try again.');
  }
  try {
    const url = new URL(urlText);
    if (
      url.protocol === 'https:' &&
      url.hostname === 'checkout.paystack.com' &&
      !url.port &&
      !url.username &&
      !url.password
    ) {
      return urlText;
    }
  } catch {
    // The gateway response must be a valid HTTPS checkout URL.
  }
  throw new HttpError(502, 'Paystack could not start this payment. Please try again.');
}

/** Opens a Paystack-hosted checkout for mobile clients without exposing the secret key. */
export async function hostedPaystackCheckoutForOrder(order: OrderWithRelations) {
  const checkout = paystackCheckoutForOrder(order);
  if (order.paymentAuthorizationUrl) {
    return {
      authorizationUrl: order.paymentAuthorizationUrl,
      trackingCode: checkout.trackingCode,
    };
  }

  let response: Response;
  try {
    response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getPaystackLiveSecret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: checkout.email,
        amount: checkout.amount,
        currency: checkout.currency,
        reference: checkout.reference,
        callback_url: `${getSiteBaseUrl()}/api/payments/paystack/callback?source=app`,
        channels: ['card', 'mobile_money'],
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
  } catch {
    throw new HttpError(503, 'Paystack is unavailable right now. Please try again.');
  }

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new HttpError(502, 'Paystack could not start this payment. Please try again.');
  }
  const authorizationUrl = readHostedCheckoutUrl(result, checkout.reference);

  await getPrisma().order.updateMany({
    where: { id: order.id, paymentAuthorizationUrl: null },
    data: { paymentAuthorizationUrl: authorizationUrl },
  });
  const saved = await getPrisma().order.findUniqueOrThrow({
    where: { id: order.id },
    select: { paymentAuthorizationUrl: true },
  });
  return {
    authorizationUrl: saved.paymentAuthorizationUrl ?? authorizationUrl,
    trackingCode: checkout.trackingCode,
  };
}

export type PaystackSettlement = {
  order: OrderWithRelations;
  outcome: 'success' | 'pending' | 'cancelled';
  newlyPaid: boolean;
};

export async function getPaystackOrderByReference(reference: string) {
  if (!paystackReferencePattern.test(reference)) {
    return null;
  }

  return getPrisma().order.findFirst({
    where: { paymentReference: reference, paymentMethod: 'PAYSTACK' },
    include: orderInclude,
  });
}

/**
 * Settles an order only from the payment details carried in a verified Paystack
 * webhook. This deliberately makes no outbound API call: the HMAC signature
 * proves the payload originated from Paystack, and all order-critical fields
 * (reference, amount, currency and email) are checked against our own record.
 */
export async function settlePaystackPayment(
  payment: PaystackWebhookPayment,
): Promise<PaystackSettlement | null> {
  if (!paystackReferencePattern.test(payment.reference)) {
    throw new HttpError(400, 'Invalid Paystack reference.');
  }

  const existing = await getPaystackOrderByReference(payment.reference);
  if (!existing) {
    return null;
  }
  if (existing.status === 'CANCELLED') {
    return { order: existing, outcome: 'cancelled', newlyPaid: false };
  }
  if (existing.paymentStatus === 'PAID') {
    return { order: existing, outcome: 'success', newlyPaid: false };
  }

  const expectedEmail = existing.customerEmail?.trim().toLowerCase();
  const actualEmail = payment.customer?.email?.trim().toLowerCase();
  const isLive = getPaystackLiveSecret().startsWith('sk_live_');
  const expectedDomain = isLive ? 'live' : 'test';
  if (
    payment.domain !== expectedDomain ||
    payment.status !== 'success' ||
    payment.amount !== toPaystackAmount(existing.total) ||
    payment.currency.toUpperCase() !== storeConfig.currencyCode ||
    !actualEmail ||
    expectedEmail !== actualEmail
  ) {
    throw new HttpError(409, 'Paystack payment did not match this order.');
  }

  const update = await getPrisma().order.updateMany({
    where: { id: existing.id, paymentStatus: { not: 'PAID' } },
    data: { paymentStatus: 'PAID', paidAt: new Date() },
  });
  const order = await getPrisma().order.findUniqueOrThrow({
    where: { id: existing.id },
    include: orderInclude,
  });
  return { order, outcome: 'success', newlyPaid: update.count === 1 };
}

export function isPaystackWebhookPayment(value: unknown): value is PaystackWebhookPayment {
  if (!value || typeof value !== 'object') return false;
  const payment = value as Record<string, unknown>;
  if (
    typeof payment.domain !== 'string' ||
    typeof payment.status !== 'string' ||
    typeof payment.reference !== 'string' ||
    typeof payment.amount !== 'number' ||
    !Number.isSafeInteger(payment.amount) ||
    payment.amount <= 0 ||
    typeof payment.currency !== 'string'
  ) {
    return false;
  }

  if (payment.customer === undefined) return true;
  if (!payment.customer || typeof payment.customer !== 'object') return false;
  const customer = payment.customer as Record<string, unknown>;
  return customer.email === undefined || typeof customer.email === 'string';
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
