import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addressSchema,
  createOrderSchema,
  createProductSchema,
  phoneSchema,
  updateProfileSchema,
} from '@/lib/validation';

const validOrder = {
  customerName: '  Ama Mensah ',
  customerPhone: '059 859  9687',
  deliveryAddress: '12 Oxford Street, Osu',
  items: [{ productId: 1, quantity: 2, selectedColor: '' }],
};

test('a valid order is normalised', () => {
  const parsed = createOrderSchema.parse(validOrder);
  assert.equal(parsed.customerName, 'Ama Mensah');
  assert.equal(parsed.customerPhone, '059 859 9687');
  assert.equal(parsed.paymentMethod, 'CASH_ON_DELIVERY');
  assert.equal(parsed.items[0].selectedColor, null);
  assert.equal(parsed.notes, null);
});

test('order quantities must be whole numbers between 1 and 20', () => {
  for (const quantity of [0, -1, 1.5, 21]) {
    const result = createOrderSchema.safeParse({ ...validOrder, items: [{ productId: 1, quantity }] });
    assert.equal(result.success, false, `quantity ${quantity} should be rejected`);
  }
});

test('orders need a delivery address and at least one item', () => {
  assert.equal(createOrderSchema.safeParse({ ...validOrder, deliveryAddress: '' }).success, false);
  assert.equal(createOrderSchema.safeParse({ ...validOrder, items: [] }).success, false);
  assert.equal(
    createOrderSchema.safeParse({ ...validOrder, paymentMethod: 'CARD' }).success,
    false,
  );
});

test('Paystack is allowed at checkout but not stored as an on-delivery preference', () => {
  assert.equal(
    createOrderSchema.safeParse({ ...validOrder, paymentMethod: 'PAYSTACK' }).success,
    true,
  );
  assert.equal(
    updateProfileSchema.safeParse({ preferredPaymentMethod: 'PAYSTACK' }).success,
    false,
  );
});

test('phone numbers allow common formats only', () => {
  for (const phone of ['0598599687', '+233 59 859 9687', '(059) 859-9687']) {
    assert.equal(phoneSchema.safeParse(phone).success, true, phone);
  }
  for (const phone of ['12345', 'call me', '0598599687<script>']) {
    assert.equal(phoneSchema.safeParse(phone).success, false, phone);
  }
});

test('profile phone can be cleared with an empty string', () => {
  assert.deepEqual(updateProfileSchema.parse({ phone: '' }), { phone: null });
});

test('addresses require street, city and region', () => {
  const result = addressSchema.safeParse({
    label: 'Home',
    recipientName: 'Ama',
    phone: '0598599687',
    street: '',
    city: 'Accra',
    region: 'Greater Accra',
  });
  assert.equal(result.success, false);
});

const validProduct = {
  name: 'Tote',
  description: 'A bag',
  price: 100,
  imagePath: '/products/tote.jpg',
  category: 'Bags',
};

test('product defaults are filled and lists de-duplicated', () => {
  const parsed = createProductSchema.parse({ ...validProduct, colors: ['Black', 'Black', ' Tan '] });
  assert.deepEqual(parsed.colors, ['Black', 'Tan']);
  assert.equal(parsed.inStock, true);
  assert.equal(parsed.rating, 4.5);
  assert.deepEqual(parsed.galleryImages, []);
});

test('original price must exceed the price', () => {
  assert.equal(createProductSchema.safeParse({ ...validProduct, originalPrice: 90 }).success, false);
  assert.equal(createProductSchema.safeParse({ ...validProduct, originalPrice: 150 }).success, true);
});

test('product images must be https URLs or local paths', () => {
  for (const imagePath of ['javascript:alert(1)', '//evil.example/x.jpg', '/products/../../etc/passwd', 'http://insecure.example/x.jpg']) {
    assert.equal(createProductSchema.safeParse({ ...validProduct, imagePath }).success, false, imagePath);
  }
  assert.equal(
    createProductSchema.safeParse({ ...validProduct, imagePath: 'https://res.cloudinary.com/demo/image/upload/x.jpg' }).success,
    true,
  );
});

test('products allow one main image and up to four distinct gallery images', () => {
  const galleryImages = [
    '/products/tote-side.jpg',
    '/products/tote-back.jpg',
    'https://res.cloudinary.com/demo/image/upload/tote-detail.jpg',
    '/products/tote-inside.jpg',
  ];
  assert.equal(
    createProductSchema.safeParse({ ...validProduct, galleryImages }).success,
    true,
  );
  assert.equal(
    createProductSchema.safeParse({
      ...validProduct,
      galleryImages: [...galleryImages, '/products/tote-extra.jpg'],
    }).success,
    false,
  );
  assert.equal(
    createProductSchema.safeParse({
      ...validProduct,
      galleryImages: [validProduct.imagePath],
    }).success,
    false,
  );
});
