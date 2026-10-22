import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminShell } from './_components/AdminShell';

import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · GlobaCart Admin' },
  description: 'Manage products, orders, returns and store data.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
