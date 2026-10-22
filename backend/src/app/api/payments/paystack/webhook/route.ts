import { after } from 'next/server';

import { sendOrderConfirmationEmail } from '@/lib/email';
import { settlePaystackPayment, verifyPaystackSignature } from '@/lib/paystack';

export const runtime = 'nodejs';

type PaystackWebhook = {
  event?: string;
  data?: { reference?: string };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return Response.json({ error: 'Webhook body is too large.' }, { status: 413 });
  }

  try {
    if (!verifyPaystackSignature(rawBody, request.headers.get('x-paystack-signature'))) {
      return Response.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as PaystackWebhook;
    if (event.event !== 'charge.success' || !event.data?.reference) {
      return Response.json({ received: true });
    }

    const settlement = await settlePaystackPayment(event.data.reference);
    if (settlement?.newlyPaid) {
      after(() => sendOrderConfirmationEmail(settlement.order));
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('[paystack] Webhook processing failed', error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
