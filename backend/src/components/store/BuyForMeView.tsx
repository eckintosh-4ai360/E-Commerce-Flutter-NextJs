'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { errorMessage } from '@/lib/client/api';
import { RequireAuth } from './RequireAuth';

type Item = { id: string; itemName: string; status: string; adminNote: string | null; createdAt: string };
const field: React.CSSProperties = { display: 'grid', gap: 6 };
function RequestForm() {
  const { authedFetch } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [delivery, setDelivery] = useState('DELIVERY');
  const load = useCallback(async () => {
    try { setItems((await authedFetch<{ requests: Item[] }>('/api/me/buy-for-me')).requests); }
    catch (e) { setError(errorMessage(e)); }
  }, [authedFetch]);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const val = (key: string) => String(data.get(key) ?? '').trim();
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await authedFetch<{ message: string }>('/api/me/buy-for-me', { method: 'POST', body: {
        itemName: val('itemName'), itemUrl: val('itemUrl'), itemValue: Number(val('itemValue')), currency: val('currency'), quantity: Number(val('quantity')),
        retailerShipping: val('retailerShipping') ? Number(val('retailerShipping')) : null, shippingFrom: val('shippingFrom'), shippingMode: val('shippingMode'),
        category: val('category'), instructions: val('instructions'), insurance: data.has('insurance'), deliveryMethod: delivery,
        deliveryAddress: val('deliveryAddress'), contactName: val('contactName'), contactPhone: val('contactPhone'),
      } });
      form.reset(); setDelivery('DELIVERY'); setMessage(result.message); await load();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <>
    <form className="card" onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <h2>Item details</h2>
      <label style={field}>Item name<input className="input" name="itemName" required minLength={2} maxLength={120} /></label>
      <label style={field}>Product link<input className="input" name="itemUrl" type="url" required maxLength={2048} placeholder="https://..." /></label>
      <label style={field}>Item value (per item)<input className="input" name="itemValue" type="number" min="0" max="1000000" step="0.01" required /></label>
      <label style={field}>Currency<select className="select" name="currency" defaultValue="USD"><option>USD</option><option>GBP</option><option>EUR</option><option>GHS</option></select></label>
      <label style={field}>Quantity<input className="input" name="quantity" type="number" min="1" max="100" defaultValue="1" required /></label>
      <label style={field}>Retailer shipping cost, if known<input className="input" name="retailerShipping" type="number" min="0" max="1000000" step="0.01" /></label>
      <label style={field}>Shipping from country<input className="input" name="shippingFrom" required minLength={2} maxLength={80} placeholder="e.g. USA" /></label>
      <label style={field}>Shipping mode<select className="select" name="shippingMode"><option value="AIR">By air</option><option value="SEA">By sea</option></select></label>
      <label style={field}>Item category (optional)<input className="input" name="category" maxLength={80} /></label>
      <label style={field}>Description or instructions (optional)<textarea className="textarea" name="instructions" maxLength={1000} rows={3} /></label>
      <label><input type="checkbox" name="insurance" /> Request insurance</label>
      <h2>Delivery details</h2>
      <label style={field}>Delivery method<select className="select" value={delivery} onChange={e => setDelivery(e.target.value)}><option value="DELIVERY">Delivery</option><option value="PICKUP">Pickup</option></select></label>
      {delivery === 'DELIVERY' && <label style={field}>Delivery address<textarea className="textarea" name="deliveryAddress" required minLength={5} maxLength={300} rows={2} /></label>}
      <label style={field}>Contact name<input className="input" name="contactName" required minLength={2} maxLength={100} /></label>
      <label style={field}>Phone number<input className="input" name="contactPhone" type="tel" required maxLength={20} /></label>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {message && <div role="status">{message}</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
    </form>
    <section style={{ marginTop: 32 }}><h2>Your requests</h2>{items.length === 0 ? <p>No requests yet.</p> : items.map(item => <div className="card" key={item.id} style={{ marginBottom: 12 }}><strong>{item.itemName}</strong><p>{item.status.replaceAll('_', ' ')} · {new Date(item.createdAt).toLocaleDateString()}</p>{item.adminNote && <p>{item.adminNote}</p>}</div>)}</section>
  </>;
}
export function BuyForMeView() { return <div className="container narrow" style={{ paddingTop: 32, paddingBottom: 60 }}><h1 className="page-title">Buy for me</h1><p className="page-subtitle">Found an item elsewhere? Send us the details and we’ll contact you after reviewing your request. No payment is taken now.</p><RequireAuth title="Sign in to request an item"><RequestForm /></RequireAuth></div>; }
