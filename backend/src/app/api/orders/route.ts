import {
  errorResponse,
  getRequestOrigin,
  jsonResponse,
  optionsResponse,
} from '@/lib/http';
import { verifyAuthenticatedCustomer } from '@/lib/firebase-admin';
import { getPrisma } from '@/lib/prisma';
import {
  flatShippingFee,
  freeShippingThreshold,
} from '@/lib/seed-data';
import { serialiseOrder } from '@/lib/serializers';

type CreateOrderItem = {
  productId?: number;
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
};

type CreateOrderPayload = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  items?: CreateOrderItem[];
};

export async function GET(request: Request) {
  const prisma = getPrisma();
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone');
  const email = url.searchParams.get('email');
  const origin = getRequestOrigin(request);

  const orders = await prisma.order.findMany({
    where: {
      ...(phone ? { customerPhone: phone } : {}),
      ...(email ? { customerEmail: email } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return jsonResponse({
    orders: orders.map((order) => serialiseOrder(order, origin)),
  });
}

export async function POST(request: Request) {
  let authenticatedCustomer;
  try {
    authenticatedCustomer = await verifyAuthenticatedCustomer(request);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'You must be signed in with Google to place an order.';

    return errorResponse(
      message,
      message.startsWith('Firebase Admin is not configured') ? 503 : 401,
    );
  }

  const payload = (await request.json()) as CreateOrderPayload;
  const customerName =
    payload.customerName?.trim() || authenticatedCustomer.name || 'Guest';
  const customerPhone = payload.customerPhone?.trim();
  const items = payload.items ?? [];

  if (!customerName) {
    return errorResponse('Customer name is required.', 400);
  }

  if (!customerPhone) {
    return errorResponse('Customer phone is required.', 400);
  }

  if (items.length === 0) {
    return errorResponse('At least one cart item is required.', 400);
  }

  const normalisedItems = items.map((item) => ({
    productId: Number(item.productId),
    quantity: item.quantity ?? 1,
    selectedColor: item.selectedColor?.trim(),
    selectedSize: item.selectedSize?.trim(),
  }));

  if (
    normalisedItems.some(
      (item) => Number.isNaN(item.productId) || item.quantity < 1,
    )
  ) {
    return errorResponse(
      'Order items must have valid product ids and quantities.',
      400,
    );
  }

  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: normalisedItems.map((item) => item.productId),
      },
    },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  if (products.length !== normalisedItems.length) {
    return errorResponse('One or more products could not be found.', 404);
  }

  if (products.some((product) => !product.inStock)) {
    return errorResponse(
      'One or more selected products are out of stock.',
      409,
    );
  }

  const orderItems = normalisedItems.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new Error('A product vanished during order creation.');
    }

    return {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    };
  });

  const subtotal = orderItems.reduce<number>(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shippingFee =
    subtotal >= freeShippingThreshold ? 0 : flatShippingFee;

  const order = await prisma.order.create({
    data: {
      customerName,
      customerEmail: authenticatedCustomer.email,
      customerPhone,
      deliveryAddress: payload.deliveryAddress?.trim(),
      notes: payload.notes?.trim(),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return jsonResponse(
    {
      message: 'Order created successfully.',
      order: serialiseOrder(order, getRequestOrigin(request)),
    },
    { status: 201 },
  );
}

export function OPTIONS() {
  return optionsResponse();
}
