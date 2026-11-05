'use client';

import { Heart, Minus, Plus, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
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
    setColors((prev) => prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]);

  const toggleSize = (value: string) =>
    setSizes((prev) => prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]);

  const selectedColor = colors.length > 0 ? colors.join(', ') : null;
  const selectedSize = sizes.length > 0 ? sizes.join(', ') : null;

  const addToCart = () => {
    const result = cart.add(product, { quantity, selectedColor, selectedSize });
    if (result === 'unavailable') {
      toast('This product is out of stock.', 'error');
      return;
    }
    if (result === 'limit') {
      toast(`You can order at most ${storeConfig.maxQuantityPerLine} of one item.`, 'error');
      return;
    }
    setJustAdded(true);
    toast(`Added ${quantity} × ${product.name} to cart`, 'success');
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

      <div className="pdp__actions">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!product.inStock}
          onClick={addToCart}
        >
          {product.inStock ? 'Add to cart' : 'Out of stock'}
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
