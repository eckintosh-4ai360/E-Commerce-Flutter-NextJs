'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/providers/AuthProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { ProductCard } from './ProductCard';
import { EmptyState, Spinner } from './ui';

export function WishlistView() {
  const wishlist = useWishlist();
  const { user, signIn, busy } = useAuth();

  return (
    <div className="container">
      <h1 className="page-title">Wishlist</h1>
      {!user ? (
        <p className="page-subtitle">
          Saved on this device.{' '}
          <button type="button" className="text-btn" onClick={() => void signIn()} disabled={busy}>
            Sign in
          </button>{' '}
          to keep your wishlist in sync with the app.
        </p>
      ) : (
        <p className="page-subtitle">Synced with your account across the website and the app.</p>
      )}

      {!wishlist.hydrated ? (
        <Spinner label="Loading wishlist" />
      ) : wishlist.items.length === 0 ? (
        <EmptyState
          icon={<Heart size={44} />}
          title="No items in wishlist"
          action={
            <Link href="/" className="btn btn-primary">
              Explore
            </Link>
          }
        >
          Save your favourite pieces here.
        </EmptyState>
      ) : (
        <div className="product-grid">
          {wishlist.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
