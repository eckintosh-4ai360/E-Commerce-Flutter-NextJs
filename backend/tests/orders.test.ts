import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AuthenticatedUser } from '@/lib/auth';
import { createOrderId, normaliseTrackingInput, ownsOrder } from '@/lib/orders';
import {
  hasOpenReturn,
  isWithinReturnWindow,
  resolveImageUrl,
  serialiseOrder,
  trackingCodeFor,
  type OrderWithRelations,
} from '@/lib/serializers';

const user = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  uid: 'uid-1',
  email: 'ama@example.com',
  name: 'Ama',
  picture: null,
  emailVerified: true,
  ...overrides,
});

function order(overrides: Partial<OrderWithRelations> = {}): OrderWithRelations {
  const createdAt = new Date('2026-01-01T10:00:00Z');
  return {
    id: 'cabc123def456ghi789jkl0mn',
    trackingCode: null,
    customerUid: 'uid-1',
    customerName: 'Ama Serwaa Mensah',
    customerEmail: 'ama@example.com',
    customerPhone: '059 859 9687',
    deliveryAddress: '12 Oxford St, Osu',
    notes: 'Call on arrival',
    paymentMethod: 'CASH_ON_DELIVERY',
    clientRequestId: null,
    subtotal: 100,
    shippingFee: 25,
    total: 125,
    status: 'PENDING',
    createdAt,
    updatedAt: createdAt,
    items: [
      {
        id: 'item-1',
        orderId: 'cabc123def456ghi789jkl0mn',
        productId: 1,
        productName: 'Tote',
        unitPrice: 100,
        quantity: 1,
        selectedColor: 'Black',
        selectedSize: null,
        product: { imagePath: '/products/tote.jpg' },
      },
    ],
    events: [],
    returnRequests: [],
    ...overrides,
  };
}

test('order ids end in 10 random lowercase characters', () => {
  const ids = new Set(Array.from({ length: 500 }, () => createOrderId()));
  assert.equal(ids.size, 500);
  for (const id of ids) {
    assert.match(id, /^c[0-9a-z]{20,}$/);
  }
  assert.equal(trackingCodeFor('cabc123def456ghi789jkl0mn'), 'I789JKL0MN');
});

test('tracking input is normalised', () => {
  assert.equal(normaliseTrackingInput('  #ABC 123 DEF4 '), 'ABC123DEF4');
});

test('ownership uses uid, or verified email for legacy orders', () => {
  assert.equal(ownsOrder(user(), { customerUid: 'uid-1', customerEmail: null }), true);
  assert.equal(ownsOrder(user(), { customerUid: 'uid-2', customerEmail: 'ama@example.com' }), false);
  assert.equal(ownsOrder(user(), { customerUid: null, customerEmail: 'AMA@example.com' }), true);
  assert.equal(
    ownsOrder(user({ emailVerified: false }), { customerUid: null, customerEmail: 'ama@example.com' }),
    false,
  );
});

test('public tracking view hides personal details', () => {
  const view = serialiseOrder(order(), 'public');
  assert.equal(view.isRedacted, true);
  assert.equal(view.customerName, 'Ama');
  assert.equal(view.customerPhone, '••• ••• 687');
  assert.equal(view.customerEmail, null);
  assert.equal(view.deliveryAddress, null);
  assert.equal(view.notes, null);
  assert.equal(view.canCancel, false);
  assert.equal(view.trackingCode, trackingCodeFor(order().id));
  assert.equal(view.events.length, 1, 'orders without events still show when they were placed');
});

test('owner view exposes details and actions', () => {
  const view = serialiseOrder(order(), 'owner');
  assert.equal(view.isRedacted, false);
  assert.equal(view.deliveryAddress, '12 Oxford St, Osu');
  assert.equal(view.canCancel, true);
  assert.equal(view.canRequestReturn, false);
});

test('returns are allowed within the window after delivery, once', () => {
  const deliveredAt = new Date('2026-02-01T12:00:00Z');
  const delivered = order({
    status: 'DELIVERED',
    events: [{ id: 'e1', orderId: 'x', status: 'DELIVERED', note: null, createdAt: deliveredAt }],
  });
  assert.equal(isWithinReturnWindow(delivered, new Date('2026-02-10T12:00:00Z')), true);
  assert.equal(isWithinReturnWindow(delivered, new Date('2026-02-20T12:00:00Z')), false);

  const withOpenReturn = order({
    ...delivered,
    returnRequests: [
      {
        id: 'r1',
        orderId: 'x',
        customerUid: 'uid-1',
        reason: 'Other',
        details: null,
        status: 'REQUESTED',
        adminNote: null,
        createdAt: deliveredAt,
        updatedAt: deliveredAt,
      },
    ],
  });
  assert.equal(hasOpenReturn(withOpenReturn), true);
});

test('local images become absolute only when PUBLIC_APP_URL is set', () => {
  const previous = process.env.PUBLIC_APP_URL;
  delete process.env.PUBLIC_APP_URL;
  assert.equal(resolveImageUrl('/products/a.jpg'), '/products/a.jpg');
  process.env.PUBLIC_APP_URL = 'https://shop.example.com/some/path';
  assert.equal(resolveImageUrl('/products/a.jpg'), 'https://shop.example.com/products/a.jpg');
  assert.equal(resolveImageUrl('https://cdn.example.com/b.jpg'), 'https://cdn.example.com/b.jpg');
  if (previous === undefined) delete process.env.PUBLIC_APP_URL;
  else process.env.PUBLIC_APP_URL = previous;
});
