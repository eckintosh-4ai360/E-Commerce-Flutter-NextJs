'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { errorMessage } from '@/lib/client/api';
import type { CustomerProfile } from '@/lib/types';

import { Avatar } from '../Avatar';
import { RequireAuth } from '../RequireAuth';
import { Spinner } from '../ui';

function ProfileForm() {
  const { authedFetch, user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch<{ profile: CustomerProfile }>('/api/me')
      .then(({ profile: loaded }) => {
        setProfile(loaded);
        setName(loaded.name ?? user?.displayName ?? '');
        setPhone(loaded.phone ?? '');
      })
      .catch((caught) => setError(errorMessage(caught)));
  }, [authedFetch, user]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await authedFetch<{ profile: CustomerProfile }>('/api/me', {
        method: 'PATCH',
        body: { name: name.trim(), phone: phone.trim() },
      });
      setProfile(response.profile);
      toast('Profile saved', 'success');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  if (!profile && !error) {
    return <Spinner label="Loading profile" />;
  }

  return (
    <form className="card" onSubmit={save} noValidate>
      {user ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ transform: 'scale(2.2)', margin: 20 }}>
            <Avatar user={user} />
          </span>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="profile-name">Full name</label>
        <input
          id="profile-name"
          className="input"
          autoComplete="name"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="profile-email">Email address</label>
        <input id="profile-email" className="input" value={profile?.email ?? user?.email ?? ''} readOnly />
        <span className="field-hint">Your email comes from your Google account.</span>
      </div>
      <div className="field">
        <label htmlFor="profile-phone">Phone number</label>
        <input
          id="profile-phone"
          className="input"
          type="tel"
          autoComplete="tel"
          placeholder="059 859 9687"
          value={phone}
          maxLength={20}
          onChange={(event) => setPhone(event.target.value)}
        />
        <span className="field-hint">Used to pre-fill checkout and for delivery calls.</span>
      </div>
      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 14 }}>
          {error}
        </div>
      ) : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

export function ProfileView() {
  return (
    <div className="container narrow" style={{ maxWidth: 560 }}>
      <Link href="/account" className="back-link">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="page-title">Edit Profile</h1>
      <p className="page-subtitle">Changes apply on the website and in the app.</p>
      <RequireAuth title="Sign in to edit your profile">
        <ProfileForm />
      </RequireAuth>
    </div>
  );
}
