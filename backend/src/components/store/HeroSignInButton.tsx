'use client';

import { LogIn } from 'lucide-react';

import { useAuth } from '@/components/providers/AuthProvider';

/** Sign-in button rendered in the hero section. Triggers Google OAuth popup/redirect. */
export function HeroSignInButton() {
  const { user, signIn, busy } = useAuth();

  // Hide once the user is already signed in
  if (user) return null;

  return (
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => void signIn()}
      disabled={busy}
    >
      {busy ? <span className="spinner spinner--sm" /> : <LogIn size={16} />}
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
  );
}
