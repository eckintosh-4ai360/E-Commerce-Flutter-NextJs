"use client";
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, Truck, XCircle, AlertCircle, Phone, Mail, MapPin, FileText } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#facc15', PROCESSING: '#60a5fa', SHIPPED: '#a78bfa',
  DELIVERED: '#4ade80', CANCELLED: '#f87171',
};
const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock, PROCESSING: AlertCircle, SHIPPED: Truck,
  DELIVERED: CheckCircle, CANCELLED: XCircle,
};
const STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    tone: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.order); setLoading(false); });
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    setUpdateMessage(null);
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setUpdateMessage({
        tone: 'error',
        text: payload.error ?? 'We could not update the order status.',
      });
      setUpdating(false);
      return;
    }

    const emailNotification = payload.emailNotification;
    if (emailNotification) {
      setUpdateMessage({
        tone:
          emailNotification.status === 'sent'
            ? 'success'
            : emailNotification.status === 'failed'
                ? 'error'
                : 'warning',
        text: emailNotification.message,
      });
    } else {
      setUpdateMessage({
        tone: 'success',
        text: 'Order status updated.',
      });
    }

    const d = await fetch(`/api/admin/orders/${id}`).then((r) => r.json());
    setOrder(d.order);
    setUpdating(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#a0a0a0' }}>
      Loading order…
    </div>
  );

  if (!order) return (
    <div style={{ padding: '40px 48px', color: '#f87171' }}>Order not found.</div>
  );

  const statusColor = STATUS_COLORS[order.status];
  const StatusIcon = STATUS_ICONS[order.status];
  const currentStep = STATUS_FLOW.indexOf(order.status);

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>
      {/* Back + Header */}
      <Link href="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', textDecoration: 'none', fontSize: '13px', marginBottom: '24px' }}>
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#f5f5f5' }}>
            Order #{order.id.slice(-10).toUpperCase()}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#555' }}>
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
          backgroundColor: `${statusColor}18`, color: statusColor,
        }}>
          <StatusIcon size={16} /> {order.status}
        </span>
      </div>

      {updateMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 16px',
          borderRadius: '10px',
          border: '1px solid',
          borderColor:
            updateMessage.tone === 'success'
              ? 'rgba(74,222,128,0.35)'
              : updateMessage.tone === 'error'
                  ? 'rgba(248,113,113,0.35)'
                  : 'rgba(250,204,21,0.35)',
          backgroundColor:
            updateMessage.tone === 'success'
              ? 'rgba(74,222,128,0.08)'
              : updateMessage.tone === 'error'
                  ? 'rgba(248,113,113,0.08)'
                  : 'rgba(250,204,21,0.08)',
          color:
            updateMessage.tone === 'success'
              ? '#4ade80'
              : updateMessage.tone === 'error'
                  ? '#f87171'
                  : '#facc15',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {updateMessage.text}
        </div>
      )}

      {/* Progress stepper (not shown for CANCELLED) */}
      {order.status !== 'CANCELLED' && (
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Progress</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {STATUS_FLOW.map((s, i) => {
              const isComplete = i <= currentStep;
              const color = isComplete ? STATUS_COLORS[s] : '#2a2a2a';
              const Icon = STATUS_ICONS[s];
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_FLOW.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isComplete ? `${color}22` : '#1a1a1a', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: '11px', color: isComplete ? color : '#555', fontWeight: isComplete ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{ flex: 1, height: '2px', backgroundColor: i < currentStep ? STATUS_COLORS[STATUS_FLOW[i + 1]] : '#2a2a2a', margin: '0 8px', marginBottom: '24px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Customer Info */}
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer</h2>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f5f5f5', marginBottom: '16px' }}>{order.customerName}</div>
          {[
            { icon: Phone, value: order.customerPhone },
            { icon: Mail, value: order.customerEmail },
            { icon: MapPin, value: order.deliveryAddress },
            { icon: FileText, value: order.notes, label: 'Notes' },
          ].filter((r) => r.value).map(({ icon: Icon, value, label }) => (
            <div key={value} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
              <Icon size={14} style={{ color: '#555', marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#a0a0a0', lineHeight: 1.5 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px' }}>Summary</h2>
          {[
            { label: 'Subtotal', value: `GH₵ ${order.subtotal}` },
            { label: 'Shipping Fee', value: order.shippingFee === 0 ? 'Free' : `GH₵ ${order.shippingFee}` },
            { label: 'Total', value: `GH₵ ${order.total}`, bold: true },
          ].map(({ label, value, bold }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
              <span style={{ fontSize: '14px', fontWeight: bold ? 700 : 500, color: bold ? '#d4af37' : '#f5f5f5' }}>{value}</span>
            </div>
          ))}

          {/* Status Actions */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Update Status</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                <button key={s} onClick={() => updateStatus(s)} disabled={updating || order.status === s} style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: order.status === s ? 'default' : 'pointer',
                  border: '1px solid',
                  borderColor: order.status === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.1)',
                  backgroundColor: order.status === s ? `${STATUS_COLORS[s]}22` : 'transparent',
                  color: order.status === s ? STATUS_COLORS[s] : '#a0a0a0',
                  opacity: updating ? 0.5 : 1,
                }}>
                  {s}
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
