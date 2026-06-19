import type { MetadataRoute } from 'next';

import { getPublicBaseUrl } from '@/lib/http';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicBaseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/account', '/cart', '/checkout'],
      },
    ],
    ...(baseUrl ? { sitemap: `${baseUrl}/sitemap.xml` } : {}),
  };
}
