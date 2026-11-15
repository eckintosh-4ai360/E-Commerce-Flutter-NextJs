'use client';

import { Heart, Minus, Plus, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { cartLineKey, useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { formatPrice } from '@/lib/money';
import { storeConfig } from '@/lib/store-config';
import type { StoreProduct } from '@/lib/types';

import { ProductImage } from './ProductImage';

export function PurchasePanel({ product }: { product: StoreProduct }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(product.colors.length === 0 ? 1 : 0);
  const [justAdded, setJustAdded] = useState(false);
  const wished = wishlist.hydrated && wishlist.contains(product.id);
  const colorReady = product.colors.length === 0 || selectedColor !== null;

  const selections = product.sizes.length > 0
    ? product.sizes.map((size) => ({ size, quantity: sizeQuantities[size] ?? 0 }))
        .filter((selection) => selection.quantity > 0)
    : quantity > 0 ? [{ size: null, quantity }] : [];
  const totalItems = selections.reduce((sum, selection) => sum + selection.quantity, 0);
  const totalPrice = product.price * totalItems;

  const selectColor = (color: string) => {
    if (color === selectedColor) return;
    setSelectedColor(color);
    setSizeQuantities({});
    setQuantity(1);
    setJustAdded(false);
  };

  const changeSizeQuantity = (size: string, delta: number) => {
    setSizeQuantities((previous) => ({
      ...previous,
      [size]: Math.max(0, Math.min(storeConfig.maxQuantityPerLine, (previous[size] ?? 0) + delta)),
    }));
    setJustAdded(false);
  };

  const addToCart = () => {
    if (!product.inStock || !colorReady || totalItems === 0) return;

    const exceedsLimit = selections.some(({ size, quantity: selectedQuantity }) => {
      const key = cartLineKey(product.id, selectedColor, size);
      const existing = cart.lines.find((line) => line.key === key)?.quantity ?? 0;
      return existing + selectedQuantity > storeConfig.maxQuantityPerLine;
    });
    if (exceedsLimit) {
      toast(`You can order at most ${storeConfig.maxQuantityPerLine} of one size and color.`, 'error');
      return;
    }

    for (const selection of selections) {
      cart.add(product, {
        quantity: selection.quantity,
        selectedColor,
        selectedSize: selection.size,
      });
    }
    setSizeQuantities({});
    setQuantity(1);
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
    <div className="purchase-panel">
      {product.colors.length > 0 ? (
        <div className="option-group" role="group" aria-label="Choose a color">
          <div className="option-group__label">
            <strong>1. Choose a color</strong>
            <span>{selectedColor ?? 'Select one to continue'}</span>
          </div>
          <div className="purchase-colors">
            {product.colors.map((color) => (
              <button key={color} type="button" className="purchase-color" aria-pressed={selectedColor === color} onClick={() => selectColor(color)}>
                <span className="purchase-color__photo">
                  <ProductImage
                    src={product.colorImages[color] ?? product.images[0]}
                    alt={product.colorImages[color] ? `${product.name} in ${color}` : `${product.name} product photo`}
                    sizes="(min-width: 900px) 130px, 30vw"
                  />
                </span>
                <span>{color}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {product.sizes.length > 0 ? (
        <div className="option-group" role="group" aria-label="Choose size quantities">
          <div className="option-group__label">
            <strong>{product.colors.length > 0 ? '2. Choose sizes and quantities' : 'Choose sizes and quantities'}</strong>
          </div>
          {!colorReady ? (
            <p className="purchase-hint">Choose a color to set quantities for each size.</p>
          ) : (
            <div className="purchase-sizes">
              {product.sizes.map((size) => {
                const selectedQuantity = sizeQuantities[size] ?? 0;
                return (
                  <div className="purchase-size" key={size}>
                    <div className="purchase-size__info">
                      <strong>{size}</strong>
                      <span>{formatPrice(product.price)} each</span>
                    </div>
                    <div className="qty qty--sm" role="group" aria-label={`${size} quantity`}>
                      <button type="button" aria-label={`Remove one ${size}`} disabled={selectedQuantity === 0} onClick={() => changeSizeQuantity(size, -1)}>
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <output aria-live="polite">{selectedQuantity}</output>
                      <button type="button" aria-label={`Add one ${size}`} disabled={selectedQuantity >= storeConfig.maxQuantityPerLine} onClick={() => changeSizeQuantity(size, 1)}>
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="option-group">
          <div className="option-group__label" id="qty-label">Quantity</div>
          <div className="qty" role="group" aria-labelledby="qty-label">
            <button type="button" aria-label="Decrease quantity" disabled={!colorReady || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
              <Minus size={16} aria-hidden="true" />
            </button>
            <output aria-live="polite">{colorReady ? quantity : 0}</output>
            <button type="button" aria-label="Increase quantity" disabled={!colorReady || quantity >= storeConfig.maxQuantityPerLine} onClick={() => setQuantity((value) => Math.min(storeConfig.maxQuantityPerLine, value + 1))}>
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="purchase-summary" aria-live="polite">
        <div>
          <strong>{totalItems} selected</strong>
          <span>{totalItems === 0
            ? 'Delivery shown at checkout'
            : product.shippingFee > 0
              ? `Delivery: ${formatPrice(product.shippingFee * totalItems)}`
              : 'Shipping included'}</span>
        </div>
        <strong className="purchase-summary__price">{formatPrice(totalPrice)}</strong>
      </div>

      <div className="pdp__actions">
        <button type="button" className="btn btn-primary btn-lg" disabled={!cart.hydrated || !product.inStock || !colorReady || totalItems === 0} onClick={addToCart}>
          {!product.inStock ? 'Out of stock' : !colorReady ? 'Choose a color' : totalItems === 0 ? 'Select a quantity' : `Add ${totalItems} to cart`}
        </button>
        <button type="button" className="icon-btn" aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => wishlist.toggle(product)}>
          <Heart size={20} fill={wished ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="icon-btn" aria-label="Share" onClick={share}>
          <Share2 size={20} />
        </button>
      </div>

      {justAdded ? (
        <div className="alert alert--success purchase-added">
          <span>Added to your cart.</span>
          <Link href="/cart">View cart →</Link>
        </div>
      ) : null}
    </div>
  );
}
