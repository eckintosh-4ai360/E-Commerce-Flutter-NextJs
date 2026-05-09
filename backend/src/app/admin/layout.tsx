import type { ReactNode } from 'react';
import AdminSidebar from './_components/Sidebar';

export const metadata = {
  title: 'Esiarko Admin CMS',
  description: 'Manage products, orders, and store data.',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080808' }}>
      <AdminSidebar />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#080808',
        overflow: 'auto',
      }}>
        {children}
      </main>
    </div>
  );
}
