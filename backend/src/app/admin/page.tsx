"use client";
import { useEffect, useState } from 'react';
import { Package, ShoppingBag, TrendingUp, AlertCircle, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#facc15',
  PROCESSING: '#60a5fa',
  SHIPPED: '#a78bfa',
  DELIVERED: '#4ade80',
  CANCELLED: '#f87171',
};
const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  PROCESSING: AlertCircle,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div style={{
      backgroundColor: '#111', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}><Icon size={22} /></div>
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#a0a0a0', marginTop: '4px' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#a0a0a0' }}>
      Loading dashboard…
    </div>
  );

  const { stats, statusBreakdown, recentOrders } = data;

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#f5f5f5' }}>Dashboard</h1>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#555' }}>
          Overview of your Eckintosh Mall storefront
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '36px' }}>
        <StatCard icon={TrendingUp} label="Total Revenue" value={`GH₵ ${stats.totalRevenue.toLocaleString()}`} color="#d4af37" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} sub={`${stats.ordersThisMonth} this month`} color="#60a5fa" />
        <StatCard icon={Package} label="Products" value={stats.totalProducts} sub={`${stats.outOfStockCount} out of stock`} color="#a78bfa" />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} sub="Awaiting action" color="#facc15" />
        <StatCard icon={AlertCircle} label="Out of Stock" value={stats.outOfStockCount} sub="Need restocking" color="#f87171" />
        <StatCard icon={CheckCircle} label="Delivered" value={statusBreakdown.find((s: any) => s.status === 'DELIVERED')?.count ?? 0} sub="Completed orders" color="#4ade80" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Order Status Breakdown */}
        <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#f5f5f5' }}>Orders by Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => {
              const entry = statusBreakdown.find((x: any) => x.status === s);
              const count = entry?.count ?? 0;
              const Icon = STATUS_ICONS[s];
              const color = STATUS_COLORS[s];
              const maxCount = Math.max(...statusBreakdown.map((x: any) => x.count), 1);
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#a0a0a0' }}>
                      <Icon size={14} color={color} />
                      {s}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color }}>{count}</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#1a1a1a', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, backgroundColor: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
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
