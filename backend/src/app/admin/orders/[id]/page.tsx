'use client';

import { ArrowLeft, FileText, Mail, MapPin, Phone, Wallet } from 'lucide-react';
import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { formatMoney } from '@/lib/money';
import { orderStatuses, paymentMethodLabel } from '@/lib/store-config';
import type { OrderView } from '@/lib/types';

import { StatusBadge, statusColors, statusIcons } from '../../_components/status';

const flow = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

type Notice = { tone: 'success' | 'warning' | 'error'; text: string };

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { authedFetch } = useAuth();
  const [order, setOrder] = useState<(OrderView & { customerUid: string | null }) | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(() => {
    return authedFetch<{ order: OrderView & { customerUid: string | null } }>(`/api/admin/orders/${id}`)
      .then(({ order: loaded }) => setOrder(loaded))
      .catch((caught) => setLoadError(errorMessage(caught)));
  }, [authedFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    setNotice(null);
    try {
      const payload = await authedFetch<{
        emailNotification?: { status: 'sent' | 'skipped' | 'failed'; message: string };
      }>(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        body: { status, note: note.trim() || null },
      });
      const email = payload.emailNotification;
      setNotice(
        email
          ? {
              tone: email.status === 'sent' ? 'success' : email.status === 'failed' ? 'error' : 'warning',
              text: `Status set to ${status}. ${email.message}`,
            }
          : { tone: 'success', text: `Status set to ${status}.` },
      );
      setNote('');
      await load();
    } catch (caught) {
      setNotice({ tone: 'error', text: errorMessage(caught, 'We could not update the order status.') });
    } finally {
      setUpdating(false);
    }
  };

  if (loadError) {
    return (
      <div className="admin-page">
        <Link href="/admin/orders" className="admin-btn admin-btn--sm" style={{ marginBottom: 20 }}><ArrowLeft size={14} /> Back</Link>
        <div className="admin-alert admin-alert--error">{loadError}</div>
      </div>
    );
  }

  if (!order) {
    return <div className="admin-center"><div className="admin-spinner" role="status" aria-label="Loading order" /></div>;
  }

  const currentStep = flow.indexOf(order.status);

  return (
    <div className="admin-page" style={{ maxWidth: 1100 }}>
      <Link href="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--a-text-2)', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div className="admin-page-head">
        <div>
          <h1>Order #{order.trackingCode}</h1>
          <p>
            Placed {new Date(order.createdAt).toLocaleString()} · <span className="admin-mono">{order.id}</span>
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {notice ? <div className={`admin-alert admin-alert--${notice.tone}`} role="status">{notice.text}</div> : null}

      {order.status !== 'CANCELLED' ? (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <h2>Order progress</h2>
          <div className="admin-stepper">
            {flow.map((step, index) => {
              const done = index <= currentStep;
              const color = done ? statusColors[step] : '#2a2a2a';
              const Icon = statusIcons[step];
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: index < flow.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${color}`, background: done ? `${color}22` : '#08284f', display: 'grid', placeItems: 'center', color }}>
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: 11, color: done ? color : '#555', fontWeight: done ? 600 : 400 }}>{step}</span>
                  </div>
                  {index < flow.length - 1 ? (
                    <div style={{ flex: 1, height: 2, margin: '0 8px 24px', background: index < currentStep ? statusColors[flow[index + 1]] : '#2a2a2a' }} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="admin-grid admin-grid--2" style={{ marginBottom: 20 }}>
        <div className="admin-card">
          <h2>Customer</h2>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{order.customerName}</div>
          <div className="admin-kv">
            <div><Phone size={14} /><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></div>
            {order.customerEmail ? <div><Mail size={14} /><a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></div> : null}
            {order.deliveryAddress ? <div><MapPin size={14} /><span>{order.deliveryAddress}</span></div> : null}
            <div><Wallet size={14} /><span>{paymentMethodLabel(order.paymentMethod)}</span></div>
            {order.notes ? <div><FileText size={14} /><span>{order.notes}</span></div> : null}
          </div>
        </div>

        <div className="admin-card">
          <h2>Summary</h2>
          {[
            ['Subtotal', formatMoney(order.subtotal)],
            ['Shipping', order.shippingFee === 0 ? 'Free' : formatMoney(order.shippingFee)],
            ['Total', formatMoney(order.total)],
          ].map(([label, value], index) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--a-text-3)' }}>{label}</span>
              <strong style={{ color: index === 2 ? 'var(--a-gold)' : undefined }}>{value}</strong>
            </div>
          ))}

          <div style={{ marginTop: 18 }}>
            <div className="admin-label" style={{ marginBottom: 8 }}>Update status</div>
            <input
              className="admin-input"
              placeholder="Optional note for the customer (included in the email)"
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {orderStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="admin-chip"
                  aria-pressed={order.status === status}
                  style={{ ['--chip-color' as string]: statusColors[status] }}
                  disabled={updating || order.status === status}
                  onClick={() => void updateStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid--2">
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>{['Product', 'Options', 'Unit', 'Qty', 'Subtotal'].map((heading) => <th key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="admin-thumb">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        <div style={{ fontSize: 11, color: 'var(--a-text-3)' }}>ID {item.productId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--a-text-2)', fontSize: 13 }}>{[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') || '—'}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td>×{item.quantity}</td>
                  <td style={{ fontWeight: 600, color: 'var(--a-gold)' }}>{formatMoney(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <h2>Timeline</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {[...order.events].reverse().map((event, index) => (
              <div key={`${event.createdAt}-${index}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <StatusBadge status={event.status} />
                <div style={{ fontSize: 12, color: 'var(--a-text-2)' }}>
                  {new Date(event.createdAt).toLocaleString()}
                  {event.note ? <div style={{ color: 'var(--a-text)' }}>{event.note}</div> : null}
                </div>
              </div>
            ))}
          </div>
          {order.returnRequests.length > 0 ? (
            <>
              <h2 style={{ marginTop: 22 }}>Returns</h2>
              {order.returnRequests.map((request) => (
                <div key={request.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>{request.reason}</span>
                  <StatusBadge status={request.status} />
                </div>
              ))}
              <Link href="/admin/returns" style={{ fontSize: 12, color: 'var(--a-gold)' }}>Manage returns →</Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
