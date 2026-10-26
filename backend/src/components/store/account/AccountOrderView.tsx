'use client';

import { ArrowLeft, CheckCircle2, RotateCcw, ShoppingBag, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { apiFetch, errorMessage } from '@/lib/client/api';
import type { OrderView, StoreProduct } from '@/lib/types';

import { ConfirmDialog } from '../ConfirmDialog';
import { OrderDetail } from '../OrderDetail';
import { RequireAuth } from '../RequireAuth';
import { Spinner } from '../ui';

type PaymentResult = 'success' | 'pending' | 'cancelled' | null;

function OrderPanel({
  reference,
  justPlaced,
  paymentResult,
}: {
  reference: string;
  justPlaced: boolean;
  paymentResult: PaymentResult;
}) {
  const { authedFetch, user } = useAuth();
  const cart = useCart();
  const clearCart = cart.clear;
  const toast = useToast();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    authedFetch<{ order: OrderView }>(`/api/orders/${encodeURIComponent(reference)}`)
      .then((response) => {
        if (response.order.isRedacted) {
          setError('This order belongs to a different account.');
        } else {
          setOrder(response.order);
        }
      })
      .catch((caught) => setError(errorMessage(caught, 'We could not load this order.')));
  }, [authedFetch, reference]);

  useEffect(load, [load]);

  useEffect(() => {
    if (paymentResult === 'success' || order?.paymentStatus === 'PAID') {
      clearCart();
    }
  }, [clearCart, order?.paymentStatus, paymentResult]);

  useEffect(() => {
    if (paymentResult !== 'pending' || order?.paymentStatus === 'PAID') return;
    // Paystack sends the signed confirmation asynchronously. Refresh briefly
    // so a customer sees the confirmed state without having to reload.
    const interval = window.setInterval(load, 4_000);
    return () => window.clearInterval(interval);
  }, [load, order?.paymentStatus, paymentResult]);

  const cancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const response = await authedFetch<{ order: OrderView }>(
        `/api/orders/${encodeURIComponent(order.id)}/cancel`,
        { method: 'POST' },
      );
      setOrder(response.order);
      toast('Your order has been cancelled.', 'success');
    } catch (caught) {
      toast(errorMessage(caught), 'error');
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const reorder = async () => {
    if (!order) return;
    try {
      const { products } = await apiFetch<{ products: StoreProduct[] }>('/api/catalog');
      const byId = new Map(products.map((product) => [product.id, product]));
      let added = 0;
      for (const item of order.items) {
        const product = byId.get(item.productId);
        if (product?.inStock) {
          const result = cart.add(product, {
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
          });
          if (result === 'added' || result === 'updated') added += 1;
        }
      }
      toast(
        added === order.items.length
          ? 'All items were added to your cart.'
          : added > 0
            ? `${added} of ${order.items.length} items were added; the rest are unavailable.`
            : 'These items are no longer available.',
        added > 0 ? 'success' : 'error',
      );
    } catch (caught) {
      toast(errorMessage(caught), 'error');
    }
  };

  if (error) {
    return (
      <div className="alert alert--error" role="alert" style={{ marginTop: 16 }}>
        {error}
      </div>
    );
  }

  if (!order) {
    return <Spinner label="Loading order" />;
  }

  return (
    <>
      {paymentResult === 'cancelled' ? (
        <div className="alert alert--error" role="status" style={{ marginBottom: 16 }}>
          This order was cancelled before Paystack confirmed payment. Contact support if you need
          help with the payment.
        </div>
      ) : paymentResult === 'pending' && order.paymentStatus !== 'PAID' ? (
        <div className="alert alert--warn" role="status" style={{ marginBottom: 16 }}>
          Paystack has not confirmed this payment yet. The order will remain on hold until payment
          succeeds.
        </div>
      ) : paymentResult === 'pending' && order.paymentStatus === 'PAID' ? (
        <div className="alert alert--success" role="status" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          <span>Paystack payment confirmed! Your order is now being prepared.</span>
        </div>
      ) : justPlaced ? (
        <div className="alert alert--success" role="status" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          <span>
            {paymentResult === 'success' ? 'Payment confirmed!' : 'Order placed!'} A
            confirmation has been sent to <strong>{user?.email}</strong>. Your tracking code is{' '}
            <strong>{order.trackingCode}</strong>.
          </span>
        </div>
      ) : null}

      <OrderDetail
        order={order}
        actions={
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {order.canRequestReturn ? (
              <Link href={`/account/returns?order=${order.trackingCode}`} className="btn btn-outline btn-block">
                <RotateCcw size={16} /> Request a return
              </Link>
            ) : null}
            <button type="button" className="btn btn-ghost btn-block" onClick={() => void reorder()}>
              <ShoppingBag size={16} /> Buy again
            </button>
            {order.canCancel ? (
              <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmCancel(true)}>
                <XCircle size={16} /> Cancel order
              </button>
            ) : null}
          </div>
        }
      />

      {confirmCancel ? (
        <ConfirmDialog
          title="Cancel this order?"
          message="We'll stop preparing it and email you a confirmation. This can't be undone."
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          danger
          busy={cancelling}
          onConfirm={() => void cancel()}
          onCancel={() => setConfirmCancel(false)}
        />
      ) : null}
    </>
  );
}

export function AccountOrderView({
  reference,
  justPlaced,
  paymentResult,
}: {
  reference: string;
  justPlaced: boolean;
  paymentResult: PaymentResult;
}) {
  return (
    <div className="container" style={{ maxWidth: 1000 }}>
      <Link href="/account/orders" className="back-link">
        <ArrowLeft size={16} /> My orders
      </Link>
      <h1 className="page-title">Order details</h1>
      <div style={{ marginTop: 16 }}>
        <RequireAuth title="Sign in to view this order">
          <OrderPanel
            reference={reference}
            justPlaced={justPlaced}
            paymentResult={paymentResult}
          />
        </RequireAuth>
      </div>
    </div>
  );
}
