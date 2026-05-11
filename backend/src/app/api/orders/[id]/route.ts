import {
  errorResponse,
  getRequestOrigin,
  jsonResponse,
  optionsResponse,
} from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { serialiseOrder } from '@/lib/serializers';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const normalizedId = id.trim().replace(/^#/, '');
  const prisma = getPrisma();
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: normalizedId },
        {
          id: {
            endsWith: normalizedId.toLowerCase(),
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return errorResponse('Order not found.', 404);
  }

  return jsonResponse({
    order: serialiseOrder(order, getRequestOrigin(request)),
  });
}

export function OPTIONS() {
  return optionsResponse();
}
