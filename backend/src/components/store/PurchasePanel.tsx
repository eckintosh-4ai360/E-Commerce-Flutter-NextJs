'use client';

import { Heart, Minus, Plus, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { formatPrice } from '@/lib/money';
import { storeConfig } from '@/lib/store-config';
import type { StoreProduct } from '@/lib/types';

export function PurchasePanel({ product }: { product: StoreProduct }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const [colors, setColors] = useState<string[]>(product.colors[0] ? [product.colors[0]] : []);
  const [sizes, setSizes] = useState<string[]>(product.sizes[0] ? [product.sizes[0]] : []);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const wished = wishlist.hydrated && wishlist.contains(product.id);

  const toggleColor = (value: string) =>
    setColors((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== value);
      }
      return [...prev, value];
    });

  const toggleSize = (value: string) =>
    setSizes((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== value);
      }
      return [...prev, value];
    });

  const effectiveColors: (string | null)[] =
    product.colors.length > 0
      ? colors.length > 0
        ? colors
        : [product.colors[0]]
      : [null];

  const effectiveSizes: (string | null)[] =
    product.sizes.length > 0
      ? sizes.length > 0
        ? sizes
        : [product.sizes[0]]
      : [null];

  const combinations: { color: string | null; size: string | null }[] = [];
  for (const c of effectiveColors) {
    for (const s of effectiveSizes) {
      combinations.push({ color: c, size: s });
    }
  }

  const totalItems = combinations.length * quantity;
  const totalPrice = product.price * totalItems;
  const totalOriginalPrice = product.originalPrice ? product.originalPrice * totalItems : null;

  const addToCart = () => {
    let anyUnavailable = false;
    let anyLimit = false;

    for (const combo of combinations) {
      const result = cart.add(product, {
        quantity,
        selectedColor: combo.color,
        selectedSize: combo.size,
      });
      if (result === 'unavailable') anyUnavailable = true;
      if (result === 'limit') anyLimit = true;
    }

    if (anyUnavailable) {
      toast('This product is out of stock.', 'error');
      return;
    }
    if (anyLimit) {
      toast(`You can order at most ${storeConfig.maxQuantityPerLine} of one item.`, 'error');
      return;
    }
    setJustAdded(true);
    toast(`Added ${totalItems} × ${product.name} to cart (${formatPrice(totalPrice)})`, 'success');
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `${product.name} on ${storeConfig.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        toast('Could not share this product.', 'error');
      }
    }
  };

  return (
    <div>
      {product.colors.length > 0 ? (
        <div className="option-group" role="group" aria-label="Colour">
          <div className="option-group__label">
            Colour <span>{colors.length > 0 ? colors.join(', ') : 'None'}</span>
          </div>
          <div className="option-list">
            {product.colors.map((value) => (
              <button
                key={value}
                type="button"
                className="chip"
                aria-pressed={colors.includes(value)}
                onClick={() => toggleColor(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {product.sizes.length > 0 ? (
        <div className="option-group" role="group" aria-label="Size">
          <div className="option-group__label">
            Size <span>{sizes.length > 0 ? sizes.join(', ') : 'None'}</span>
          </div>
          <div className="option-list">
            {product.sizes.map((value) => (
              <button
                key={value}
                type="button"
                className="size-pill"
                aria-pressed={sizes.includes(value)}
                onClick={() => toggleSize(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="option-group">
        <div className="option-group__label" id="qty-label">
          Quantity
        </div>
        <div className="qty" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <Minus size={16} />
          </button>
          <output aria-live="polite">{quantity}</output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= storeConfig.maxQuantityPerLine}
            onClick={() =>
              setQuantity((value) => Math.min(storeConfig.maxQuantityPerLine, value + 1))
            }
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          margin: '18px 0 16px',
          padding: '14px 18px',
          background: 'var(--a-surface-2)',
          borderRadius: 12,
          border: '1px solid var(--a-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--a-text-2)', fontWeight: 500 }}>
            {totalItems > 1 ? (
              <span>
                Total for <strong>{totalItems} items</strong> ({combinations.length} selections × {quantity} qty)
              </span>
            ) : (
              <span>Total:</span>
            )}
          </div>
          {combinations.length > 1 ? (
            <div style={{ fontSize: 11, color: 'var(--a-text-3)', marginTop: 2 }}>
              Multiple selections applied to total price
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--a-gold)' }}>
            {formatPrice(totalPrice)}
          </span>
          {totalOriginalPrice ? (
            <span style={{ fontSize: 14, textDecoration: 'line-through', color: 'var(--a-text-3)' }}>
              {formatPrice(totalOriginalPrice)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="pdp__actions">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!product.inStock}
          onClick={addToCart}
        >
          {!product.inStock
            ? 'Out of stock'
            : totalItems > 1
              ? `Add ${totalItems} to cart · ${formatPrice(totalPrice)}`
              : `Add to cart · ${formatPrice(totalPrice)}`}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={wished}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={() => wishlist.toggle(product)}
        >
          <Heart size={20} fill={wished ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="icon-btn" aria-label="Share" onClick={share}>
          <Share2 size={20} />
        </button>
      </div>

      {justAdded ? (
        <div className="alert alert--success" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
          <span>Added to your cart.</span>
          <Link href="/cart" style={{ fontWeight: 700 }}>
            View cart →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
