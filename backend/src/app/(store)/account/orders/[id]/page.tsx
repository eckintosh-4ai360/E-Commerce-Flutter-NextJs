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
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  return <AccountOrderView reference={id} justPlaced={placed === '1'} />;
}
