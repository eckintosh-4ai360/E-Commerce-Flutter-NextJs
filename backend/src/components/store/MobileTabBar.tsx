'use client';

import { Heart, House, ShoppingBag, Store, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCart } from '@/components/providers/CartProvider';

const tabs = [
  { href: '/', label: 'Home', icon: House, exact: true },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'Cart', icon: ShoppingBag },
  { href: '/account', label: 'Account', icon: User },
];

/** Floating bottom navigation for phones, matching the app's tab bar. */
export function MobileTabBar() {
  const pathname = usePathname();
  const cart = useCart();

  return (
    <nav className="tab-bar" aria-label="Primary">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-label={label} aria-current={active ? 'page' : undefined}>
            <Icon size={24} fill={active && href === '/wishlist' ? 'currentColor' : 'none'} />
            {href === '/cart' && cart.hydrated && cart.totalItems > 0 ? (
              <span className="count-badge">{cart.totalItems}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
