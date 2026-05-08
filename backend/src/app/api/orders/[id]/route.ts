import { errorResponse, jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { serialiseOrder } from '@/lib/serializers';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id },
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
    order: serialiseOrder(order, new URL(request.url).origin),
  });
}

export function OPTIONS() {
  return optionsResponse();
}
