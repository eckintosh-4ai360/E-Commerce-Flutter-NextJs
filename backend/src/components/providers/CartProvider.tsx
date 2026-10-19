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

import { readStored, removeStored, writeStored } from '@/lib/client/storage';
import { roundMoney } from '@/lib/money';
import { shippingFeeFor, storeConfig } from '@/lib/store-config';
import type { StoreProduct } from '@/lib/types';

export type CartLine = {
  key: string;
  product: StoreProduct;
  quantity: number;
  selectedColor: string | null;
  selectedSize: string | null;
};

type AddOptions = {
  quantity?: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  add: (product: StoreProduct, options?: AddOptions) => 'added' | 'updated' | 'unavailable' | 'limit';
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  containsProduct: (productId: number) => boolean;
  /** Refreshes prices/stock from the catalog and drops products that are gone. Returns removed names. */
  syncProducts: (products: StoreProduct[]) => string[];
};

const storageKey = 'globalcart.cart.v1';
const CartContext = createContext<CartContextValue | null>(null);

export function cartLineKey(productId: number, color: string | null, size: string | null) {
  return `${productId}|${color ?? ''}|${size ?? ''}`;
}

function isCartLine(value: unknown): value is CartLine {
  const line = value as CartLine;
  return (
    typeof line === 'object' &&
    line !== null &&
    typeof line.key === 'string' &&
    typeof line.quantity === 'number' &&
    typeof line.product?.id === 'number' &&
    typeof line.product?.price === 'number' &&
    Array.isArray(line.product?.images)
  );
}

function validateLines(value: unknown) {
  return Array.isArray(value) ? value.filter(isCartLine) : null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Mirrors `lines` so handlers can compute results synchronously, including
  // several updates within one event.
  const linesRef = useRef<CartLine[]>([]);

  const commit = useCallback((next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  useEffect(() => {
    commit(readStored(storageKey, validateLines) ?? []);
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        commit(readStored(storageKey, validateLines) ?? []);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [commit]);

  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) removeStored(storageKey);
    else writeStored(storageKey, lines);
  }, [lines, hydrated]);

  const add = useCallback<CartContextValue['add']>(
    (product, options = {}) => {
      if (!product.inStock) {
        return 'unavailable';
      }
      const selectedColor = options.selectedColor ?? product.colors[0] ?? null;
      const selectedSize = options.selectedSize ?? product.sizes[0] ?? null;
      const quantity = Math.max(1, Math.floor(options.quantity ?? 1));
      const key = cartLineKey(product.id, selectedColor, selectedSize);
      const current = linesRef.current;
      const existing = current.find((line) => line.key === key);

      if (existing) {
        const nextQuantity = Math.min(
          storeConfig.maxQuantityPerLine,
          existing.quantity + quantity,
        );
        if (nextQuantity === existing.quantity) {
          return 'limit';
        }
        commit(
          current.map((line) =>
            line.key === key ? { ...line, product, quantity: nextQuantity } : line,
          ),
        );
        return 'updated';
      }

      commit([
        ...current,
        {
          key,
          product,
          quantity: Math.min(storeConfig.maxQuantityPerLine, quantity),
          selectedColor,
          selectedSize,
        },
      ]);
      return 'added';
    },
    [commit],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      const current = linesRef.current;
      commit(
        quantity <= 0
          ? current.filter((line) => line.key !== key)
          : current.map((line) =>
              line.key === key
                ? {
                    ...line,
                    quantity: Math.min(storeConfig.maxQuantityPerLine, Math.floor(quantity)),
                  }
                : line,
            ),
      );
    },
    [commit],
  );

  const remove = useCallback(
    (key: string) => commit(linesRef.current.filter((line) => line.key !== key)),
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const syncProducts = useCallback(
    (products: StoreProduct[]) => {
      const fresh = new Map(products.map((product) => [product.id, product]));
      const removed: string[] = [];
      const next = linesRef.current.flatMap((line) => {
        const product = fresh.get(line.product.id);
        if (!product) {
          removed.push(line.product.name);
          return [];
        }
        return [{ ...line, product }];
      });
      commit(next);
      return removed;
    },
    [commit],
  );

  const value = useMemo<CartContextValue>(() => {
    const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = roundMoney(
      lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    );
    const shippingFee = lines.length === 0 ? 0 : shippingFeeFor(subtotal);
    return {
      lines,
      hydrated,
      totalItems,
      subtotal,
      shippingFee,
      total: roundMoney(subtotal + shippingFee),
      add,
      setQuantity,
      remove,
      clear,
      containsProduct: (productId) => lines.some((line) => line.product.id === productId),
      syncProducts,
    };
  }, [lines, hydrated, add, setQuantity, remove, clear, syncProducts]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>.');
  }
  return context;
}
