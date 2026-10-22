import type { Prisma } from '@prisma/client';

import { requireAdmin } from '@/lib/auth';
import { jsonResponse, privateNoStoreHeaders, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { trackingCodeFor } from '@/lib/serializers';

export const GET = route(async (request) => {
  await requireAdmin(request);
  const prisma = getPrisma();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueWhere: Prisma.OrderWhereInput = {
    status: { not: 'CANCELLED' },
    OR: [
      { paymentMethod: { not: 'PAYSTACK' } },
      { paymentStatus: 'PAID' },
    ],
  };

  const [
    totalProducts,
    totalOrders,
    ordersThisMonth,
    revenue,
    revenueThisMonth,
    outOfStockCount,
    openReturns,
    statusCounts,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { isArchived: false } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    // Cancelled orders and unconfirmed Paystack checkouts never produced revenue.
    prisma.order.aggregate({
      _sum: { total: true },
      where: revenueWhere,
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { AND: [revenueWhere, { createdAt: { gte: monthStart } }] },
    }),
    prisma.product.count({ where: { inStock: false, isArchived: false } }),
    prisma.returnRequest.count({ where: { status: { in: ['REQUESTED', 'APPROVED'] } } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        trackingCode: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const pendingOrders =
    statusCounts.find((entry) => entry.status === 'PENDING')?._count._all ?? 0;

  return jsonResponse(
    {
      stats: {
        totalProducts,
        totalOrders,
        ordersThisMonth,
        totalRevenue: revenue._sum.total ?? 0,
        revenueThisMonth: revenueThisMonth._sum.total ?? 0,
        pendingOrders,
        outOfStockCount,
        openReturns,
      },
      statusBreakdown: statusCounts.map((entry) => ({
        status: entry.status,
        count: entry._count._all,
      })),
      recentOrders: recentOrders.map(({ _count, ...order }) => ({
        ...order,
        trackingCode: order.trackingCode ?? trackingCodeFor(order.id),
        itemCount: _count.items,
        createdAt: order.createdAt.toISOString(),
      })),
    },
    { headers: privateNoStoreHeaders },
  );
});
