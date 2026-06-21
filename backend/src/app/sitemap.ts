import type { MetadataRoute } from 'next';

import { getActiveProducts, getCategories } from '@/lib/catalog';
import { getPublicBaseUrl } from '@/lib/http';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl() ?? 'http://localhost:3000';
  const [products, categories] = await Promise.all([getActiveProducts(), getCategories()]);

  return [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((category) => ({
      url: `${baseUrl}/shop?category=${encodeURIComponent(category.name)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${baseUrl}/help`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/get-the-app`, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
