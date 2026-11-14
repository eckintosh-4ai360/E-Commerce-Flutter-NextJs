'use client';

import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { RequireAuth } from '../RequireAuth';

export function PaymentView() {
  return (
    <div className="container narrow" style={{ maxWidth: 640 }}>
      <Link href="/account" className="back-link">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="page-title">Payment Methods</h1>
      <p className="page-subtitle">Pay securely online when you check out.</p>
      <RequireAuth title="Sign in to view payment methods">
        <div className="card">
          <h2>Paystack online payment</h2>
          <p>Pay by card or Mobile Money through Paystack at checkout.</p>
        </div>
        <div className="alert alert--info" style={{ marginTop: 16 }}>
          <Info size={18} />
          <span>We don&apos;t store your card details or Mobile Money PIN.</span>
        </div>
      </RequireAuth>
    </div>
  );
}
