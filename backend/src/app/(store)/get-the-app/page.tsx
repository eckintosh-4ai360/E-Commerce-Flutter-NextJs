import { Bell, Heart, Smartphone, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { StoreBadges } from '@/components/store/StoreBadges';
import { storeConfig } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Get the app',
  description: 'Download the Eckintosh Mall app for Android and iPhone, or keep shopping on the web.',
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
          <span className="eyebrow">Eckintosh Mall app</span>
          <h1 style={{ margin: '8px 0', fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15 }}>
            Shop the web or the app — it&apos;s your choice
          </h1>
          <p>
            Everything you can do here, you can do in the app: browse, filter, save favourites,
            check out, track orders, manage addresses and request returns.
            {hasApp ? '' : ' The app is launching soon in the stores.'}
          </p>
        </div>
        <StoreBadges />
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
