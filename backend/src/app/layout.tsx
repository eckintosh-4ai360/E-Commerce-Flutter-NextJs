import type { Metadata, Viewport } from 'next';
import { Inter, Kumbh_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { getPublicBaseUrl } from '@/lib/http';
import { storeConfig } from '@/lib/store-config';

import './globals.css';

const kumbhSans = Kumbh_Sans({
  subsets: ['latin'],
  variable: '--font-kumbh',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicBaseUrl() ?? 'http://localhost:3000'),
  title: {
    default: `${storeConfig.name} — ${storeConfig.tagline}`,
    template: `%s · ${storeConfig.name}`,
  },
  description: storeConfig.description,
  applicationName: storeConfig.name,
  openGraph: {
    siteName: storeConfig.name,
    type: 'website',
    locale: 'en_GH',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${kumbhSans.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
