'use client';

import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch, type ApiOptions } from '@/lib/client/api';
import { getFirebaseAuth } from '@/lib/client/firebase';

type AuthStatus = 'loading' | 'ready';

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  busy: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** Calls the API with the signed-in user's ID token attached. */
  authedFetch: <T>(path: string, options?: Omit<ApiOptions, 'token'>) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function describeAuthError(error: unknown) {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/network-request-failed':
      return 'Network error while signing in. Check your connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This website is not yet authorised for Google sign-in. Add its domain in Firebase Console → Authentication → Settings.';
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onIdTokenChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setStatus('ready');
    });
  }, []);

  const signIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      return true;
    } catch (caught) {
      if ((caught as { code?: string })?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return false;
      }
      setError(describeAuthError(caught));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await firebaseSignOut(getFirebaseAuth());
    } finally {
      setBusy(false);
    }
  }, []);

  const authedFetch = useCallback(
    async <T,>(path: string, options: Omit<ApiOptions, 'token'> = {}) => {
      const current = getFirebaseAuth().currentUser;
      const token = current ? await current.getIdToken() : null;
      return apiFetch<T>(path, { ...options, token });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      busy,
      error,
      signIn,
      signOut,
      clearError: () => setError(null),
      authedFetch,
    }),
    [user, status, busy, error, signIn, signOut, authedFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
