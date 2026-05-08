import { errorResponse, jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { serialiseProduct } from '@/lib/serializers';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const productId = Number(id);

  if (Number.isNaN(productId)) {
    return errorResponse('Product id must be a number.', 400);
  }

  const prisma = getPrisma();
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return errorResponse('Product not found.', 404);
  }

  return jsonResponse({
    product: serialiseProduct(product, new URL(request.url).origin),
  });
}

export function OPTIONS() {
  return optionsResponse();
}
