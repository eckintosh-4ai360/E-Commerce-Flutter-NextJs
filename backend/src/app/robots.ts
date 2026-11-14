import type { MetadataRoute } from 'next';

import { getSiteBaseUrl } from '@/lib/http';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/account',
          '/account/',
          '/cart',
          '/checkout',
          '/wishlist',
          '/track',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
