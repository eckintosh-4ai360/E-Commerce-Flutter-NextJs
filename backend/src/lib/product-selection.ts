import type { StoreProduct } from './types';

export function cartLineKey(productId: number, color: string | null, size: string | null) {
  return `${productId}|${color ?? ''}|${size ?? ''}`;
}

export function selectedProductVariants(
  product: Pick<StoreProduct, 'id' | 'colors' | 'sizes'>,
  quantities: Readonly<Record<string, number>>,
) {
  return (product.colors.length > 0 ? product.colors : [null]).flatMap((color) =>
    (product.sizes.length > 0 ? product.sizes : [null]).flatMap((size) => {
      const quantity = quantities[cartLineKey(product.id, color, size)] ?? 0;
      return quantity > 0 ? [{ color, size, quantity }] : [];
    }),
  );
}
