import type { Metadata } from 'next';

import { ReturnsView } from '@/components/store/account/ReturnsView';

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  robots: { index: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { order } = await searchParams;
  return <ReturnsView initialOrder={typeof order === 'string' ? order.slice(0, 64) : ''} />;
}
