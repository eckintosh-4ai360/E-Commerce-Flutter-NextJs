import type { Order, OrderItem, ReturnRequest } from '@prisma/client';
import { Resend } from 'resend';

import { getPublicBaseUrl } from './http';
import { formatMoney } from './money';
import { trackingCodeFor } from './serializers';
import { paymentMethodLabel, storeConfig } from './store-config';

export type EmailResult = {
  status: 'sent' | 'skipped' | 'failed';
  message: string;
  emailId?: string;
};

type EmailOrder = Order & { items: OrderItem[] };

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function greetingName(name: string) {
  return name.trim().split(/\s+/)[0] || 'there';
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | null | undefined;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const recipient = to?.trim();
  if (!recipient) {
    return { status: 'skipped', message: 'Customer does not have an email address on file.' };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return {
      status: 'skipped',
      message:
        'Email delivery is not configured yet. Set RESEND_API_KEY and ORDER_EMAIL_FROM in backend/.env.',
    };
  }

  try {
    const { data, error } = await new Resend(apiKey).emails.send({
      from,
      to: [recipient],
      subject,
      html,
      text,
    });
    if (error) {
      return { status: 'failed', message: `Resend rejected the email: ${error.message}` };
    }
    return { status: 'sent', message: `Email sent to ${recipient}.`, emailId: data?.id };
  } catch (error) {
    console.error('[email] Delivery failed', error);
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Email delivery failed.',
    };
  }
}

function layout({
  heading,
  paragraphs,
  rows,
  cta,
}: {
  heading: string;
  paragraphs: string[];
  rows: Array<[string, string]>;
  cta?: { label: string; href: string };
}) {
  const rowHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 0;color:#45556c;font-size:14px;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;text-align:right;font-weight:700;font-size:14px;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  return `
  <div style="background:#f7f9fc;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#001a3a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dce3ec;">
      <div style="padding:24px 28px;background:#001a3a;color:#ffffff;border-top:4px solid #ffb000;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffb000;">${escapeHtml(storeConfig.name)}</div>
        <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;">${escapeHtml(heading)}</h1>
      </div>
      <div style="padding:24px 28px;">
        ${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${p}</p>`).join('')}
        <table role="presentation" style="width:100%;margin:18px 0;padding:14px 18px;border-radius:12px;background:#eef3f8;border-collapse:separate;">${rowHtml}</table>
        ${
          cta
            ? `<p style="margin:22px 0 8px;"><a href="${escapeHtml(cta.href)}" style="display:inline-block;background:#001a3a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:14px;">${escapeHtml(cta.label)}</a></p>`
            : ''
        }
        <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#45556c;">
          Questions? Reply to this email or call ${escapeHtml(storeConfig.supportPhone)}.
        </p>
      </div>
    </div>
  </div>`;
}

function trackingLink(order: Order) {
  const baseUrl = getPublicBaseUrl();
  const code = order.trackingCode ?? trackingCodeFor(order.id);
  return baseUrl ? `${baseUrl}/track?code=${encodeURIComponent(code)}` : null;
}

export async function sendOrderConfirmationEmail(order: EmailOrder) {
  const code = order.trackingCode ?? trackingCodeFor(order.id);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const link = trackingLink(order);
  const rows: Array<[string, string]> = [
    ['Order', `#${code}`],
    ['Items', String(itemCount)],
    ['Shipping', order.shippingFee === 0 ? 'Free' : formatMoney(order.shippingFee)],
    ['Total', formatMoney(order.total)],
    ['Payment', paymentMethodLabel(order.paymentMethod)],
  ];

  const text = [
    `Hi ${greetingName(order.customerName)},`,
    '',
    `Thanks for your order! We have received order #${code} and will start preparing it shortly.`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    order.deliveryAddress ? `Delivering to: ${order.deliveryAddress}` : '',
    link ? `Track your order: ${link}` : `Track your order in the app with code ${code}.`,
    '',
    `Thank you for shopping with ${storeConfig.name}.`,
  ].join('\n');

  return sendEmail({
    to: order.customerEmail,
    subject: `Order #${code} confirmed`,
    text,
    html: layout({
      heading: 'Thanks for your order!',
      paragraphs: [
        `Hi ${escapeHtml(greetingName(order.customerName))},`,
        `We have received order <strong>#${escapeHtml(code)}</strong> and will start preparing it shortly. You will get an email each time its status changes.`,
        ...(order.deliveryAddress
          ? [`Delivering to: ${escapeHtml(order.deliveryAddress)}`]
          : []),
      ],
      rows,
      cta: link ? { label: 'Track your order', href: link } : undefined,
    }),
  });
}

export async function sendOrderStatusUpdateEmail({
  order,
  previousStatus,
  note,
}: {
  order: EmailOrder;
  previousStatus: string;
  note?: string | null;
}) {
  const code = order.trackingCode ?? trackingCodeFor(order.id);
  const status = titleCase(order.status);
  const link = trackingLink(order);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const rows: Array<[string, string]> = [
    ['Order', `#${code}`],
    ['Status', status],
    ['Items', String(itemCount)],
    ['Total', formatMoney(order.total)],
  ];

  const text = [
    `Hi ${greetingName(order.customerName)},`,
    '',
    `Your order #${code} has been updated from ${titleCase(previousStatus)} to ${status}.`,
    note ? `Note from our team: ${note}` : '',
    link ? `Track your order: ${link}` : `Track your order in the app with code ${code}.`,
    '',
    `Thank you for shopping with ${storeConfig.name}.`,
  ].join('\n');

  return sendEmail({
    to: order.customerEmail,
    subject: `Your ${storeConfig.shortName} order is now ${status}`,
    text,
    html: layout({
      heading: `Your order is now ${status}`,
      paragraphs: [
        `Hi ${escapeHtml(greetingName(order.customerName))},`,
        `We've updated order <strong>#${escapeHtml(code)}</strong> from <strong>${escapeHtml(titleCase(previousStatus))}</strong> to <strong>${escapeHtml(status)}</strong>.`,
        ...(note ? [`Note from our team: ${escapeHtml(note)}`] : []),
      ],
      rows,
      cta: link ? { label: 'Track your order', href: link } : undefined,
    }),
  });
}

export async function sendReturnUpdateEmail({
  request,
  order,
}: {
  request: ReturnRequest;
  order: Order;
}) {
  const code = order.trackingCode ?? trackingCodeFor(order.id);
  const status = titleCase(request.status);
  const baseUrl = getPublicBaseUrl();
  const rows: Array<[string, string]> = [
    ['Order', `#${code}`],
    ['Reason', request.reason],
    ['Return status', status],
  ];

  return sendEmail({
    to: order.customerEmail,
    subject: `Return request for order #${code}: ${status}`,
    text: [
      `Hi ${greetingName(order.customerName)},`,
      '',
      `Your return request for order #${code} is now ${status}.`,
      request.adminNote ? `Note from our team: ${request.adminNote}` : '',
    ].join('\n'),
    html: layout({
      heading: `Return request ${status.toLowerCase()}`,
      paragraphs: [
        `Hi ${escapeHtml(greetingName(order.customerName))},`,
        `Your return request for order <strong>#${escapeHtml(code)}</strong> is now <strong>${escapeHtml(status)}</strong>.`,
        ...(request.adminNote ? [`Note from our team: ${escapeHtml(request.adminNote)}`] : []),
      ],
      rows,
      cta: baseUrl ? { label: 'View your returns', href: `${baseUrl}/account/returns` } : undefined,
    }),
  });
}
