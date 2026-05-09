import type { Product as PrismaProduct } from '@prisma/client';

import { getPrisma } from '@/lib/prisma';
import { getRequestOrigin, jsonResponse, optionsResponse } from '@/lib/http';
import { serialiseProduct } from '@/lib/serializers';

export async function GET(request: Request) {
  const prisma = getPrisma();
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search')?.trim().toLowerCase();
  const featured = url.searchParams.get('featured');
  const sort = url.searchParams.get('sort');
  const products = await prisma.product.findMany({
    orderBy: [{ isBestSeller: 'desc' }, { createdAt: 'desc' }],
  });

  const origin = getRequestOrigin(request);
  const categories = Array.from(
    new Set<string>(
      products.map((product: PrismaProduct) => product.category),
    ),
  ).sort((left, right) => left.localeCompare(right));

  let serialised = products.map((product) => serialiseProduct(product, origin));

  if (category && category !== 'All') {
    serialised = serialised.filter((product) => product.category === category);
  }

  if (search) {
    serialised = serialised.filter((product) => {
      const haystacks = [
        product.name,
        product.category,
        ...product.tags,
      ].map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(search));
    });
  }

  if (featured === 'sale') {
    serialised = serialised.filter((product) => product.originalPrice !== null);
  } else if (featured === 'new') {
    serialised = serialised.filter((product) => product.isNew);
  } else if (featured === 'best') {
    serialised = serialised.filter((product) => product.isBestSeller);
  }

  if (sort === 'price-asc') {
    serialised.sort((left, right) => left.price - right.price);
  } else if (sort === 'price-desc') {
    serialised.sort((left, right) => right.price - left.price);
  } else if (sort === 'popularity') {
    serialised.sort((left, right) => right.reviewCount - left.reviewCount);
  }

  return jsonResponse({
    source: 'database',
    categories,
    products: serialised,
  });
}

export function OPTIONS() {
  return optionsResponse();
}
