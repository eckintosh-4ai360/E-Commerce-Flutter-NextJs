'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { WishlistProvider } from '@/components/providers/WishlistProvider';

export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
