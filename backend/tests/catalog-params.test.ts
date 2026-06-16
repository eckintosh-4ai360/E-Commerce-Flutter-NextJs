import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hasRefinements, parseCatalogFilters, shopHref } from '@/lib/catalog-params';

test('defaults are applied for missing or invalid values', () => {
  const filters = parseCatalogFilters({ category: 'All', sort: 'cheapest', featured: 'hot', minPrice: '-5' });
  assert.equal(filters.category, null);
  assert.equal(filters.sort, 'featured');
  assert.equal(filters.featured, null);
  assert.equal(filters.minPrice, null);
  assert.deepEqual(filters.colors, []);
});

test('accepts q as an alias for search and splits list params', () => {
  const filters = parseCatalogFilters(new URLSearchParams('q=tote&color=Black,Brown&color=Tan&size=M'));
  assert.equal(filters.search, 'tote');
  assert.deepEqual(filters.colors, ['Black', 'Brown', 'Tan']);
  assert.deepEqual(filters.sizes, ['M']);
  assert.equal(hasRefinements(filters), true);
});

test('long values are truncated', () => {
  const filters = parseCatalogFilters({ q: 'x'.repeat(500) });
  assert.equal(filters.search?.length, 100);
});

test('shopHref round-trips through parseCatalogFilters', () => {
  const filters = parseCatalogFilters({
    category: 'Bags',
    sort: 'price-desc',
    minPrice: '10',
    maxPrice: '200',
    color: ['Black', 'Navy'],
  });
  const href = shopHref(filters);
  assert.ok(href.startsWith('/shop?'));
  const reparsed = parseCatalogFilters(new URL(href, 'http://x').searchParams);
  assert.deepEqual(reparsed, filters);
});

test('shopHref omits defaults and applies overrides', () => {
  const filters = parseCatalogFilters({ category: 'Bags' });
  assert.equal(shopHref(filters, { category: null }), '/shop');
  assert.equal(shopHref(filters, { featured: 'sale' }), '/shop?category=Bags&featured=sale');
});
