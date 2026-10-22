import type { Metadata } from 'next';

import { AccountOrderView } from '@/components/store/account/AccountOrderView';

export const metadata: Metadata = {
  title: 'Order details',
  robots: { index: false },
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, { placed, payment }] = await Promise.all([params, searchParams]);
  const paymentResult =
    payment === 'success' || payment === 'pending' || payment === 'cancelled' ? payment : null;
  return (
    <AccountOrderView
      reference={id}
      justPlaced={placed === '1'}
      paymentResult={paymentResult}
    />
  );
}
