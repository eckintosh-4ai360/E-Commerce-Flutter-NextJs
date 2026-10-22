'use client';

import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { errorMessage } from '@/lib/client/api';
import { paymentOnDeliveryMethods } from '@/lib/store-config';
import type { CustomerProfile, PaymentMethod } from '@/lib/types';

import { RequireAuth } from '../RequireAuth';
import { Spinner } from '../ui';

function PaymentPreference() {
  const { authedFetch } = useAuth();
  const toast = useToast();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch<{ profile: CustomerProfile }>('/api/me')
      .then(({ profile }) => setSelected(profile.preferredPaymentMethod))
      .catch((caught) => setError(errorMessage(caught)));
  }, [authedFetch]);

  const choose = async (method: PaymentMethod) => {
    const previous = selected;
    setSelected(method);
    try {
      await authedFetch('/api/me', { method: 'PATCH', body: { preferredPaymentMethod: method } });
      toast('Payment preference saved', 'success');
    } catch (caught) {
      setSelected(previous);
      toast(errorMessage(caught), 'error');
    }
  };

  if (error) return <div className="alert alert--error" role="alert">{error}</div>;
  if (!selected) return <Spinner label="Loading payment preference" />;

  return (
    <>
      <div className="card">
        <h2>Preferred payment method</h2>
        <div className="radio-list">
          {paymentOnDeliveryMethods.map((method) => (
            <label key={method.value} className="radio-card">
              <input
                type="radio"
                name="payment-method"
                checked={selected === method.value}
                onChange={() => void choose(method.value)}
              />
              <span>
                <strong>{method.label}</strong>
                <span>{method.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="alert alert--info" style={{ marginTop: 16 }}>
        <Info size={18} />
        <span>
          We don&apos;t store card details. All orders are paid on delivery by cash or Mobile
          Money, and your choice is pre-selected at checkout.
        </span>
      </div>
    </>
  );
}

export function PaymentView() {
  return (
    <div className="container narrow" style={{ maxWidth: 640 }}>
      <Link href="/account" className="back-link">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="page-title">Payment Methods</h1>
      <p className="page-subtitle">How you&apos;d like to pay when your order arrives.</p>
      <RequireAuth title="Sign in to manage payment preferences">
        <PaymentPreference />
      </RequireAuth>
    </div>
  );
}
