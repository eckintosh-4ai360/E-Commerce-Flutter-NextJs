'use client';

import { ArrowLeft, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { formatDate } from '@/lib/client/format';
import { formatMoney } from '@/lib/money';
import type { OrderView } from '@/lib/types';

import { ProductImage } from '../ProductImage';
import { RequireAuth } from '../RequireAuth';
import { EmptyState, Spinner, StatusPill } from '../ui';

function OrdersList() {
  const { authedFetch, user } = useAuth();
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setOrders(null);
    authedFetch<{ orders: OrderView[] }>('/api/orders')
      .then((response) => setOrders(response.orders))
      .catch((caught) => setError(errorMessage(caught, 'We could not load your orders.')));
  }, [authedFetch]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="empty-state">
        <div className="alert alert--error" role="alert">{error}</div>
        <button type="button" className="btn btn-primary" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!orders) {
    return <Spinner label="Loading orders" />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={44} />}
        title="No orders yet"
        action={
          <Link href="/shop" className="btn btn-primary">
            Start shopping
          </Link>
        }
      >
        Orders you place with {user?.email} on the website or in the app will appear here.
      </EmptyState>
    );
  }

  return (
    <div>
      {orders.map((order) => {
        const first = order.items[0];
        const others = order.items.length - 1;
        return (
          <Link key={order.id} href={`/account/orders/${order.trackingCode}`} className="order-card">
            <div className="order-card__head">
              <div>
                <strong>Order #{order.trackingCode}</strong>
                <span className="muted small">{formatDate(order.createdAt)}</span>
              </div>
              <StatusPill status={order.status} />
            </div>
            <div className="order-card__body">
              <div className="thumb">
                {first?.imageUrl ? (
                  <ProductImage src={first.imageUrl} alt="" sizes="60px" />
                ) : (
                  <ShoppingBag size={22} style={{ margin: 19 }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>
                  {first
                    ? others > 0
                      ? `${first.productName} & ${others} other item${others === 1 ? '' : 's'}`
                      : first.productName
                    : 'No items recorded'}
                </div>
                <strong>{formatMoney(order.total)}</strong>
              </div>
            </div>
            <div className="order-card__foot">
              <span>{order.canCancel ? 'You can still cancel this order' : ' '}</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>View details →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function OrdersListView() {
  return (
    <div className="container narrow">
      <Link href="/account" className="back-link">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="page-title">My Orders</h1>
      <p className="page-subtitle">Everything you have ordered on the website and in the app.</p>
      <RequireAuth
        title="Sign in to view your orders"
        description="Your order history is linked to the Google account you used at checkout."
      >
        <OrdersList />
      </RequireAuth>
    </div>
  );
}
