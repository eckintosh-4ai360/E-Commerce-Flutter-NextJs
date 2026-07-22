import type { Metadata } from 'next';

import { AccountView } from '@/components/store/account/AccountView';

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false },
};

export default function Page() {
  return <AccountView />;
}
