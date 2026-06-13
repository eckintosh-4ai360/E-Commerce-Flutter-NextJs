import { requireAdmin } from '@/lib/auth';
import { sendReturnUpdateEmail } from '@/lib/email';
import { HttpError } from '@/lib/errors';
import { jsonResponse, privateNoStoreHeaders, readJson, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { serialiseReturnRequest } from '@/lib/serializers';
import { updateReturnSchema } from '@/lib/validation';

type Context = { params: Promise<{ id: string }> };

export const PATCH = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const { status, adminNote } = await readJson(request, updateReturnSchema);

  const prisma = getPrisma();
  const existing = await prisma.returnRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Return request not found.');
  }

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: { status, adminNote },
    include: { order: true },
  });

  const emailNotification =
    existing.status === status
      ? { status: 'skipped', message: 'Status unchanged, so no email was sent.' }
      : await sendReturnUpdateEmail({ request: updated, order: updated.order });

  const { order: _order, ...returnRequest } = updated;
  return jsonResponse(
    {
      message: 'Return request updated.',
      returnRequest: serialiseReturnRequest(returnRequest),
      emailNotification,
    },
    { headers: privateNoStoreHeaders },
  );
});
