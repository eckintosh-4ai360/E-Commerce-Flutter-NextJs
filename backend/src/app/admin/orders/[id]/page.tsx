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
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${color}`, background: done ? `${color}22` : '#1a1a1a', display: 'grid', placeItems: 'center', color }}>
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

      {/* Order Items */}
      <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Order Items ({order.items.length})
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Product', 'Color', 'Size', 'Unit Price', 'Qty', 'Subtotal'].map((h) => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, i: number) => (
              <tr key={item.id} style={{ borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f5' }}>{item.productName}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>ID: {item.productId}</div>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#a0a0a0' }}>{item.selectedColor || '—'}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#a0a0a0' }}>{item.selectedSize || '—'}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#f5f5f5' }}>GH₵ {item.unitPrice}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#f5f5f5' }}>×{item.quantity}</td>
                <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: '#d4af37' }}>
                  GH₵ {(item.unitPrice * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
