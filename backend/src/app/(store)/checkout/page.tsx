import type { Metadata } from 'next';

import { CheckoutView } from '@/components/store/CheckoutView';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { payment } = await searchParams;
  return (
    <div className="container">
      <CheckoutView paymentError={payment === 'error'} />
    </div>
  );
}
