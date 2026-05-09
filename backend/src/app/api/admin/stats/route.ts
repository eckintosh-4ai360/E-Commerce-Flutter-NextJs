import { jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  const prisma = getPrisma();

  const [
    totalProducts,
    totalOrders,
    ordersThisMonth,
    revenueData,
    pendingOrders,
    recentOrders,
    outOfStockCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: { include: { product: true } } },
    }),
    prisma.product.count({ where: { inStock: false } }),
  ]);

  const totalRevenue = revenueData._sum.total ?? 0;

  // Orders by status
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return jsonResponse({
    stats: {
      totalProducts,
      totalOrders,
      ordersThisMonth,
      totalRevenue,
      pendingOrders,
      outOfStockCount,
    },
    statusBreakdown: statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      total: o.total,
      status: o.status,
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}

export function OPTIONS() {
  return optionsResponse();
}
