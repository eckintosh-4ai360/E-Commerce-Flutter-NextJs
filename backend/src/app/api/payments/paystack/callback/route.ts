import { NextResponse } from 'next/server';

import { getPublicBaseUrl } from '@/lib/http';
import { getPaystackOrderByReference } from '@/lib/paystack';
import { trackingCodeFor } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = getPublicBaseUrl() ?? requestUrl.origin;
  const reference =
    requestUrl.searchParams.get('reference') ?? requestUrl.searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(new URL('/checkout?payment=error', baseUrl), 303);
  }

  try {
    const order = await getPaystackOrderByReference(reference);
    if (!order) {
      return NextResponse.redirect(new URL('/checkout?payment=error', baseUrl), 303);
    }

    const code = order.trackingCode ?? trackingCodeFor(order.id);
    const target = new URL(`/account/orders/${code}`, baseUrl);
    const outcome =
      order.status === 'CANCELLED'
        ? 'cancelled'
        : order.paymentStatus === 'PAID'
          ? 'success'
          : 'pending';
    target.searchParams.set('payment', outcome);
    if (outcome === 'success') {
      target.searchParams.set('placed', '1');
    }
    return NextResponse.redirect(target, 303);
  } catch (error) {
    console.error('[paystack] Callback lookup failed', error);
    return NextResponse.redirect(new URL('/checkout?payment=error', baseUrl), 303);
  }
}
