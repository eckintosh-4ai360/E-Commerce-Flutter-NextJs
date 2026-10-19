'use client';

import { Smartphone, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { readStored, writeStored } from '@/lib/client/storage';
import { storeConfig } from '@/lib/store-config';

const storageKey = 'globalcart.appBanner.dismissed';

/** A dismissible strip offering the mobile app, shown only when a download link is configured. */
export function AppBanner() {
  const [visible, setVisible] = useState(false);
  const hasApp = Boolean(storeConfig.appLinks.android || storeConfig.appLinks.ios);

  useEffect(() => {
    setVisible(hasApp && !readStored(storageKey, (value) => (value === true ? true : null)));
  }, [hasApp]);

  if (!visible) {
    return null;
  }

  return (
    <div className="app-banner">
      <div className="container app-banner__inner">
        <Smartphone size={18} aria-hidden="true" />
        <span className="app-banner__text">
          Shop faster with the GlobalCart app. <Link href="/get-the-app">Get the app</Link>
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            writeStored(storageKey, true);
            setVisible(false);
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
