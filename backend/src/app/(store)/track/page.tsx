import type { Metadata } from 'next';

import { TrackOrderView } from '@/components/store/TrackOrderView';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Check the delivery status of your Eckintosh Mall order.',
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await searchParams;
  const initialCode = typeof code === 'string' ? code.slice(0, 40) : '';

  return (
    <div className="container narrow" style={{ maxWidth: 1000 }}>
      <TrackOrderView initialCode={initialCode} />
    </div>
  );
}
