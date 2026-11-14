import type { Metadata, Viewport } from 'next';
import { Inter, Kumbh_Sans } from 'next/font/google';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { getSiteBaseUrl } from '@/lib/http';
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

const siteBaseUrl = getSiteBaseUrl();
const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  title: {
    default: `${storeConfig.name} — ${storeConfig.tagline}`,
    template: `%s · ${storeConfig.name}`,
  },
  description: storeConfig.description,
  applicationName: storeConfig.name,
  keywords: [
    'online shopping Ghana',
    'GlobaCart',
    'GlobaCart GH',
    'buy online Ghana',
    'Accra online store',
    'Kumasi delivery',
    'e-commerce Ghana',
    'online payment Ghana',
    'Mobile Money shopping',
    'electronics shop Accra',
    'fashion Ghana',
    'Ghana online mall',
  ],
  authors: [{ name: storeConfig.name, url: siteBaseUrl }],
  creator: storeConfig.name,
  publisher: storeConfig.name,
  category: 'ecommerce',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/logo.jpeg', type: 'image/jpeg' },
      { url: '/logo.jpeg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/logo.jpeg', sizes: '512x512', type: 'image/jpeg' },
    ],
    shortcut: [{ url: '/logo.jpeg', type: 'image/jpeg' }],
    apple: [{ url: '/logo.jpeg', sizes: '180x180', type: 'image/jpeg' }],
  },
  openGraph: {
    siteName: storeConfig.name,
    type: 'website',
    locale: 'en_GH',
    url: siteBaseUrl,
    title: `${storeConfig.name} — ${storeConfig.tagline}`,
    description: storeConfig.description,
    images: [
      {
        url: '/logo.jpeg',
        width: 800,
        height: 800,
        alt: `${storeConfig.name} — ${storeConfig.tagline}`,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@globacartgh',
    creator: '@globacartgh',
    title: `${storeConfig.name} — ${storeConfig.tagline}`,
    description: storeConfig.description,
    images: ['/logo.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : {}),
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#001a3a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${kumbhSans.variable} ${inter.variable}`}>
      <body suppressHydrationWarning>
        {children}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
