'use client';

import { LogIn, UserRound } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/providers/AuthProvider';

/** Hero account action once Firebase has resolved the current session. */
export function HeroSignInButton() {
  const { user, status, signIn, busy } = useAuth();

  if (status === 'loading') {
    return (
      <span className="btn btn-outline hero__auth-placeholder" aria-hidden="true">
        <LogIn size={16} />
        Sign in
      </span>
    );
  }

  if (user) {
    return (
      <Link href="/account" className="btn btn-outline">
        <UserRound size={16} aria-hidden="true" />
        Account
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => void signIn()}
      disabled={busy}
    >
      {busy ? <span className="spinner spinner--sm" /> : <LogIn size={16} aria-hidden="true" />}
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

