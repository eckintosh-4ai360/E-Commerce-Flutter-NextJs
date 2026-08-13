'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { formatMoney } from '@/lib/money';
import { returnStatuses } from '@/lib/store-config';
import type { ReturnRequestView } from '@/lib/types';

import { StatusBadge, statusColors } from '../_components/status';

type AdminReturn = ReturnRequestView & {
  order: {
    id: string;
    trackingCode: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string;
    total: number;
  };
};

function ReturnRow({ item, onSaved }: { item: AdminReturn; onSaved: (message: string, tone: 'success' | 'warning' | 'error') => void }) {
  const { authedFetch } = useAuth();
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.adminNote ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = status !== item.status || note !== (item.adminNote ?? '');

  const save = async () => {
    setSaving(true);
    try {
      const result = await authedFetch<{ emailNotification: { status: string; message: string } }>(`/api/admin/returns/${item.id}`, {
        method: 'PATCH',
        body: { status, adminNote: note.trim() || null },
      });
      const email = result.emailNotification;
      onSaved(`Return for #${item.order.trackingCode} saved. ${email.message}`, email.status === 'failed' ? 'error' : email.status === 'skipped' ? 'warning' : 'success');
    } catch (caught) {
      onSaved(errorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td>
        <Link href={`/admin/orders/${item.order.id}`} className="admin-mono" style={{ color: 'var(--a-gold)' }}>#{item.order.trackingCode}</Link>
        <div style={{ fontSize: 12, color: 'var(--a-text-3)' }}>{formatMoney(item.order.total)}</div>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{item.order.customerName}</div>
        <div style={{ fontSize: 12, color: 'var(--a-text-3)' }}>{item.order.customerPhone}</div>
      </td>
      <td style={{ maxWidth: 280 }}>
        <div style={{ fontWeight: 600 }}>{item.reason}</div>
        {item.details ? <div style={{ fontSize: 12, color: 'var(--a-text-2)', whiteSpace: 'pre-wrap' }}>{item.details}</div> : null}
        <div style={{ fontSize: 11, color: 'var(--a-text-3)', marginTop: 4 }}>{new Date(item.createdAt).toLocaleString()}</div>
      </td>
      <td><StatusBadge status={item.status} /></td>
      <td style={{ minWidth: 260 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value as AdminReturn['status'])} aria-label="Return status">
            {returnStatuses.map((value) => <option key={value}>{value}</option>)}
          </select>
          <input className="admin-input" placeholder="Note for the customer" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} aria-label="Note for the customer" />
          <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save & notify'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ReturnsPage() {
  const { authedFetch } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [returns, setReturns] = useState<AdminReturn[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'warning' | 'error' } | null>(null);

  const load = useCallback(() => {
    const qs = filter === 'ALL' ? '' : `?status=${filter}`;
    return authedFetch<{ returns: AdminReturn[] }>(`/api/admin/returns${qs}`)
      .then((data) => setReturns(data.returns))
      .catch((caught) => setError(errorMessage(caught)));
  }, [authedFetch, filter]);

  useEffect(() => {
    setReturns(null);
    void load();
  }, [load]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Returns</h1>
          <p>Review return requests. Customers are emailed whenever a status changes.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        {['ALL', ...returnStatuses].map((value) => (
          <button key={value} type="button" className="admin-chip" aria-pressed={filter === value} style={{ ['--chip-color' as string]: statusColors[value] ?? '#d4af37' }} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>

      {notice ? <div className={`admin-alert admin-alert--${notice.tone}`} role="status">{notice.text}</div> : null}
      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

      {!returns ? (
        error ? null : <div className="admin-center" style={{ minHeight: 200 }}><div className="admin-spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>{['Order', 'Customer', 'Reason', 'Status', 'Update'].map((heading) => <th key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {returns.map((item) => (
                <ReturnRow
                  key={`${item.id}-${item.updatedAt}`}
                  item={item}
                  onSaved={(text, tone) => {
                    setNotice({ text, tone });
                    void load();
                  }}
                />
              ))}
              {returns.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty">No return requests</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
