import { Bell, Heart, Smartphone, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { InstallAppAction } from '@/components/store/InstallApp';
import { StoreBadges } from '@/components/store/StoreBadges';
import { storeConfig } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Get the app',
  description: `Add the ${storeConfig.name} website to your phone home screen or computer desktop.`,
  alternates: { canonical: '/get-the-app' },
  openGraph: {
    title: `Get the app · ${storeConfig.name}`,
    description: `Add the ${storeConfig.name} website to your phone home screen or computer desktop.`,
    url: '/get-the-app',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `Get the app · ${storeConfig.name}`,
    description: `Add the ${storeConfig.name} website to your phone home screen or computer desktop.`,
  },
};

const perks = [
  { icon: Smartphone, title: 'Made for your phone', text: 'Fast browsing, quick checkout and a cart that remembers you.' },
  { icon: Heart, title: 'One wishlist everywhere', text: 'Sign in with the same Google account and your wishlist follows you.' },
  { icon: Truck, title: 'Track on the go', text: 'See every order and its delivery progress from the Account tab.' },
  { icon: Bell, title: 'Email updates', text: 'Get confirmations and status changes for every order you place.' },
];

export default function GetTheAppPage() {
  const hasApp = Boolean(storeConfig.appLinks.android || storeConfig.appLinks.ios);

  return (
    <div className="container">
      <section className="app-cta" style={{ marginTop: 24 }}>
        <div>
          <span className="eyebrow">{storeConfig.name} app</span>
          <h1 style={{ margin: '8px 0', fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15 }}>
            Add GlobaCart to your home screen
          </h1>
          <p>
            Add this website to your phone or computer for one-tap access. The icon opens GlobaCart
            for shopping, checkout and order tracking. Supported browsers open it in an app-style window.
          </p>
          <InstallAppAction />
          {!hasApp ? <p className="muted small" style={{ marginTop: 14 }}>The native app is coming soon to app stores.</p> : null}
        </div>
        {hasApp ? <StoreBadges /> : null}
      </section>

      <div className="product-grid" style={{ marginTop: 28 }}>
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card" style={{ margin: 0 }}>
            <Icon size={24} />
            <h2 style={{ margin: '12px 0 6px' }}>{title}</h2>
            <p className="muted small" style={{ margin: 0 }}>{text}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <Link href="/shop" className="btn btn-outline">
          Keep shopping on the web
        </Link>
      </div>
    </div>
  );
}
