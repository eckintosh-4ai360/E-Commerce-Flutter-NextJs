import { requireAdmin } from '@/lib/auth';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import { HttpError } from '@/lib/errors';
import { jsonResponse, privateNoStoreHeaders, readJson, route } from '@/lib/http';
import { updateOrderStatus } from '@/lib/orders';
import { getPrisma } from '@/lib/prisma';
import { orderInclude, serialiseOrder } from '@/lib/serializers';
import { updateOrderStatusSchema } from '@/lib/validation';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) {
    throw new HttpError(404, 'Order not found.');
  }

  return jsonResponse(
    { order: { ...serialiseOrder(order, 'admin'), customerUid: order.customerUid } },
    { headers: privateNoStoreHeaders },
  );
});

export const PATCH = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const { status, note } = await readJson(request, updateOrderStatusSchema);

  const { order, previousStatus } = await updateOrderStatus(id, status, note);
  if (!order) {
    return jsonResponse({
      message: 'Order status was already set to that value.',
      status,
      emailNotification: {
        status: 'skipped',
        message: 'No email sent because the order status did not change.',
      },
    });
  }

  // Awaited so the admin sees whether the customer was notified.
  const emailNotification = await sendOrderStatusUpdateEmail({
    order,
    previousStatus,
    note,
  });

  return jsonResponse(
    { message: 'Order status updated.', status: order.status, emailNotification },
    { headers: privateNoStoreHeaders },
  );
});
