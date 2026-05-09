import { errorResponse, jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return errorResponse('Order not found.', 404);

  return jsonResponse({
    order: {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        imagePath: item.product.imagePath,
      })),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = getPrisma();
  const body = await request.json();
  const { status } = body;

  const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status)) {
    return errorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return errorResponse('Order not found.', 404);

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return jsonResponse({ message: 'Order status updated.', status: order.status });
}

export function OPTIONS() {
  return optionsResponse();
}
