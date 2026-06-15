import assert from 'node:assert/strict';
import { test } from 'node:test';

import { discountPercent, formatMoney, formatPrice, roundMoney } from '@/lib/money';
import { shippingFeeFor } from '@/lib/store-config';

test('roundMoney removes floating point noise', () => {
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(19.999), 20);
  assert.equal(roundMoney(1.005), 1.01);
});

test('formatMoney groups thousands and keeps two decimals', () => {
  assert.equal(formatMoney(1234.5), 'GH₵ 1,234.50');
  assert.equal(formatMoney(0), 'GH₵ 0.00');
  assert.equal(formatMoney(-25), '-GH₵ 25.00');
  assert.equal(formatMoney(1500000, { decimals: 0 }), 'GH₵ 1,500,000');
});

test('formatPrice drops decimals only for whole amounts', () => {
  assert.equal(formatPrice(150), 'GH₵ 150');
  assert.equal(formatPrice(89.5), 'GH₵ 89.50');
});

test('discountPercent needs an original price above the price', () => {
  assert.equal(discountPercent(50, 120), 58);
  assert.equal(discountPercent(100, null), null);
  assert.equal(discountPercent(100, 100), null);
  assert.equal(discountPercent(100, 80), null);
});

test('shipping is free from the threshold upwards', () => {
  assert.equal(shippingFeeFor(299.99), 25);
  assert.equal(shippingFeeFor(300), 0);
});
