import type {
  Address,
  Customer,
  Order,
  OrderEvent,
  OrderItem,
  Product,
  ReturnRequest,
} from '@prisma/client';

import { getPublicBaseUrl } from './http';
import { storeConfig } from './store-config';
import type {
  AddressView,
  CustomerProfile,
  OrderView,
  ReturnRequestView,
  StoreProduct,
} from './types';

export function parseList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Local images (`/products/...`) are made absolute only when PUBLIC_APP_URL is
 * configured. Otherwise they stay relative and clients resolve them against
 * the API host, so request headers can never inject a foreign host into
 * cached responses.
 */
export function resolveImageUrl(imagePath: string, { absolute = true } = {}) {
  const trimmed = imagePath.trim();
  if (!absolute || !trimmed.startsWith('/')) {
    return trimmed;
  }

  const baseUrl = getPublicBaseUrl();
  return baseUrl ? new URL(trimmed, baseUrl).toString() : trimmed;
}

export function serialiseProduct(
  product: Product,
  { absoluteImages = true } = {},
): StoreProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    images: [resolveImageUrl(product.imagePath, { absolute: absoluteImages })],
    category: product.category,
    tags: parseList(product.tags),
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock && !product.isArchived,
    sizes: parseList(product.sizes),
    colors: parseList(product.colors),
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
  };
}

export function trackingCodeFor(orderId: string) {
  return orderId.slice(-10).toUpperCase();
}

export type OrderWithRelations = Order & {
  items: Array<OrderItem & { product: Pick<Product, 'imagePath'> }>;
  events?: OrderEvent[];
  returnRequests?: ReturnRequest[];
};

export const orderInclude = {
  items: { include: { product: { select: { imagePath: true } } } },
  events: { orderBy: { createdAt: 'asc' as const } },
  returnRequests: { orderBy: { createdAt: 'desc' as const } },
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Customer';
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length <= 3 ? '•••' : `••• ••• ${digits.slice(-3)}`;
}

export function deliveredAt(order: OrderWithRelations) {
  if (order.status !== 'DELIVERED') {
    return null;
  }

  const deliveredEvent = [...(order.events ?? [])]
    .reverse()
    .find((event) => event.status === 'DELIVERED');
  return deliveredEvent?.createdAt ?? order.updatedAt;
}

export function isWithinReturnWindow(order: OrderWithRelations, now = new Date()) {
  const delivered = deliveredAt(order);
  if (!delivered) {
    return false;
  }
  const windowMs = storeConfig.returnWindowDays * 24 * 60 * 60 * 1000;
  return now.getTime() - delivered.getTime() <= windowMs;
}

export function hasOpenReturn(order: OrderWithRelations) {
  return (order.returnRequests ?? []).some(
    (request) => request.status === 'REQUESTED' || request.status === 'APPROVED',
  );
}

export function serialiseReturnRequest(
  request: ReturnRequest,
): ReturnRequestView {
  return {
    id: request.id,
    orderId: request.orderId,
    trackingCode: trackingCodeFor(request.orderId),
    reason: request.reason,
    details: request.details,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export function serialiseOrder(
  order: OrderWithRelations,
  view: 'owner' | 'public' | 'admin',
): OrderView {
  const isPublic = view === 'public';
  const events = (order.events ?? []).map((event) => ({
    status: event.status,
    note: isPublic ? null : event.note,
    createdAt: event.createdAt.toISOString(),
  }));

  return {
    id: order.id,
    trackingCode: order.trackingCode ?? trackingCodeFor(order.id),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    customerName: isPublic ? firstName(order.customerName) : order.customerName,
    customerPhone: isPublic ? maskPhone(order.customerPhone) : order.customerPhone,
    customerEmail: isPublic ? null : order.customerEmail,
    deliveryAddress: isPublic ? null : order.deliveryAddress,
    notes: isPublic ? null : order.notes,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      imageUrl: getImageUrl(item.product.imagePath, origin),
    })),
  };
}
