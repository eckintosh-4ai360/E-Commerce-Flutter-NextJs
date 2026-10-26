import type { OrderStatus, Prisma } from '@prisma/client';

import { requireAdmin } from '@/lib/auth';
import { jsonResponse, privateNoStoreHeaders, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { trackingCodeFor } from '@/lib/serializers';
import { orderStatuses } from '@/lib/store-config';

function readPage(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, max) : fallback;
}

export const runtime = 'nodejs';

export const GET = route(async (request) => {
  await requireAdmin(request);
  const params = new URL(request.url).searchParams;
  const page = readPage(params.get('page'), 1, 10_000);
  const pageSize = readPage(params.get('pageSize'), 20, 100);
  const status = params.get('status');
  const query = params.get('q')?.trim().slice(0, 100);

  const where: Prisma.OrderWhereInput = {};
  if (status && (orderStatuses as readonly string[]).includes(status)) {
    where.status = status as OrderStatus;
  }
  if (query) {
    const contains = { contains: query, mode: 'insensitive' as const };
    where.OR = [
      { customerName: contains },
      { customerPhone: contains },
      { customerEmail: contains },
      { trackingCode: { startsWith: query.replace(/^#/, '').toUpperCase() } },
      { id: { contains: query.toLowerCase() } },
    ];
  }

  const prisma = getPrisma();
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        trackingCode: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  return jsonResponse(
    {
      orders: orders.map(({ _count, ...order }) => ({
        ...order,
        trackingCode: order.trackingCode ?? trackingCodeFor(order.id),
        createdAt: order.createdAt.toISOString(),
        itemCount: _count.items,
      })),
      total,
      page,
      pageSize,
    },
    { headers: privateNoStoreHeaders },
  );
});
