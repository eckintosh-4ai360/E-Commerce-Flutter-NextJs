'use client';

import { LogIn } from 'lucide-react';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

import { Spinner } from './ui';

export function GoogleSignInCard({
  title = 'Sign in with Google',
  description = 'Use your Google account to track orders, save addresses and keep your wishlist in sync with the app.',
}: {
  title?: string;
  description?: string;
}) {
  const { signIn, busy, error } = useAuth();
  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 18 }}>{title}</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        {description}
      </p>
      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}
      <button
        type="button"
        className="btn btn-outline btn-block"
        onClick={() => void signIn()}
        disabled={busy}
      >
        {busy ? <span className="spinner spinner--sm" /> : <LogIn size={16} />}
        {busy ? 'Signing in…' : 'Continue with Google'}
      </button>
    </div>
  );
}

/** Renders children only for signed-in customers; otherwise offers Google sign-in. */
export function RequireAuth({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return <Spinner label="Checking your account" />;
  }

  if (!user) {
    return (
      <div style={{ marginTop: 24 }}>
        <GoogleSignInCard title={title} description={description} />
      </div>
    );
  }

  return <>{children}</>;
}
