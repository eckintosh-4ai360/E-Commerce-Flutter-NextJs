'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { buyForMeStatuses } from '@/lib/validation';

type Item = { id: string; itemName: string; itemUrl: string; itemValue: number; currency: string; quantity: number; retailerShipping: number | null; shippingFrom: string; shippingMode: string; category: string | null; instructions: string | null; insurance: boolean; deliveryMethod: string; deliveryAddress: string | null; contactName: string; contactPhone: string; customerEmail: string | null; status: typeof buyForMeStatuses[number]; adminNote: string | null; createdAt: string; updatedAt: string };
function Row({ item, refresh }: { item: Item; refresh: () => void }) {
  const { authedFetch } = useAuth();
  const [status, setStatus] = useState(item.status); const [note, setNote] = useState(item.adminNote ?? '');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); setError(''); try { await authedFetch(`/api/admin/buy-for-me/${item.id}`, { method: 'PATCH', body: { status, adminNote: note } }); refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  return <tr><td><a href={item.itemUrl} target="_blank" rel="noopener noreferrer">{item.itemName} ↗</a><div>{item.quantity} × {item.currency} {item.itemValue.toFixed(2)}</div><div>Retailer shipping: {item.retailerShipping == null ? 'Unknown' : `${item.currency} ${item.retailerShipping.toFixed(2)}`}</div><div>{item.category}</div><div style={{ whiteSpace: 'pre-wrap' }}>{item.instructions}</div><div>Insurance: {item.insurance ? 'Requested' : 'No'}</div></td><td>{item.contactName}<br />{item.contactPhone}<br />{item.customerEmail}<br />{item.deliveryMethod}: {item.deliveryAddress}<br />From {item.shippingFrom} · {item.shippingMode}<br />{new Date(item.createdAt).toLocaleString()}</td><td><select className="admin-select" value={status} onChange={e => setStatus(e.target.value as Item['status'])} aria-label="Request status">{buyForMeStatuses.map(s => <option key={s}>{s}</option>)}</select><textarea className="admin-input" aria-label="Note for customer" placeholder="Note for customer" maxLength={500} value={note} onChange={e => setNote(e.target.value)} /><button className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy || (status === item.status && note === (item.adminNote ?? ''))} onClick={() => void save()}>Save</button>{error && <div role="alert">{error}</div>}</td></tr>;
}
export default function Page() {
  const { authedFetch } = useAuth(); const [items, setItems] = useState<Item[] | null>(null); const [error, setError] = useState('');
  const load = useCallback(async () => { try { setItems((await authedFetch<{ requests: Item[] }>('/api/admin/buy-for-me')).requests); setError(''); } catch (e) { setError(errorMessage(e)); } }, [authedFetch]);
  useEffect(() => { void load(); }, [load]);
  return <div className="admin-page"><div className="admin-page-head"><div><h1>Buy for me</h1><p>Review requests and contact customers to agree on the price and delivery.</p></div></div>{error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}{items === null ? <p>Loading…</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Item</th><th>Customer and delivery</th><th>Review</th></tr></thead><tbody>{items.map(item => <Row key={`${item.id}-${item.updatedAt}`} item={item} refresh={() => void load()} />)}{items.length === 0 && <tr><td colSpan={3} className="admin-empty">No requests yet</td></tr>}</tbody></table></div>}</div>;
}
