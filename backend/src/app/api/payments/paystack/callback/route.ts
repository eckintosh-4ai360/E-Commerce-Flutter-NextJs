import { after, NextResponse } from 'next/server';

import { sendOrderConfirmationEmail } from '@/lib/email';
import { getPublicBaseUrl } from '@/lib/http';
import { settlePaystackPayment } from '@/lib/paystack';
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
    const settlement = await settlePaystackPayment(reference);
    if (!settlement) {
      return NextResponse.redirect(new URL('/checkout?payment=error', baseUrl), 303);
    }
    if (settlement.newlyPaid) {
      after(() => sendOrderConfirmationEmail(settlement.order));
    }

    const code = settlement.order.trackingCode ?? trackingCodeFor(settlement.order.id);
    const target = new URL(`/account/orders/${code}`, baseUrl);
    target.searchParams.set('payment', settlement.outcome);
    if (settlement.outcome === 'success') {
      target.searchParams.set('placed', '1');
    }
    return NextResponse.redirect(target, 303);
  } catch (error) {
    console.error('[paystack] Callback verification failed', error);
    return NextResponse.redirect(new URL('/checkout?payment=error', baseUrl), 303);
  }
}
