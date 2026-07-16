import type { ReactNode } from 'react';

import { AppBanner } from '@/components/store/AppBanner';
import { MobileTabBar } from '@/components/store/MobileTabBar';
import { SiteFooter } from '@/components/store/SiteFooter';
import { SiteHeader } from '@/components/store/SiteHeader';
import { StoreProviders } from '@/components/store/StoreProviders';

import './store.css';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="store-shell">
      <StoreProviders>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AppBanner />
        <SiteHeader />
        <main id="main" className="store-main">
          {children}
        </main>
        <SiteFooter />
        <MobileTabBar />
      </StoreProviders>
    </div>
  );
}
