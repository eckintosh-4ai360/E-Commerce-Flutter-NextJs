import type { MetadataRoute } from 'next';

import { storeConfig } from '@/lib/store-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${storeConfig.name} — ${storeConfig.tagline}`,
    short_name: storeConfig.shortName,
    description: storeConfig.description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#001a3a',
    theme_color: '#001a3a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
