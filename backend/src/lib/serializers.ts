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

type OrderWithItems = Order & {
  items: Array<
    OrderItem & {
      product: Product;
    }
  >;
};

export function serialiseOrder(order: OrderWithItems, origin: string) {
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
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
