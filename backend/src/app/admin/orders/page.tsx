"use client";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#facc15', PROCESSING: '#60a5fa', SHIPPED: '#a78bfa',
  DELIVERED: '#4ade80', CANCELLED: '#f87171',
};
const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock, PROCESSING: AlertCircle, SHIPPED: Truck,
  DELIVERED: CheckCircle, CANCELLED: XCircle,
};
const ALL_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
    fetch(`/api/admin/orders${qs}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders); setLoading(false); });
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerPhone.includes(search) ||
    o.id.includes(search)
  );

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#f5f5f5' }}>Orders</h1>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#555' }}>Track and manage all customer orders</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            placeholder="Search by name, phone, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: '#f5f5f5', fontSize: '14px', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              border: '1px solid',
              borderColor: statusFilter === s ? (STATUS_COLORS[s] ?? '#d4af37') : 'rgba(255,255,255,0.1)',
              backgroundColor: statusFilter === s ? `${(STATUS_COLORS[s] ?? '#d4af37')}18` : 'transparent',
              color: statusFilter === s ? (STATUS_COLORS[s] ?? '#d4af37') : '#a0a0a0',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '60px' }}>Loading orders…</div>
      ) : (
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', ''].map((h) => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const color = STATUS_COLORS[order.status];
                const Icon = STATUS_ICONS[order.status];
                return (
                  <tr key={order.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#a0a0a0' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f5' }}>{order.customerName}</div>
                      <div style={{ fontSize: '12px', color: '#555' }}>{order.customerPhone}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#a0a0a0' }}>
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#d4af37' }}>
                      GH₵ {order.total}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: `${color}18`, color,
                      }}>
                        <Icon size={12} /> {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#555' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/admin/orders/${order.id}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', color: '#a0a0a0', textDecoration: 'none',
                        padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1a1a1a',
                      }}>
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#555' }}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
