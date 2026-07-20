import type { Metadata } from 'next';

import { CheckoutView } from '@/components/store/CheckoutView';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="container">
      <CheckoutView />
    </div>
  );
}
