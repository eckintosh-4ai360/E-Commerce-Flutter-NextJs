import type { Metadata } from 'next';

import { OrdersListView } from '@/components/store/account/OrdersListView';

export const metadata: Metadata = {
  title: 'My Orders',
  robots: { index: false },
};

export default function Page() {
  return <OrdersListView />;
}
