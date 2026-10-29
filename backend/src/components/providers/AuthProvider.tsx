'use client';

import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  onIdTokenChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  signInWithFacebook: () => Promise<boolean>;
  sendPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  confirmPhoneVerification: (code: string) => Promise<boolean>;
  cancelPhoneVerification: () => void;
  phoneVerificationPending: boolean;
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
      return 'This website is not yet authorised for sign-in. Add its domain in Firebase Console → Authentication → Settings.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number with its country code, for example +233241234567.';
    case 'auth/invalid-verification-code':
      return 'That verification code is incorrect. Please try again.';
    case 'auth/code-expired':
      return 'That verification code has expired. Request a new one.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a little before trying again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

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

  const signInWithFacebook = useCallback(async () => {
    setBusy(true);
    setError(null);
    const auth = getFirebaseAuth();
    const provider = new FacebookAuthProvider();
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

  const clearRecaptcha = useCallback(() => {
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = null;
  }, []);

  useEffect(() => clearRecaptcha, [clearRecaptcha]);

  const sendPhoneVerification = useCallback(async (phoneNumber: string) => {
    const normalised = phoneNumber.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalised)) {
      setError('Enter a valid phone number with its country code, for example +233241234567.');
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!recaptchaVerifier.current) {
        const container = document.getElementById('firebase-phone-recaptcha');
        if (!container) throw new Error('Phone sign-in is unavailable. Please refresh and try again.');
        recaptchaVerifier.current = new RecaptchaVerifier(auth, container, { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, normalised, recaptchaVerifier.current);
      setPhoneConfirmation(confirmation);
      return true;
    } catch (caught) {
      clearRecaptcha();
      setError(caught instanceof Error && !('code' in caught) ? caught.message : describeAuthError(caught));
      return false;
    } finally {
      setBusy(false);
    }
  }, [clearRecaptcha]);

  const confirmPhoneVerification = useCallback(async (code: string) => {
    if (!phoneConfirmation) {
      setError('Request a verification code first.');
      return false;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the six-digit verification code.');
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      await phoneConfirmation.confirm(code.trim());
      setPhoneConfirmation(null);
      clearRecaptcha();
      return true;
    } catch (caught) {
      setError(describeAuthError(caught));
      return false;
    } finally {
      setBusy(false);
    }
  }, [clearRecaptcha, phoneConfirmation]);

  const cancelPhoneVerification = useCallback(() => {
    setPhoneConfirmation(null);
    clearRecaptcha();
    setError(null);
  }, [clearRecaptcha]);

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
      signInWithFacebook,
      sendPhoneVerification,
      confirmPhoneVerification,
      cancelPhoneVerification,
      phoneVerificationPending: phoneConfirmation !== null,
      signOut,
      clearError: () => setError(null),
      authedFetch,
    }),
    [user, status, busy, error, signIn, signInWithFacebook, sendPhoneVerification, confirmPhoneVerification, cancelPhoneVerification, phoneConfirmation, signOut, authedFetch],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div id="firebase-phone-recaptcha" />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
