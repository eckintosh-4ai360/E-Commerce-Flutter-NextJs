'use client';

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useCart } from '@/components/providers/CartProvider';
import { apiFetch } from '@/lib/client/api';
import { formatMoney, formatPrice } from '@/lib/money';
import { storeConfig } from '@/lib/store-config';
import type { StoreProduct } from '@/lib/types';

import { ConfirmDialog } from './ConfirmDialog';
import { ProductImage } from './ProductImage';
import { EmptyState, Spinner } from './ui';

export function useFreshCart() {
  const cart = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const synced = useRef(false);

  useEffect(() => {
    if (!cart.hydrated || synced.current || cart.lines.length === 0) return;
    synced.current = true;
    apiFetch<{ products: StoreProduct[] }>('/api/catalog')
      .then(({ products }) => {
        const removed = cart.syncProducts(products);
        if (removed.length > 0) {
          setNotice(`${removed.join(', ')} ${removed.length === 1 ? 'is' : 'are'} no longer available and ${removed.length === 1 ? 'was' : 'were'} removed from your cart.`);
        }
      })
      .catch(() => {
        // Offline or API down: keep the stored cart; checkout re-validates anyway.
      });
  }, [cart]);

  return { cart, notice };
}

export function CartSummary({ children }: { children?: ReactNode }) {
  const cart = useCart();

  return (
    <aside className="card summary" aria-label="Order summary">
      <div className="summary-rows">
        <div>
          <span className="muted">Subtotal ({cart.totalItems} item{cart.totalItems === 1 ? '' : 's'})</span>
          <span>{formatMoney(cart.subtotal)}</span>
        </div>
        <div>
          <span className="muted">Shipping</span>
          <span>{cart.shippingFee === 0 ? 'Free' : formatMoney(cart.shippingFee)}</span>
        </div>
        <div className="total">
          <span>Total</span>
          <span>{formatMoney(cart.total)}</span>
        </div>
      </div>
      {children}
    </aside>
  );
}

export function CartView() {
  const { cart, notice } = useFreshCart();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!cart.hydrated) {
    return <Spinner label="Loading your cart" />;
  }

  if (cart.lines.length === 0) {
    return (
      <>
        {notice ? <div className="alert alert--warn" style={{ marginTop: 16 }}>{notice}</div> : null}
        <EmptyState
          icon={<ShoppingBag size={44} />}
          title="Your cart is empty"
          action={
            <Link href="/shop" className="btn btn-primary">
              Shop now
            </Link>
          }
        >
          Discover our beautiful collection.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 className="page-title">My Cart</h1>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmClear(true)}>
          Clear
        </button>
      </div>
      {notice ? (
        <div className="alert alert--warn" role="status" style={{ margin: '8px 0 16px' }}>
          {notice}
        </div>
      ) : null}

      <div className="cart-layout" style={{ marginTop: 12 }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Cart items">
          {cart.lines.map((line) => {
            const options = [line.selectedColor, line.selectedSize && `Size ${line.selectedSize}`]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={line.key} className="cart-line">
                <Link href={`/product/${line.product.id}`} className="cart-line__media" tabIndex={-1} aria-hidden="true">
                  <ProductImage src={line.product.images[0]} alt="" sizes="84px" />
                </Link>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/product/${line.product.id}`} className="cart-line__name">
                    {line.product.name}
                  </Link>
                  <div className="cart-line__meta">
                    {options || line.product.category}
                    {!line.product.inStock ? (
                      <strong style={{ color: 'var(--error)', display: 'block' }}>Out of stock</strong>
                    ) : null}
                  </div>
                  <div className="price">{formatPrice(line.product.price)}</div>
                  {line.product.shippingFee > 0 ? (
                    <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                      Delivery: {formatMoney(line.product.shippingFee)} each
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>Shipping included</div>
                  )}
                </div>
                <div className="cart-line__side">
                  <div className="qty qty--sm" role="group" aria-label={`Quantity of ${line.product.name}`}>
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <output>{line.quantity}</output>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={line.quantity >= storeConfig.maxQuantityPerLine}
                      onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => cart.remove(line.key)}
                    aria-label={`Remove ${line.product.name}`}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <CartSummary>
          <Link
            href="/checkout"
            className="btn btn-primary btn-lg btn-block"
            style={{ marginTop: 18 }}
            aria-disabled={cart.lines.some((line) => !line.product.inStock)}
            onClick={(event) => {
              if (cart.lines.some((line) => !line.product.inStock)) event.preventDefault();
            }}
          >
            Checkout
          </Link>
          {cart.lines.some((line) => !line.product.inStock) ? (
            <p className="small" style={{ color: 'var(--error)', margin: '10px 0 0' }}>
              Remove out-of-stock items to continue.
            </p>
          ) : null}
          <Link href="/shop" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
            Continue shopping
          </Link>
        </CartSummary>
      </div>

      {confirmClear ? (
        <ConfirmDialog
          title="Clear cart"
          message="Remove all items from your cart?"
          confirmLabel="Clear"
          danger
          onConfirm={() => {
            cart.clear();
            setConfirmClear(false);
          }}
          onCancel={() => setConfirmClear(false)}
        />
      ) : null}
    </>
  );
}
