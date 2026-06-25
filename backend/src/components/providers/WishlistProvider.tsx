'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { errorMessage } from '@/lib/client/api';
import { readStored, removeStored, writeStored } from '@/lib/client/storage';
import type { StoreProduct } from '@/lib/types';

import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

type WishlistContextValue = {
  items: StoreProduct[];
  hydrated: boolean;
  contains: (productId: number) => boolean;
  toggle: (product: StoreProduct) => void;
  remove: (productId: number) => void;
};

const storageKey = 'eckintosh.wishlist.v1';
const WishlistContext = createContext<WishlistContextValue | null>(null);

function validateItems(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is StoreProduct =>
          typeof item?.id === 'number' && typeof item?.name === 'string',
      )
    : null;
}

/**
 * Signed out, the wishlist lives on this device. On sign-in it is merged into
 * the account so it follows the customer between the website and the app.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, status, authedFetch } = useAuth();
  const toast = useToast();
  const [items, setItemsState] = useState<StoreProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const syncedUid = useRef<string | null>(null);
  const itemsRef = useRef<StoreProduct[]>([]);

  const setItems = useCallback((next: StoreProduct[]) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  useEffect(() => {
    setItems(readStored(storageKey, validateItems) ?? []);
    setHydrated(true);
  }, [setItems]);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) removeStored(storageKey);
    else writeStored(storageKey, items);
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated || status !== 'ready') return;

    if (!user) {
      if (syncedUid.current) {
        // Signed out: don't leave the previous account's list on this device.
        syncedUid.current = null;
        setItems([]);
      }
      return;
    }

    if (syncedUid.current === user.uid) return;
    syncedUid.current = user.uid;

    authedFetch<{ products: StoreProduct[] }>('/api/me/wishlist', {
      method: 'POST',
      body: { productIds: itemsRef.current.map((item) => item.id) },
    })
      .then(({ products }) => setItems(products))
      .catch(() => {
        syncedUid.current = null;
      });
  }, [user, status, hydrated, authedFetch, setItems]);

  const remove = useCallback(
    (productId: number) => {
      const previous = itemsRef.current;
      setItems(previous.filter((item) => item.id !== productId));
      if (syncedUid.current) {
        authedFetch(`/api/me/wishlist/${productId}`, { method: 'DELETE' }).catch((error) => {
          setItems(previous);
          toast(errorMessage(error), 'error');
        });
      }
    },
    [authedFetch, toast, setItems],
  );

  const toggle = useCallback(
    (product: StoreProduct) => {
      const previous = itemsRef.current;
      if (previous.some((item) => item.id === product.id)) {
        remove(product.id);
        return;
      }
      setItems([product, ...previous]);
      if (syncedUid.current) {
        authedFetch('/api/me/wishlist', {
          method: 'POST',
          body: { productIds: [product.id] },
        }).catch((error) => {
          setItems(previous);
          toast(errorMessage(error), 'error');
        });
      }
    },
    [authedFetch, remove, toast, setItems],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      hydrated,
      contains: (productId) => items.some((item) => item.id === productId),
      toggle,
      remove,
    }),
    [items, hydrated, toggle, remove],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used inside <WishlistProvider>.');
  }
  return context;
}
