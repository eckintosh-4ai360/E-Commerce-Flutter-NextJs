'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { discountPercent } from '@/lib/money';
import type { StoreProduct } from '@/lib/types';

import { ProductImage } from './ProductImage';
import { PriceRow } from './ui';

export function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: StoreProduct;
  priority?: boolean;
  compact?: boolean;
}) {
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const router = useRouter();

  const discount = discountPercent(product.price, product.originalPrice);
  const inCart = cart.hydrated && cart.containsProduct(product.id);
  const wished = wishlist.hydrated && wishlist.contains(product.id);
  const href = `/product/${product.id}`;

  const onAdd = () => {
    if (inCart) {
      router.push('/cart');
      return;
    }
    const result = cart.add(product);
    if (result === 'unavailable') {
      toast(`${product.name} is out of stock.`, 'error');
    } else {
      toast(`${product.name} added to cart`);
    }
  };

  return (
    <article className="product-card">
      <div className="product-card__media">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
        />
        {discount !== null ? (
          <span className="badge badge--sale product-card__badge">-{discount}%</span>
        ) : product.isNew ? (
          <span className="badge badge--new product-card__badge">NEW</span>
        ) : null}
        <button
          type="button"
          className="wish-btn"
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={() => wishlist.toggle(product)}
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-card__body">
        {!compact ? <span className="product-card__category">{product.category}</span> : null}
        <Link href={href} className="product-card__name">
          {product.name}
        </Link>
        <PriceRow price={product.price} originalPrice={product.originalPrice} />
        {!compact ? (
          <div className="product-card__cta">
            <button
              type="button"
              className={`add-btn${inCart ? ' is-in-cart' : ''}`}
              disabled={!product.inStock}
              onClick={onAdd}
            >
              {!product.inStock ? 'Out of stock' : inCart ? '✓ In cart' : 'Add to cart'}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
