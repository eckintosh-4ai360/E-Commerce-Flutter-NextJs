import { getCategories, listProducts, parseCatalogFilters } from '@/lib/catalog';
import { jsonResponse, preflight, publicCacheHeaders, route } from '@/lib/http';
import { serialiseProduct } from '@/lib/serializers';

export const GET = route(async (request) => {
  const filters = parseCatalogFilters(new URL(request.url).searchParams);
  const [products, categories] = await Promise.all([
    listProducts(filters),
    getCategories(),
  ]);

  return jsonResponse(
    {
      source: 'database',
      categories: categories.map((category) => category.name),
      products: products.map((product) => serialiseProduct(product)),
    },
    { headers: publicCacheHeaders },
  );
});

export const OPTIONS = preflight;
