'use client';

import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';

import { Avatar } from './Avatar';
import { BrandLogo } from './BrandLogo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?featured=new', label: 'New in' },
  { href: '/shop?featured=sale', label: 'Sale' },
  { href: '/track', label: 'Track order' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <BrandLogo />

        <nav className="site-nav" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form className="header-search" action="/shop" role="search">
          <Search size={18} aria-hidden="true" />
          <label htmlFor="site-search" className="visually-hidden">
            Search products
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            placeholder="Search GlobaCart..."
            autoComplete="off"
            maxLength={100}
          />
        </form>

        <div className="header-actions">
          <Link href="/wishlist" className="icon-btn hide-mobile" aria-label="Wishlist">
            <Heart size={21} />
            {wishlist.hydrated && wishlist.items.length > 0 ? (
              <span className="count-badge">{wishlist.items.length}</span>
            ) : null}
          </Link>
          <Link href="/cart" className="icon-btn" aria-label={`Cart, ${cart.totalItems} items`}>
            <ShoppingBag size={21} />
            {cart.hydrated && cart.totalItems > 0 ? (
              <span className="count-badge">{cart.totalItems}</span>
            ) : null}
          </Link>
          <Link href="/account" className="icon-btn hide-mobile" aria-label="Account">
            {user ? <Avatar user={user} /> : <User size={21} />}
          </Link>
        </div>
      </div>
    </header>
  );
}
