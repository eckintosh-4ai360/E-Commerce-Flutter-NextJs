'use client';

import { AlertCircle, CheckCircle, Clock, Package, RotateCcw, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { formatMoney } from '@/lib/money';
import { orderStatuses } from '@/lib/store-config';

import { StatusBadge, statusColors, statusIcons } from './_components/status';

type Stats = {
  stats: {
    totalProducts: number;
    totalOrders: number;
    ordersThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
    pendingOrders: number;
    outOfStockCount: number;
    openReturns: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    id: string;
    trackingCode: string;
    customerName: string;
    total: number;
    status: string;
    itemCount: number;
    createdAt: string;
  }>;
};

function Kpi({ icon, label, value, sub, color, href }: { icon: ReactNode; label: string; value: ReactNode; sub?: string; color: string; href?: string }) {
  const body = (
    <div className="admin-card kpi" style={{ height: '100%' }}>
      <div className="kpi__icon" style={{ background: `${color}1f`, color }}>{icon}</div>
      <div>
        <div className="kpi__value">{value}</div>
        <div className="kpi__label">{label}</div>
        {sub ? <div className="kpi__sub">{sub}</div> : null}
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{body}</Link> : body;
}

export default function AdminDashboard() {
  const { authedFetch } = useAuth();
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    authedFetch<Stats>('/api/admin/stats')
      .then(setData)
      .catch((caught) => setError(errorMessage(caught)));
  }, [authedFetch]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-alert admin-alert--error">{error}</div>
        <button type="button" className="admin-btn" onClick={load}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return <div className="admin-center"><div className="admin-spinner" role="status" aria-label="Loading dashboard" /></div>;
  }

  const { stats, statusBreakdown, recentOrders } = data;
  const maxCount = Math.max(1, ...statusBreakdown.map((entry) => entry.count));
  const countFor = (status: string) => statusBreakdown.find((entry) => entry.status === status)?.count ?? 0;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your GlobaCart GH storefront</p>
        </div>
      </div>

      <div className="admin-grid admin-grid--kpi">
        <Kpi icon={<TrendingUp size={22} />} label="Revenue (excl. cancelled)" value={formatMoney(stats.totalRevenue, { decimals: 0 })} sub={`${formatMoney(stats.revenueThisMonth, { decimals: 0 })} this month`} color="#9a5200" />
        <Kpi icon={<ShoppingBag size={22} />} label="Total orders" value={stats.totalOrders} sub={`${stats.ordersThisMonth} this month`} color="#2563c9" href="/admin/orders" />
        <Kpi icon={<Clock size={22} />} label="Pending orders" value={stats.pendingOrders} sub="Awaiting action" color="#9a5b00" href="/admin/orders?status=PENDING" />
        <Kpi icon={<RotateCcw size={22} />} label="Open returns" value={stats.openReturns} sub="Requested or approved" color="#c65d1b" href="/admin/returns" />
        <Kpi icon={<Package size={22} />} label="Products" value={stats.totalProducts} sub={`${stats.outOfStockCount} out of stock`} color="#7551b5" href="/admin/products" />
        <Kpi icon={<AlertCircle size={22} />} label="Out of stock" value={stats.outOfStockCount} sub="Need restocking" color="#c43d3d" />
        <Kpi icon={<CheckCircle size={22} />} label="Delivered" value={countFor('DELIVERED')} sub="Completed orders" color="#167a3f" />
        <Kpi icon={<Wallet size={22} />} label="Average order" value={formatMoney(stats.totalOrders > 0 ? stats.totalRevenue / Math.max(1, stats.totalOrders - countFor('CANCELLED')) : 0, { decimals: 0 })} sub="Excluding cancelled" color="#187d91" />
      </div>

      <div className="admin-grid admin-grid--2">
        <div className="admin-card">
          <h2>Orders by status</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {orderStatuses.map((status) => {
              const count = countFor(status);
              const Icon = statusIcons[status];
              const color = statusColors[status];
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--a-text-2)' }}>
                      <Icon size={14} color={color} /> {status}
                    </span>
                    <strong style={{ color }}>{count}</strong>
                  </div>
                  <div style={{ height: 4, background: 'var(--a-surface-2)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Recent orders</h2>
            <Link href="/admin/orders" style={{ fontSize: 12, color: 'var(--a-gold)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="admin-empty">No orders yet</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, background: 'var(--a-surface-2)', borderRadius: 8, textDecoration: 'none', border: '1px solid var(--a-line)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--a-text-3)', marginTop: 2 }}>
                      #{order.trackingCode} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'grid', gap: 4, justifyItems: 'end' }}>
                    <strong style={{ color: 'var(--a-gold)' }}>{formatMoney(order.total)}</strong>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
