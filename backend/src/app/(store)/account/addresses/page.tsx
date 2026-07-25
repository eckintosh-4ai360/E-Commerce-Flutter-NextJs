import type { Metadata } from 'next';

import { AddressesView } from '@/components/store/account/AddressesView';

export const metadata: Metadata = {
  title: 'Delivery Addresses',
  robots: { index: false },
};

export default function Page() {
  return <AddressesView />;
}
