import { requireAdmin } from '@/lib/auth';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import { HttpError } from '@/lib/errors';
import { jsonResponse, privateNoStoreHeaders, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { orderInclude } from '@/lib/serializers';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const order = await getPrisma().order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new HttpError(404, 'Order not found.');

  const emailNotification = await sendOrderStatusUpdateEmail({ order });
  return jsonResponse({ emailNotification }, { headers: privateNoStoreHeaders });
});
