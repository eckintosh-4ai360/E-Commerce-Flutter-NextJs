import { jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const prisma = getPrisma();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
    },
  });

  return jsonResponse({
    orders: orders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress,
      notes: o.notes,
      subtotal: o.subtotal,
      shippingFee: o.shippingFee,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      itemCount: o.items.length,
      items: o.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        imagePath: item.product.imagePath,
      })),
    })),
  });
}

export function OPTIONS() {
  return optionsResponse();
}
