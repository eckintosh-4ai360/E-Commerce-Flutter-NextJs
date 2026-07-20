import type { Metadata } from 'next';

import { CartView } from '@/components/store/CartView';

export const metadata: Metadata = {
  title: 'My Cart',
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="container">
      <CartView />
    </div>
  );
}
