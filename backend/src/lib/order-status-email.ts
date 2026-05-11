import type { Order, OrderItem, Product } from '@prisma/client';
import { Resend } from 'resend';

type OrderWithItems = Order & {
  items: Array<
    OrderItem & {
      product: Product;
    }
  >;
};

export type EmailNotificationResult = {
  status: 'sent' | 'skipped' | 'failed';
  message: string;
  emailId?: string;
};

export async function sendOrderStatusUpdateEmail({
  order,
  previousStatus,
}: {
  order: OrderWithItems;
  previousStatus: string;
}): Promise<EmailNotificationResult> {
  const recipientEmail = order.customerEmail?.trim();
  if (!recipientEmail) {
    return {
      status: 'skipped',
      message: 'Customer does not have an email address on file.',
    };
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

  const resend = new Resend(apiKey);
  const shortOrderId = order.id.slice(-10).toUpperCase();
  const statusLabel = toTitleCase(order.status);
  const previousStatusLabel = toTitleCase(previousStatus);
  const trimmedCustomerName = order.customerName.trim();
  const customerName = trimmedCustomerName.length === 0
    ? 'there'
    : trimmedCustomerName;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const subject = `Your Eckintosh order is now ${statusLabel}`;
  const text = [
    `Hi ${customerName},`,
    '',
    `Your order #${shortOrderId} has been updated from ${previousStatusLabel} to ${statusLabel}.`,
    `Items: ${itemCount}`,
    `Total: GHS ${order.total.toFixed(2)}`,
    '',
    `Tracking ID: ${order.id}`,
    'You can keep this ID handy when checking order progress in the app.',
    '',
    'Thank you for shopping with Eckintosh Mall.',
  ].join('\n');

  const html = `
    <div style="background:#f7f4ed;padding:32px 16px;font-family:Arial,sans-serif;color:#161616;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ece7dc;">
        <div style="padding:24px 28px;background:#161616;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:0.72;">Eckintosh Mall</div>
          <h1 style="margin:12px 0 0;font-size:24px;line-height:1.2;">Your order is now ${escapeHtml(statusLabel)}</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin-top:0;font-size:15px;line-height:1.7;">Hi ${escapeHtml(customerName)},</p>
          <p style="font-size:15px;line-height:1.7;">
            We’ve updated your order
            <strong>#${escapeHtml(shortOrderId)}</strong>
            from <strong>${escapeHtml(previousStatusLabel)}</strong>
            to <strong>${escapeHtml(statusLabel)}</strong>.
          </p>
          <div style="margin:24px 0;padding:18px;border-radius:14px;background:#f8f6f0;">
            <div style="display:flex;justify-content:space-between;font-size:14px;line-height:1.8;">
              <span>Tracking ID</span>
              <strong>${escapeHtml(order.id)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;line-height:1.8;">
              <span>Items</span>
              <strong>${itemCount}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;line-height:1.8;">
              <span>Total</span>
              <strong>GHS ${order.total.toFixed(2)}</strong>
            </div>
          </div>
          <p style="font-size:14px;line-height:1.7;margin-bottom:0;">
            Keep your tracking ID handy for in-app order tracking. If you need help, just reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [recipientEmail],
      subject,
      html,
      text,
    });

    if (error) {
      return {
        status: 'failed',
        message: `Resend rejected the email: ${error.message}`,
      };
    }

    return {
      status: 'sent',
      message: `Tracking email sent to ${recipientEmail}.`,
      emailId: data?.id,
    };
  } catch (error) {
    return {
      status: 'failed',
      message:
        error instanceof Error
          ? error.message
          : 'Email delivery failed for an unknown reason.',
    };
  }
}

function toTitleCase(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
