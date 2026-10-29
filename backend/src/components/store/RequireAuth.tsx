'use client';

import { LogIn, Smartphone } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

import { FacebookIcon } from './brand-icons';
import { Spinner } from './ui';

export function SignInCard({
  title = 'Sign in',
  description = 'Sign in to track orders, save addresses and keep your wishlist in sync with the app.',
}: {
  title?: string;
  description?: string;
}) {
  const {
    signIn,
    signInWithFacebook,
    sendPhoneVerification,
    confirmPhoneVerification,
    cancelPhoneVerification,
    phoneVerificationPending,
    busy,
    error,
  } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    await sendPhoneVerification(phoneNumber);
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    await confirmPhoneVerification(verificationCode);
  };

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
      {!phoneVerificationPending ? (
        <>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => void signIn()}
            disabled={busy}
          >
            {busy ? <span className="spinner spinner--sm" /> : <LogIn size={16} />}
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>
          <button
            type="button"
            className="btn btn-block"
            style={{ marginTop: 10, background: '#1877f2', color: '#fff' }}
            onClick={() => void signInWithFacebook()}
            disabled={busy}
          >
            <FacebookIcon size={18} />
            Continue with Facebook
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px', color: '#667085', fontSize: 12 }}>
            <span style={{ height: 1, flex: 1, background: '#dce3ec' }} />
            or use your phone
            <span style={{ height: 1, flex: 1, background: '#dce3ec' }} />
          </div>
          <form onSubmit={sendCode} noValidate>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="sign-in-phone">Phone number</label>
              <input
                id="sign-in-phone"
                className="input"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+233 24 123 4567"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                disabled={busy}
              />
            </div>
            <button type="submit" className="btn btn-outline btn-block" disabled={busy}>
              {busy ? <span className="spinner spinner--sm" /> : <Smartphone size={16} />}
              {busy ? 'Sending code…' : 'Send verification code'}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={verifyCode} noValidate>
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="sign-in-code">Verification code</label>
            <input
              id="sign-in-code"
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={verificationCode}
              maxLength={6}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
              disabled={busy}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spinner spinner--sm" /> : <Smartphone size={16} />}
            {busy ? 'Verifying…' : 'Verify and sign in'}
          </button>
          <button type="button" className="text-btn" style={{ display: 'block', margin: '12px auto 0' }} onClick={cancelPhoneVerification} disabled={busy}>
            Use a different sign-in method
          </button>
        </form>
      )}
    </div>
  );
}

/** @deprecated Use SignInCard. Kept for callers outside this project. */
export const GoogleSignInCard = SignInCard;

/** Renders children only for signed-in customers; otherwise offers sign-in options. */
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
        <SignInCard title={title} description={description} />
      </div>
    );
  }

  return <>{children}</>;
}
