import type { Prisma, Product } from '@prisma/client';
import { cache } from 'react';

import { discountPercent } from './money';
import { getPrisma } from './prisma';
import { parseList } from './serializers';
import {
  parseCatalogFilters,
  type CatalogFilters,
  type CatalogSort,
} from './catalog-params';

export { parseCatalogFilters };
export type { CatalogFilters };

function orderByFor(sort: CatalogSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'latest':
      return [{ createdAt: 'desc' }, { id: 'desc' }];
    case 'popularity':
      return [{ reviewCount: 'desc' }, { rating: 'desc' }, { id: 'desc' }];
    case 'price-asc':
      return [{ price: 'asc' }, { id: 'asc' }];
    case 'price-desc':
      return [{ price: 'desc' }, { id: 'desc' }];
    default:
      return [{ isBestSeller: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];
  }
}

const maxCatalogSize = 500;

export async function listProducts(filters: CatalogFilters): Promise<Product[]> {
  const where: Prisma.ProductWhereInput = { isArchived: false };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.featured === 'new') {
    where.isNew = true;
  } else if (filters.featured === 'best') {
    where.isBestSeller = true;
  } else if (filters.featured === 'sale') {
    where.originalPrice = { not: null };
  }
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    where.price = {
      ...(filters.minPrice !== null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.search) {
    const contains = { contains: filters.search, mode: 'insensitive' as const };
    where.OR = [
      { name: contains },
      { category: contains },
      { tags: contains },
      { description: contains },
    ];
  }

  const products = await getPrisma().product.findMany({
    where,
    orderBy: orderByFor(filters.sort),
    take: maxCatalogSize,
  });

  // Colors and sizes live in JSON text columns, so they are matched here.
  return products.filter((product) => {
    if (
      filters.featured === 'sale' &&
      discountPercent(product.price, product.originalPrice) === null
    ) {
      return false;
    }
    if (
      filters.colors.length > 0 &&
      !parseList(product.colors).some((color) => filters.colors.includes(color))
    ) {
      return false;
    }
    if (
      filters.sizes.length > 0 &&
      !parseList(product.sizes).some((size) => filters.sizes.includes(size))
    ) {
      return false;
    }
    return true;
  });
}

export const getActiveProducts = cache(async () =>
  listProducts(parseCatalogFilters({})),
);

export const getCategories = cache(async () => {
  const groups = await getPrisma().product.groupBy({
    by: ['category'],
    where: { isArchived: false },
    _count: { _all: true },
    orderBy: { category: 'asc' },
  });
  return groups.map((group) => ({
    name: group.category,
    count: group._count._all,
  }));
});

export const getProduct = cache(async (id: number) => {
  const product = await getPrisma().product.findUnique({ where: { id } });
  return product && !product.isArchived ? product : null;
});

export async function getRelatedProducts(product: Product, limit = 4) {
  const related = await getPrisma().product.findMany({
    where: {
      isArchived: false,
      category: product.category,
      id: { not: product.id },
    },
    orderBy: [{ isBestSeller: 'desc' }, { reviewCount: 'desc' }],
    take: limit,
  });

  if (related.length >= limit) {
    return related;
  }

  const fillers = await getPrisma().product.findMany({
    where: {
      isArchived: false,
      id: { notIn: [product.id, ...related.map((item) => item.id)] },
    },
    orderBy: [{ isBestSeller: 'desc' }, { reviewCount: 'desc' }],
    take: limit - related.length,
  });
  return [...related, ...fillers];
}

export type Facet = { value: string; count: number };

export function buildFacets(products: Product[]) {
  const colors = new Map<string, number>();
  const sizes = new Map<string, number>();
  let maxPrice = 0;

  for (const product of products) {
    maxPrice = Math.max(maxPrice, product.price);
    for (const color of parseList(product.colors)) {
      colors.set(color, (colors.get(color) ?? 0) + 1);
    }
    for (const size of parseList(product.sizes)) {
      sizes.set(size, (sizes.get(size) ?? 0) + 1);
    }
  }

  const toFacets = (counts: Map<string, number>): Facet[] =>
    [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));

  return {
    colors: toFacets(colors),
    sizes: toFacets(sizes),
    maxPrice: Math.max(500, Math.ceil(maxPrice / 50) * 50),
  };
}
