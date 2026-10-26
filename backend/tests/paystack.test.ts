import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isPaystackWebhookPayment,
  paystackReferenceForOrder,
  toPaystackAmount,
  verifyPaystackSignature,
} from '@/lib/paystack';

test('Paystack receives Ghana cedis as integer pesewas', () => {
  assert.equal(toPaystackAmount(175), 17_500);
  assert.equal(toPaystackAmount(99.99), 9_999);
});

test('Paystack order references are deterministic and gateway-safe', () => {
  assert.equal(
    paystackReferenceForOrder('cm1234567890abcdefghijkl'),
    'globacart-cm1234567890abcdefghijkl',
  );
});

test('Paystack webhook signatures must match the raw request body', () => {
  const secret = 'sk_live_example';
  const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'ref' } });
  const signature = createHmac('sha512', secret).update(payload).digest('hex');

  assert.equal(verifyPaystackSignature(payload, signature, secret), true);
  assert.equal(verifyPaystackSignature(`${payload} `, signature, secret), false);
  assert.equal(verifyPaystackSignature(payload, null, secret), false);
});

test('only complete Paystack webhook payment data is accepted for settlement', () => {
  assert.equal(
    isPaystackWebhookPayment({
      domain: 'live',
      status: 'success',
      reference: 'globacart-cm1234567890abcdefghijkl',
      amount: 17_500,
      currency: 'GHS',
      customer: { email: '[email protected]' },
    }),
    true,
  );
  assert.equal(
    isPaystackWebhookPayment({
      domain: 'live',
      status: 'success',
      reference: 'globacart-cm1234567890abcdefghijkl',
      amount: 17_500.5,
      currency: 'GHS',
    }),
    false,
  );
});
