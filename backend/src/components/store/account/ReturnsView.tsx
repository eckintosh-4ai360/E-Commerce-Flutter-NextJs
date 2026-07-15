'use client';

import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { errorMessage } from '@/lib/client/api';
import { formatDate } from '@/lib/client/format';
import { returnReasons, storeConfig } from '@/lib/store-config';
import type { OrderView, ReturnRequestView } from '@/lib/types';

import { RequireAuth } from '../RequireAuth';
import { Spinner, StatusPill } from '../ui';

function Returns({ initialOrder }: { initialOrder: string }) {
  const { authedFetch } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [returns, setReturns] = useState<ReturnRequestView[] | null>(null);
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState<string>(returnReasons[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      authedFetch<{ orders: OrderView[] }>('/api/orders'),
      authedFetch<{ returns: ReturnRequestView[] }>('/api/me/returns'),
    ])
      .then(([ordersResponse, returnsResponse]) => {
        const eligible = ordersResponse.orders.filter((order) => order.canRequestReturn);
        setOrders(eligible);
        setReturns(returnsResponse.returns);
        const match = eligible.find(
          (order) => order.trackingCode === initialOrder.toUpperCase() || order.id === initialOrder,
        );
        setOrderId((current) => current || match?.id || eligible[0]?.id || '');
      })
      .catch((caught) => setError(errorMessage(caught)));
  }, [authedFetch, initialOrder]);

  useEffect(load, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await authedFetch<{ message: string }>('/api/me/returns', {
        method: 'POST',
        body: { orderId, reason, details: details.trim() || null },
      });
      toast(response.message, 'success');
      setDetails('');
      setOrderId('');
      load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  if (!orders || !returns) {
    return error ? <div className="alert alert--error" role="alert">{error}</div> : <Spinner label="Loading returns" />;
  }

  return (
    <>
      <div className="card">
        <h2>Our return policy</h2>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.7 }}>
          You have {storeConfig.returnWindowDays} days from delivery to request a return. Items must
          be unused, in the same condition you received them, and in their original packaging.
          Keep your receipt or order confirmation as proof of purchase. Approved refunds are paid
          back via Mobile Money or cash.
        </p>
      </div>

      <form className="card" onSubmit={submit} noValidate>
        <h2>Request a return</h2>
        {orders.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            You have no delivered orders within the {storeConfig.returnWindowDays}-day return
            window. Need help with an older order? Call {storeConfig.supportPhone}.
          </p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="return-order">Order</label>
              <select id="return-order" className="select" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.trackingCode} · {formatDate(order.createdAt)} · {order.items.map((item) => item.productName).join(', ').slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="return-reason">Reason for return</label>
              <select id="return-reason" className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {returnReasons.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="return-details">Details (optional)</label>
              <textarea
                id="return-details"
                className="textarea"
                maxLength={1000}
                placeholder="Tell us what went wrong so we can help faster."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            {error ? (
              <div className="alert alert--error" role="alert" style={{ marginBottom: 14 }}>
                {error}
              </div>
            ) : null}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !orderId}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </>
        )}
      </form>

      <div className="card">
        <h2>Your return requests</h2>
        {returns.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>No return requests yet.</p>
        ) : (
          returns.map((request) => (
            <div key={request.id} className="item-row">
              <RotateCcw size={18} />
              <div className="item-row__text">
                <strong>
                  Order <Link href={`/account/orders/${request.trackingCode}`}>#{request.trackingCode}</Link>
                </strong>
                <span>
                  {request.reason} · {formatDate(request.createdAt)}
                  {request.adminNote ? ` · ${request.adminNote}` : ''}
                </span>
              </div>
              <StatusPill status={request.status} />
            </div>
          ))
        )}
      </div>
    </>
  );
}

export function ReturnsView({ initialOrder }: { initialOrder: string }) {
  return (
    <div className="container narrow">
      <Link href="/account" className="back-link">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="page-title">Returns &amp; Refunds</h1>
      <p className="page-subtitle">Request a return and follow its progress.</p>
      <RequireAuth title="Sign in to request a return">
        <Returns initialOrder={initialOrder} />
      </RequireAuth>
    </div>
  );
}
