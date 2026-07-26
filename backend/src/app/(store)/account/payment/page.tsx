import type { Metadata } from 'next';

import { PaymentView } from '@/components/store/account/PaymentView';

export const metadata: Metadata = {
  title: 'Payment Methods',
  robots: { index: false },
};

export default function Page() {
  return <PaymentView />;
}
