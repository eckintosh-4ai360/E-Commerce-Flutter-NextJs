'use client';

import {
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === href : pathname.startsWith(href);
}

function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <>
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand__mark">G</span>
          <span>
            <strong>GlobalCart GH</strong>
            <span>Admin CMS</span>
          </span>
        </Link>
        <nav className="admin-nav" aria-label="Admin">
          <div className="admin-nav__label">Main menu</div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{label}</span>
                {active ? <ChevronRight size={14} /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar__foot">
          Signed in as
          <br />
          <strong style={{ color: 'var(--a-text)' }}>{email}</strong>
          <br />
          <Link href="/">
            <ExternalLink size={13} /> View store
          </Link>
          <button type="button" onClick={() => void signOut()}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>
      <nav className="admin-mobile-bar" aria-label="Admin">
        {navItems.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={isActive(pathname, href) ? 'page' : undefined}>
            {label}
          </Link>
        ))}
        <Link href="/">Store ↗</Link>
      </nav>
    </>
  );
}

type GateState =
  | { kind: 'checking' }
  | { kind: 'allowed'; email: string }
  | { kind: 'denied'; message: string };

function AdminGate({ children }: { children: ReactNode }) {
  const { user, status, signIn, signOut, busy, error, authedFetch } = useAuth();
  const [gate, setGate] = useState<GateState>({ kind: 'checking' });
  const uid = user?.uid ?? null;

  // Keyed on the uid so hourly token refreshes don't re-run the check.
  useEffect(() => {
    setGate({ kind: 'checking' });
    if (!uid) {
      return;
    }
    authedFetch<{ admin: { email: string } }>('/api/admin/me')
      .then(({ admin }) => setGate({ kind: 'allowed', email: admin.email }))
      .catch((caught) => setGate({ kind: 'denied', message: errorMessage(caught) }));
  }, [uid, authedFetch]);

  if (status === 'loading' || (user && gate.kind === 'checking')) {
    return (
      <div className="admin-center">
        <div className="admin-spinner" role="status" aria-label="Checking access" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-center">
        <div className="admin-card" style={{ maxWidth: 420 }}>
          <div className="admin-brand__mark" style={{ margin: '0 auto 16px' }}>G</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, color: 'var(--a-text)' }}>GlobalCart Admin</h1>
          <p style={{ margin: '0 0 20px' }}>Sign in with an authorised Google account to manage the store.</p>
          {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}
          <button type="button" className="admin-btn admin-btn--primary" style={{ width: '100%' }} onClick={() => void signIn()} disabled={busy}>
            <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  if (gate.kind === 'denied') {
    return (
      <div className="admin-center">
        <div className="admin-card" style={{ maxWidth: 460 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--a-text)' }}>Access denied</h1>
          <div className="admin-alert admin-alert--error">{gate.message}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="admin-btn" onClick={() => void signOut()}>
              <LogOut size={14} /> Use another account
            </button>
            <Link href="/" className="admin-btn">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (gate.kind !== 'allowed') {
    return null;
  }

  return (
    <div className="admin-layout">
      <Sidebar email={gate.email} />
      <main className="admin-main">{children}</main>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminGate>{children}</AdminGate>
    </AuthProvider>
  );
}
