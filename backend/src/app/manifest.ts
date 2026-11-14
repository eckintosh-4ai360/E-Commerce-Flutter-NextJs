import type { MetadataRoute } from 'next';

import { storeConfig } from '@/lib/store-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${storeConfig.name} — ${storeConfig.tagline}`,
    short_name: storeConfig.shortName,
    description: storeConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#001a3a',
    theme_color: '#001a3a',
    icons: [
      {
        src: '/logo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
