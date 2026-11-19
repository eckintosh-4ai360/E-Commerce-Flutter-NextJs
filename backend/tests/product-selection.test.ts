import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cartLineKey, selectedProductVariants } from '@/lib/product-selection';

test('product selection keeps each size and color in the grand total', () => {
  const product = { id: 101, colors: ['Black', 'Cream'], sizes: ['S', 'M'] };
  const quantities = {
    [cartLineKey(101, 'Black', 'M')]: 2,
    [cartLineKey(101, 'Cream', 'S')]: 1,
  };

  const selections = selectedProductVariants(product, quantities);
  assert.deepEqual(selections, [
    { color: 'Black', size: 'M', quantity: 2 },
    { color: 'Cream', size: 'S', quantity: 1 },
  ]);
  assert.equal(selections.reduce((sum, selection) => sum + selection.quantity, 0) * 50, 150);
});

test('product selection works without colors or sizes', () => {
  assert.deepEqual(
    selectedProductVariants(
      { id: 7, colors: [], sizes: [] },
      { [cartLineKey(7, null, null)]: 3 },
    ),
    [{ color: null, size: null, quantity: 3 }],
  );
});
