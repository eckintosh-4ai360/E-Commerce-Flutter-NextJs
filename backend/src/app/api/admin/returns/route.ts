import type { Prisma, ReturnStatus } from '@prisma/client';

import { requireAdmin } from '@/lib/auth';
import { jsonResponse, privateNoStoreHeaders, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { serialiseReturnRequest, trackingCodeFor } from '@/lib/serializers';
import { returnStatuses } from '@/lib/store-config';

export const GET = route(async (request) => {
  await requireAdmin(request);
  const status = new URL(request.url).searchParams.get('status');

  const where: Prisma.ReturnRequestWhereInput = {};
  if (status && (returnStatuses as readonly string[]).includes(status)) {
    where.status = status as ReturnStatus;
  }

  const returns = await getPrisma().returnRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      order: {
        select: {
          id: true,
          trackingCode: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          total: true,
        },
      },
    },
  });

  return jsonResponse(
    {
      returns: returns.map(({ order, ...request }) => ({
        ...serialiseReturnRequest(request),
        order: {
          ...order,
          trackingCode: order.trackingCode ?? trackingCodeFor(order.id),
        },
      })),
    },
    { headers: privateNoStoreHeaders },
  );
});
