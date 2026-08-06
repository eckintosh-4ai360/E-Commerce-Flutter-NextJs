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
          <p>Overview of your Eckintosh Mall storefront</p>
        </div>
      </div>

      <div className="admin-grid admin-grid--kpi">
        <Kpi icon={<TrendingUp size={22} />} label="Revenue (excl. cancelled)" value={formatMoney(stats.totalRevenue, { decimals: 0 })} sub={`${formatMoney(stats.revenueThisMonth, { decimals: 0 })} this month`} color="#d4af37" />
        <Kpi icon={<ShoppingBag size={22} />} label="Total orders" value={stats.totalOrders} sub={`${stats.ordersThisMonth} this month`} color="#60a5fa" href="/admin/orders" />
        <Kpi icon={<Clock size={22} />} label="Pending orders" value={stats.pendingOrders} sub="Awaiting action" color="#facc15" href="/admin/orders?status=PENDING" />
        <Kpi icon={<RotateCcw size={22} />} label="Open returns" value={stats.openReturns} sub="Requested or approved" color="#fb923c" href="/admin/returns" />
        <Kpi icon={<Package size={22} />} label="Products" value={stats.totalProducts} sub={`${stats.outOfStockCount} out of stock`} color="#a78bfa" href="/admin/products" />
        <Kpi icon={<AlertCircle size={22} />} label="Out of stock" value={stats.outOfStockCount} sub="Need restocking" color="#f87171" />
        <Kpi icon={<CheckCircle size={22} />} label="Delivered" value={countFor('DELIVERED')} sub="Completed orders" color="#4ade80" />
        <Kpi icon={<Wallet size={22} />} label="Average order" value={formatMoney(stats.totalOrders > 0 ? stats.totalRevenue / Math.max(1, stats.totalOrders - countFor('CANCELLED')) : 0, { decimals: 0 })} sub="Excluding cancelled" color="#22d3ee" />
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

        {/* Recent Orders */}
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f5f5f5' }}>Recent Orders</h2>
            <Link href="/admin/orders" style={{ fontSize: '12px', color: '#d4af37', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.map((order: any) => {
              const color = STATUS_COLORS[order.status] ?? '#a0a0a0';
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', backgroundColor: '#161616', borderRadius: '8px',
                  textDecoration: 'none', border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f5' }}>{order.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#d4af37' }}>GH₵ {order.total}</div>
                    <div style={{ fontSize: '11px', color, marginTop: '2px', fontWeight: 600 }}>{order.status}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
