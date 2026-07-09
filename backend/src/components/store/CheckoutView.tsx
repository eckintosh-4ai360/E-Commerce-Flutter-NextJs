'use client';

import { AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ApiError, apiFetch, errorMessage } from '@/lib/client/api';
import { newRequestId } from '@/lib/client/format';
import { formatMoney } from '@/lib/money';
import { ghanaRegions, paymentMethods } from '@/lib/store-config';
import type {
  AddressView,
  CustomerProfile,
  OrderView,
  PaymentMethod,
  StoreProduct,
} from '@/lib/types';

import { Avatar } from './Avatar';
import { CartSummary, useFreshCart } from './CartView';
import { ProductImage } from './ProductImage';
import { GoogleSignInCard } from './RequireAuth';
import { EmptyState, Spinner } from './ui';

type FormState = {
  name: string;
  phone: string;
  addressId: string;
  street: string;
  city: string;
  region: string;
  saveAddress: boolean;
  notes: string;
  paymentMethod: PaymentMethod;
};

const initialForm: FormState = {
  name: '',
  phone: '',
  addressId: 'new',
  street: '',
  city: '',
  region: 'Greater Accra',
  saveAddress: true,
  notes: '',
  paymentMethod: 'CASH_ON_DELIVERY',
};

function validate(form: FormState, usingSaved: boolean) {
  if (form.name.trim().length < 2) return 'Enter your full name.';
  if (form.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number.';
  if (!usingSaved) {
    if (form.street.trim().length < 3) return 'Enter your street address or a landmark.';
    if (form.city.trim().length < 2) return 'Enter your city or town.';
  }
  return null;
}

export function CheckoutView() {
  const { cart } = useFreshCart();
  const { user, status, signOut, busy, authedFetch } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [addresses, setAddresses] = useState<AddressView[]>([]);
  const [accountLoaded, setAccountLoaded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefilledFor = useRef<string | null>(null);

  // A fresh key whenever the cart changes: retries of the same cart reuse it,
  // so a double click or network retry cannot create two orders.
  const cartSignature = cart.lines.map((line) => `${line.key}x${line.quantity}`).join(',');
  const requestId = useMemo(() => newRequestId(), [cartSignature]);

  useEffect(() => {
    if (!user || prefilledFor.current === user.uid) return;
    prefilledFor.current = user.uid;

    Promise.all([
      authedFetch<{ profile: CustomerProfile }>('/api/me'),
      authedFetch<{ addresses: AddressView[] }>('/api/me/addresses'),
    ])
      .then(([{ profile }, { addresses: saved }]) => {
        setAddresses(saved);
        const preferred = saved.find((address) => address.isDefault) ?? saved[0];
        setForm((current) => ({
          ...current,
          name: current.name || profile.name || user.displayName || '',
          phone: current.phone || profile.phone || '',
          addressId: preferred ? preferred.id : 'new',
          paymentMethod: profile.preferredPaymentMethod,
        }));
      })
      .catch(() => {
        setForm((current) => ({ ...current, name: current.name || user.displayName || '' }));
      })
      .finally(() => setAccountLoaded(user.uid));
  }, [user, authedFetch]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const selectedAddress = addresses.find((address) => address.id === form.addressId) ?? null;

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const problem = validate(form, selectedAddress !== null);
    if (problem) {
      setError(problem);
      return;
    }

    const deliveryAddress = selectedAddress
      ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.region}`
      : `${form.street.trim()}, ${form.city.trim()}, ${form.region}`;

    setSubmitting(true);
    try {
      if (!selectedAddress && form.saveAddress) {
        authedFetch('/api/me/addresses', {
          method: 'POST',
          body: {
            label: addresses.length === 0 ? 'Home' : `Address ${addresses.length + 1}`,
            recipientName: form.name.trim(),
            phone: form.phone.trim(),
            street: form.street.trim(),
            city: form.city.trim(),
            region: form.region,
          },
        }).catch(() => toast('Your order is fine, but we could not save the address.', 'error'));
      }

      const { order } = await authedFetch<{ order: OrderView }>('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestId },
        body: {
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          deliveryAddress,
          notes: form.notes.trim() || null,
          paymentMethod: form.paymentMethod,
          expectedTotal: cart.total,
          items: cart.lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            selectedColor: line.selectedColor,
            selectedSize: line.selectedSize,
          })),
        },
      });

      setPlaced(true);
      cart.clear();
      router.replace(`/account/orders/${order.trackingCode}?placed=1`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        // Prices or availability changed: refresh the cart so totals are current.
        apiFetch<{ products: StoreProduct[] }>('/api/catalog')
          .then(({ products }) => cart.syncProducts(products))
          .catch(() => undefined);
      }
      setError(errorMessage(caught, 'We could not place your order. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.hydrated || status === 'loading' || placed) {
    return <Spinner label={placed ? 'Placing your order' : 'Loading checkout'} />;
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={44} />}
        title="Your cart is empty"
        action={
          <Link href="/shop" className="btn btn-primary">
            Shop now
          </Link>
        }
      >
        Add something you love, then come back to check out.
      </EmptyState>
    );
  }

  const summary = (
    <CartSummary>
      <div className="checkout-items" style={{ marginTop: 18 }}>
        {cart.lines.map((line) => (
          <div key={line.key} className="checkout-item">
            <div className="checkout-item__media">
              <ProductImage src={line.product.images[0]} alt="" sizes="52px" />
            </div>
            <div>
              <strong>{line.product.name}</strong>
              <div className="muted">
                × {line.quantity}
                {line.selectedColor ? ` · ${line.selectedColor}` : ''}
                {line.selectedSize ? ` · ${line.selectedSize}` : ''}
              </div>
            </div>
            <span>{formatMoney(line.product.price * line.quantity)}</span>
          </div>
        ))}
      </div>
      {user ? (
        <button
          type="submit"
          form="checkout-form"
          className="btn btn-primary btn-lg btn-block"
          disabled={submitting || accountLoaded !== user.uid}
        >
          {submitting ? 'Placing order…' : `Place order · ${formatMoney(cart.total)}`}
        </button>
      ) : null}
      <p className="small muted" style={{ margin: '12px 0 0' }}>
        You pay on delivery. We&apos;ll email your confirmation and every status update.
      </p>
    </CartSummary>
  );

  if (!user) {
    return (
      <>
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">
          Sign in with Google before placing your order so we can send tracking updates to your
          email.
        </p>
        <div className="cart-layout">
          <GoogleSignInCard description="Checkout uses your Google account email for order confirmations and tracking updates." />
          {summary}
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <p className="page-subtitle">Confirm your details and we&apos;ll get your order on its way.</p>
      <div className="cart-layout">
        <form id="checkout-form" onSubmit={placeOrder} noValidate>
          <div className="user-card">
            <Avatar user={user} />
            <div className="user-card__text">
              <strong>{user.displayName ?? user.email}</strong>
              {user.email}
              <div className="muted" style={{ fontSize: 11 }}>
                We will send order status updates to this Google account.
              </div>
            </div>
            <button type="button" className="text-btn" onClick={() => void signOut()} disabled={busy}>
              Switch
            </button>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>Contact</h2>
            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  className="input"
                  autoComplete="name"
                  value={form.name}
                  maxLength={100}
                  onChange={(event) => update('name', event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  placeholder="059 859 9687"
                  value={form.phone}
                  maxLength={20}
                  onChange={(event) => update('phone', event.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Delivery address</h2>
            <div className="radio-list">
              {addresses.map((address) => (
                <label key={address.id} className="radio-card address-option">
                  <input
                    type="radio"
                    name="address"
                    checked={form.addressId === address.id}
                    onChange={() => update('addressId', address.id)}
                  />
                  <span>
                    <strong>
                      {address.label}
                      {address.isDefault ? ' · Default' : ''}
                    </strong>
                    <span>
                      {address.recipientName}, {address.street}, {address.city}, {address.region} ·{' '}
                      {address.phone}
                    </span>
                  </span>
                </label>
              ))}
              {addresses.length > 0 ? (
                <label className="radio-card">
                  <input
                    type="radio"
                    name="address"
                    checked={form.addressId === 'new'}
                    onChange={() => update('addressId', 'new')}
                  />
                  <span>
                    <strong>Use a new address</strong>
                  </span>
                </label>
              ) : null}
            </div>

            {form.addressId === 'new' ? (
              <div style={{ marginTop: addresses.length > 0 ? 16 : 0 }}>
                <div className="field">
                  <label htmlFor="street">Street address or landmark</label>
                  <input
                    id="street"
                    className="input"
                    autoComplete="street-address"
                    value={form.street}
                    maxLength={200}
                    onChange={(event) => update('street', event.target.value)}
                  />
                </div>
                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label htmlFor="city">City or town</label>
                    <input
                      id="city"
                      className="input"
                      autoComplete="address-level2"
                      value={form.city}
                      maxLength={80}
                      onChange={(event) => update('city', event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="region">Region</label>
                    <select
                      id="region"
                      className="select"
                      value={form.region}
                      onChange={(event) => update('region', event.target.value)}
                    >
                      {ghanaRegions.map((region) => (
                        <option key={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={form.saveAddress}
                    onChange={(event) => update('saveAddress', event.target.checked)}
                  />
                  Save this address to my account
                </label>
              </div>
            ) : null}
          </div>

          <div className="card">
            <h2>Payment</h2>
            <div className="radio-list">
              {paymentMethods.map((method) => (
                <label key={method.value} className="radio-card">
                  <input
                    type="radio"
                    name="payment"
                    checked={form.paymentMethod === method.value}
                    onChange={() => update('paymentMethod', method.value)}
                  />
                  <span>
                    <strong>{method.label}</strong>
                    <span>{method.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="notes">Order notes (optional)</label>
              <textarea
                id="notes"
                className="textarea"
                placeholder="Delivery instructions, preferred time…"
                value={form.notes}
                maxLength={500}
                onChange={(event) => update('notes', event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div className="alert alert--error" role="alert" style={{ marginTop: 16 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : null}
        </form>
        {summary}
      </div>
    </>
  );
}
