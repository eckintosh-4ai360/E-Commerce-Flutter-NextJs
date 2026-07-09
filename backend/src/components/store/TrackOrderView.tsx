'use client';

import { Search, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import type { OrderView } from '@/lib/types';

import { OrderDetail } from './OrderDetail';
import { Spinner } from './ui';

export function TrackOrderView({ initialCode }: { initialCode: string }) {
  const { authedFetch, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [code, setCode] = useState(initialCode);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(
    async (value: string) => {
      const cleaned = value.trim().replace(/^#/, '');
      if (!cleaned) {
        setError('Enter your tracking code first.');
        setOrder(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { order: found } = await authedFetch<{ order: OrderView }>(
          `/api/orders/${encodeURIComponent(cleaned)}`,
        );
        setOrder(found);
      } catch (caught) {
        setOrder(null);
        setError(errorMessage(caught, 'We could not find that order.'));
      } finally {
        setLoading(false);
      }
    },
    [authedFetch],
  );

  useEffect(() => {
    // Wait for auth so the owner gets the full view on first load.
    if (initialCode && status === 'ready') {
      void lookup(initialCode);
    }
  }, [initialCode, status, lookup]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = code.trim().replace(/^#/, '').toUpperCase();
    router.replace(cleaned ? `${pathname}?code=${encodeURIComponent(cleaned)}` : pathname, {
      scroll: false,
    });
    void lookup(cleaned);
  };

  return (
    <>
      <h1 className="page-title">Track Order</h1>
      <p className="page-subtitle">
        Enter the 10-character tracking code from your order confirmation email or the app.
      </p>
      <form className="track-form" onSubmit={submit} role="search">
        <label htmlFor="tracking-code" className="visually-hidden">
          Tracking code
        </label>
        <input
          id="tracking-code"
          className="input"
          placeholder="e.g. 7K2M9QX4PA"
          value={code}
          maxLength={40}
          autoComplete="off"
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Search size={16} /> {loading ? 'Looking up…' : 'Track now'}
        </button>
      </form>

      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 28 }}>
        {loading ? (
          <Spinner label="Looking up your order" />
        ) : order ? (
          <OrderDetail
            order={order}
            actions={
              !order.isRedacted ? (
                <Link href={`/account/orders/${order.trackingCode}`} className="btn btn-outline btn-block">
                  Manage this order
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Truck size={44} />
            </div>
            <p>Tracking information will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
}
