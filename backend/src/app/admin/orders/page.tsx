'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { formatMoney } from '@/lib/money';
import { orderStatuses, paymentMethodLabel } from '@/lib/store-config';

import { StatusBadge, statusColors } from '../_components/status';

type OrderRow = {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
};

type OrdersResponse = { orders: OrderRow[]; total: number; page: number; pageSize: number };

function OrdersTable() {
  const { authedFetch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = params.get('status') ?? 'ALL';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const query = params.get('q') ?? '';

  const [search, setSearch] = useState(query);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = (next: { status?: string; page?: number; q?: string }) => {
    const queryString = new URLSearchParams();
    const nextStatus = next.status ?? status;
    const nextQuery = next.q ?? query;
    const nextPage = next.page ?? 1;
    if (nextStatus !== 'ALL') queryString.set('status', nextStatus);
    if (nextQuery) queryString.set('q', nextQuery);
    if (nextPage > 1) queryString.set('page', String(nextPage));
    const qs = queryString.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Debounce typing so the server is queried once the admin pauses.
  useEffect(() => {
    if (search === query) return;
    const timer = window.setTimeout(() => navigate({ q: search.trim(), page: 1 }), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status !== 'ALL') qs.set('status', status);
    if (query) qs.set('q', query);
    setError(null);
    authedFetch<OrdersResponse>(`/api/admin/orders?${qs}`, { signal: controller.signal })
      .then(setData)
      .catch((caught) => {
        if ((caught as Error)?.name !== 'AbortError') setError(errorMessage(caught));
      });
    return () => controller.abort();
  }, [authedFetch, page, status, query]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Orders</h1>
          <p>Track and manage all customer orders</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} />
          <input
            className="admin-input"
            placeholder="Search name, phone, email, tracking code…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search orders"
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', ...orderStatuses].map((value) => (
            <button
              key={value}
              type="button"
              className="admin-chip"
              aria-pressed={status === value}
              style={{ ['--chip-color' as string]: statusColors[value] ?? '#d4af37' }}
              onClick={() => navigate({ status: value, page: 1 })}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

      {!data ? (
        <div className="admin-center" style={{ minHeight: 200 }}><div className="admin-spinner" /></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-mono" style={{ color: 'var(--a-text-2)' }}>#{order.trackingCode}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--a-text-3)' }}>{order.customerPhone}</div>
                    </td>
                    <td style={{ color: 'var(--a-text-2)' }}>
                      {order.itemCount} line{order.itemCount === 1 ? '' : 's'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--a-gold)' }}>{formatMoney(order.total)}</td>
                    <td style={{ fontSize: 12, color: 'var(--a-text-2)' }}>{paymentMethodLabel(order.paymentMethod)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--a-text-3)' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="admin-btn admin-btn--sm">
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-empty">No orders found</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span>
              {data.total} order{data.total === 1 ? '' : 's'} · page {data.page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => navigate({ page: page - 1 })}>
                <ChevronLeft size={14} /> Previous
              </button>
              <button type="button" className="admin-btn admin-btn--sm" disabled={page >= totalPages} onClick={() => navigate({ page: page + 1 })}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="admin-center"><div className="admin-spinner" /></div>}>
      <OrdersTable />
    </Suspense>
  );
}
