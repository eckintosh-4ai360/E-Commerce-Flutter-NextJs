import { randomInt } from 'node:crypto';

import type { OrderStatus, Prisma } from '@prisma/client';

import type { AuthenticatedUser } from './auth';
import { HttpError, isPrismaError } from './errors';
import { roundMoney } from './money';
import { getPrisma } from './prisma';
import {
  hasOpenReturn,
  isWithinReturnWindow,
  orderInclude,
  parseList,
  trackingCodeFor,
  type OrderWithRelations,
} from './serializers';
import { shippingFeeFor, storeConfig } from './store-config';
import type { CreateOrderInput } from './validation';

const base36 = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * cuid-shaped id whose last 10 characters are random. Customers track orders
 * with those 10 characters, so they must not be guessable.
 */
export function createOrderId() {
  let random = '';
  for (let index = 0; index < 16; index += 1) {
    random += base36[randomInt(36)];
  }
  return `c${Date.now().toString(36)}${random}`;
}

export function ownsOrder(
  user: AuthenticatedUser,
  order: { customerUid: string | null; customerEmail: string | null },
) {
  if (order.customerUid) {
    return order.customerUid === user.uid;
  }
  // Orders placed before uids were stored are matched by verified email.
  return (
    user.emailVerified &&
    order.customerEmail?.trim().toLowerCase() === user.email
  );
}

function ownedOrdersWhere(user: AuthenticatedUser): Prisma.OrderWhereInput {
  return {
    OR: [
      { customerUid: user.uid },
      ...(user.emailVerified
        ? [
            {
              customerUid: null,
              customerEmail: { equals: user.email, mode: 'insensitive' as const },
            },
          ]
        : []),
    ],
  };
}

type OrderLine = {
  productId: number;
  quantity: number;
  selectedColor: string | null;
  selectedSize: string | null;
};

function mergeLines(items: CreateOrderInput['items']): OrderLine[] {
  const merged = new Map<string, OrderLine>();
  for (const item of items) {
    const key = `${item.productId}|${item.selectedColor ?? ''}|${item.selectedSize ?? ''}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(key, { ...item });
    }
  }

  const lines = [...merged.values()];
  if (lines.some((line) => line.quantity > storeConfig.maxQuantityPerLine)) {
    throw new HttpError(
      400,
      `You can order at most ${storeConfig.maxQuantityPerLine} of one item.`,
    );
  }
  return lines;
}

export async function priceOrder(input: CreateOrderInput) {
  const lines = mergeLines(input.items);
  const productIds = [...new Set(lines.map((line) => line.productId))];
  const products = await getPrisma().product.findMany({
    where: { id: { in: productIds } },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  const unavailable = productIds.filter((id) => {
    const product = productsById.get(id);
    return !product || product.isArchived;
  });
  if (unavailable.length > 0) {
    throw new HttpError(
      409,
      'Some items in your cart are no longer available. Remove them and try again.',
      {},
      { unavailableProductIds: unavailable },
    );
  }

  const orderItems = lines.map((line) => {
    const product = productsById.get(line.productId)!;
    if (!product.inStock) {
      throw new HttpError(409, `${product.name} is out of stock.`, {}, {
        unavailableProductIds: [product.id],
      });
    }

    const colors = parseList(product.colors);
    if (line.selectedColor && !colors.includes(line.selectedColor)) {
      throw new HttpError(400, `${line.selectedColor} is not available for ${product.name}.`);
    }
    const sizes = parseList(product.sizes);
    if (line.selectedSize && !sizes.includes(line.selectedSize)) {
      throw new HttpError(400, `Size ${line.selectedSize} is not available for ${product.name}.`);
    }

    return {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
      selectedColor: line.selectedColor,
      selectedSize: line.selectedSize,
    };
  });

  const subtotal = roundMoney(
    orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  const shippingFee = shippingFeeFor(subtotal);
  return { orderItems, subtotal, shippingFee, total: roundMoney(subtotal + shippingFee) };
}

async function findByClientRequestId(clientRequestId: string) {
  return getPrisma().order.findUnique({
    where: { clientRequestId },
    include: orderInclude,
  });
}

function assertSameCustomer(user: AuthenticatedUser, order: OrderWithRelations) {
  if (order.customerUid !== user.uid) {
    throw new HttpError(409, 'This checkout request was already used. Refresh and try again.');
  }
  return order;
}

export async function createOrder(
  user: AuthenticatedUser,
  input: CreateOrderInput,
  clientRequestId: string | null,
): Promise<{ order: OrderWithRelations; created: boolean }> {
  if (clientRequestId) {
    const existing = await findByClientRequestId(clientRequestId);
    if (existing) {
      return { order: assertSameCustomer(user, existing), created: false };
    }
  }

  const priced = await priceOrder(input);
  if (
    input.expectedTotal !== undefined &&
    Math.abs(input.expectedTotal - priced.total) > 0.009
  ) {
    throw new HttpError(
      409,
      'Prices in your cart have changed. Please review your cart and try again.',
      {},
      { subtotal: priced.subtotal, shippingFee: priced.shippingFee, total: priced.total },
    );
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = createOrderId();
    try {
      const order = await getPrisma().order.create({
        data: {
          id,
          trackingCode: trackingCodeFor(id),
          customerUid: user.uid,
          customerName: input.customerName,
          customerEmail: user.email,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          notes: input.notes,
          paymentMethod: input.paymentMethod,
          clientRequestId,
          subtotal: priced.subtotal,
          shippingFee: priced.shippingFee,
          total: priced.total,
          items: { create: priced.orderItems },
          events: { create: { status: 'PENDING', note: 'Order placed' } },
        },
        include: orderInclude,
      });
      return { order, created: true };
    } catch (error) {
      if (!isPrismaError(error, 'P2002')) {
        throw error;
      }
      const target = String(error.meta?.target ?? '');
      if (clientRequestId && target.includes('clientRequestId')) {
        // A concurrent retry of the same checkout won the race.
        const existing = await findByClientRequestId(clientRequestId);
        if (existing) {
          return { order: assertSameCustomer(user, existing), created: false };
        }
      }
      // Otherwise the tracking code collided; try again with a new id.
    }
  }

  throw new HttpError(503, 'We could not place your order right now. Please try again.');
}

export async function listCustomerOrders(user: AuthenticatedUser) {
  return getPrisma().order.findMany({
    where: ownedOrdersWhere(user),
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: orderInclude,
  });
}

/** Normalises what a customer typed (`#ABC123...`, a full id) for lookup. */
export function normaliseTrackingInput(value: string) {
  return value.trim().replace(/^#/, '').replace(/\s+/g, '');
}

export async function findOrderByReference(reference: string) {
  const normalised = normaliseTrackingInput(reference);
  if (!/^[A-Za-z0-9]{10,40}$/.test(normalised)) {
    throw new HttpError(400, 'Enter the 10-character tracking code from your order confirmation.');
  }

  const prisma = getPrisma();
  if (normalised.length === 10) {
    const code = normalised.toUpperCase();
    const byCode = await prisma.order.findUnique({
      where: { trackingCode: code },
      include: orderInclude,
    });
    if (byCode) {
      return byCode;
    }
    // Orders created before tracking codes were stored (see prisma/backfill.sql).
    return prisma.order.findFirst({
      where: { trackingCode: null, id: { endsWith: code.toLowerCase() } },
      include: orderInclude,
    });
  }

  return prisma.order.findUnique({
    where: { id: normalised.toLowerCase() },
    include: orderInclude,
  });
}

export async function getOwnedOrder(user: AuthenticatedUser, reference: string) {
  const order = await findOrderByReference(reference);
  if (!order || !ownsOrder(user, order)) {
    throw new HttpError(404, 'Order not found.');
  }
  return order;
}

export async function cancelOrder(user: AuthenticatedUser, reference: string) {
  const order = await getOwnedOrder(user, reference);
  const prisma = getPrisma();

  // The status check is part of the update so an order an admin has just
  // started processing cannot be cancelled by a stale screen.
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (updated.count === 1) {
      await tx.orderEvent.create({
        data: { orderId: order.id, status: 'CANCELLED', note: 'Cancelled by customer' },
      });
    }
    return updated.count;
  });

  if (result === 0) {
    throw new HttpError(409, 'This order is already being processed and can no longer be cancelled. Contact support for help.');
  }

  return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
}

export async function updateOrderStatus(id: string, status: OrderStatus, note: string | null) {
  const prisma = getPrisma();
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Order not found.');
  }
  if (existing.status === status) {
    return { order: null, previousStatus: existing.status };
  }

  const [order] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    }),
    prisma.orderEvent.create({ data: { orderId: id, status, note } }),
  ]);
  return { order, previousStatus: existing.status };
}

export async function createReturnRequest(
  user: AuthenticatedUser,
  input: { orderId: string; reason: string; details: string | null },
) {
  const order = await getOwnedOrder(user, input.orderId);

  if (order.status !== 'DELIVERED') {
    throw new HttpError(400, 'Returns can only be requested for delivered orders.');
  }
  if (!isWithinReturnWindow(order)) {
    throw new HttpError(
      400,
      `The ${storeConfig.returnWindowDays}-day return window for this order has closed.`,
    );
  }
  if (hasOpenReturn(order)) {
    throw new HttpError(409, 'There is already an open return request for this order.');
  }

  return getPrisma().returnRequest.create({
    data: {
      orderId: order.id,
      customerUid: user.uid,
      reason: input.reason,
      details: input.details,
    },
  });
}

export async function listCustomerReturns(user: AuthenticatedUser) {
  return getPrisma().returnRequest.findMany({
    where: { customerUid: user.uid },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
