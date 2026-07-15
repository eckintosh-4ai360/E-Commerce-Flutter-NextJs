'use client';

import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { errorMessage } from '@/lib/client/api';
import { ghanaRegions, storeConfig } from '@/lib/store-config';
import type { AddressView } from '@/lib/types';

import { ConfirmDialog } from '../ConfirmDialog';
import { RequireAuth } from '../RequireAuth';
import { EmptyState, Spinner } from '../ui';

type Draft = Omit<AddressView, 'id'> & { id?: string };

const emptyDraft: Draft = {
  label: 'Home',
  recipientName: '',
  phone: '',
  street: '',
  city: '',
  region: 'Greater Accra',
  isDefault: false,
};

function AddressForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Draft;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { authedFetch } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const { id, ...body } = draft;
    try {
      await authedFetch(id ? `/api/me/addresses/${id}` : '/api/me/addresses', {
        method: id ? 'PUT' : 'POST',
        body,
      });
      toast(id ? 'Address updated' : 'Address saved', 'success');
      onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate style={{ marginBottom: 16 }}>
      <h2>{draft.id ? 'Edit address' : 'New address'}</h2>
      <div className="form-grid form-grid--2">
        <div className="field">
          <label htmlFor="addr-label">Label</label>
          <input id="addr-label" className="input" placeholder="Home, Work…" maxLength={40} value={draft.label} onChange={(e) => set('label', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="addr-name">Recipient name</label>
          <input id="addr-name" className="input" autoComplete="name" maxLength={100} value={draft.recipientName} onChange={(e) => set('recipientName', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="addr-phone">Phone number</label>
        <input id="addr-phone" className="input" type="tel" autoComplete="tel" maxLength={20} value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="addr-street">Street address or landmark</label>
        <input id="addr-street" className="input" autoComplete="street-address" maxLength={200} value={draft.street} onChange={(e) => set('street', e.target.value)} />
      </div>
      <div className="form-grid form-grid--2">
        <div className="field">
          <label htmlFor="addr-city">City or town</label>
          <input id="addr-city" className="input" autoComplete="address-level2" maxLength={80} value={draft.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="addr-region">Region</label>
          <select id="addr-region" className="select" value={draft.region} onChange={(e) => set('region', e.target.value)}>
            {ghanaRegions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="check-row" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={draft.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        Use as my default delivery address
      </label>
      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginBottom: 14 }}>
          {error}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddressBook() {
  const { authedFetch, user } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState<AddressView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<AddressView | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    authedFetch<{ addresses: AddressView[] }>('/api/me/addresses')
      .then((response) => setAddresses(response.addresses))
      .catch((caught) => setError(errorMessage(caught)));
  }, [authedFetch]);

  useEffect(load, [load]);

  const makeDefault = async (address: AddressView) => {
    const { id, ...body } = address;
    try {
      await authedFetch(`/api/me/addresses/${id}`, { method: 'PUT', body: { ...body, isDefault: true } });
      load();
    } catch (caught) {
      toast(errorMessage(caught), 'error');
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await authedFetch(`/api/me/addresses/${deleting.id}`, { method: 'DELETE' });
      toast('Address removed');
      load();
    } catch (caught) {
      toast(errorMessage(caught), 'error');
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  if (error) {
    return <div className="alert alert--error" role="alert">{error}</div>;
  }
  if (!addresses) {
    return <Spinner label="Loading addresses" />;
  }

  const canAdd = addresses.length < storeConfig.maxSavedAddresses;

  return (
    <>
      {editing ? (
        <AddressForm
          key={editing.id ?? 'new'}
          initial={editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {addresses.length === 0 && !editing ? (
        <EmptyState icon={<MapPin size={44} />} title="No saved addresses">
          Save an address to check out faster on the website and in the app.
        </EmptyState>
      ) : null}

      {addresses.map((address) => (
        <div key={address.id} className="address-card">
          <MapPin size={20} style={{ marginTop: 2 }} />
          <div className="address-card__body">
            <strong>
              {address.label}
              {address.isDefault ? <span className="badge badge--new" style={{ marginLeft: 8 }}>DEFAULT</span> : null}
            </strong>
            <div className="muted">
              {address.recipientName} · {address.phone}
              <br />
              {address.street}, {address.city}, {address.region}
            </div>
            <div className="address-card__actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...address })}>
                Edit
              </button>
              {!address.isDefault ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void makeDefault(address)}>
                  Set as default
                </button>
              ) : null}
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(address)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {!editing ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          disabled={!canAdd}
          onClick={() =>
            setEditing({
              ...emptyDraft,
              recipientName: user?.displayName ?? '',
              isDefault: addresses.length === 0,
            })
          }
        >
          <Plus size={16} /> Add new address
        </button>
      ) : null}
      {!canAdd ? (
        <p className="small muted">You can save up to {storeConfig.maxSavedAddresses} addresses.</p>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Remove address?"
          message={`${deleting.label}: ${deleting.street}, ${deleting.city}`}
          confirmLabel="Remove"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}

export function AddressesView() {
  return (
    <div className="container narrow">
      <Link href="/account" className="back-link">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="page-title">Delivery Addresses</h1>
      <p className="page-subtitle">Saved addresses are available at checkout on the website and in the app.</p>
      <RequireAuth title="Sign in to manage your addresses">
        <AddressBook />
      </RequireAuth>
    </div>
  );
}
