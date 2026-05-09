import type {
  Order,
  OrderItem,
  Product,
} from '@prisma/client';

function parseList(value: string) {
  try {
    return JSON.parse(value) as string[];
  } catch (_) {
    return [] as string[];
  }
}

function getImageUrl(imagePath: string, origin: string) {
  if (imagePath.startsWith('/')) {
    return new URL(imagePath, origin).toString();
  }
  return imagePath; // Return 'assets/...' or 'http...' as is
}

export function serialiseProduct(product: Product, origin: string) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    images: [getImageUrl(product.imagePath, origin)],
    category: product.category,
    tags: parseList(product.tags),
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
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
