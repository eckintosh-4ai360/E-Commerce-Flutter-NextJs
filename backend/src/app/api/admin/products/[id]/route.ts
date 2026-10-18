import type { Prisma } from '@prisma/client';

import { requireAdmin } from '@/lib/auth';
import { HttpError } from '@/lib/errors';
import {
  jsonResponse,
  parseIntParam,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { revalidateStorefront } from '@/lib/revalidate';
import {
  assertOriginalPriceAbovePrice,
  productImagesAreDistinct,
  updateProductSchema,
} from '@/lib/validation';
import { parseList } from '@/lib/serializers';

type Context = { params: Promise<{ id: string }> };

async function findProduct(id: string) {
  const product = await getPrisma().product.findUnique({
    where: { id: parseIntParam(id, 'product id') },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) {
    throw new HttpError(404, 'Product not found.');
  }
  return product;
}

export const GET = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const { _count, ...product } = await findProduct((await params).id);
  return jsonResponse(
    { product: { ...product, orderCount: _count.orderItems } },
    { headers: privateNoStoreHeaders },
  );
});

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const existing = await findProduct((await params).id);
  const input = await readJson(request, updateProductSchema);

  const price = input.price ?? existing.price;
  const originalPrice =
    input.originalPrice === undefined ? existing.originalPrice : input.originalPrice;
  if (!assertOriginalPriceAbovePrice({ price, originalPrice })) {
    throw new HttpError(
      400,
      'Original price must be higher than the selling price, or left empty.',
      {},
      { field: 'originalPrice' },
    );
  }

  const imagePath = input.imagePath ?? existing.imagePath;
  const galleryImages = input.galleryImages ?? parseList(existing.galleryImages);
  if (!productImagesAreDistinct({ imagePath, galleryImages })) {
    throw new HttpError(
      400,
      'The main image cannot also be included in the additional images.',
      {},
      { field: 'galleryImages' },
    );
  }

  const { tags, sizes, colors, galleryImages: nextGalleryImages, ...fields } = input;
  const data: Prisma.ProductUpdateInput = {
    ...fields,
    ...(nextGalleryImages !== undefined
      ? { galleryImages: JSON.stringify(nextGalleryImages) }
      : {}),
    ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
    ...(sizes !== undefined ? { sizes: JSON.stringify(sizes) } : {}),
    ...(colors !== undefined ? { colors: JSON.stringify(colors) } : {}),
  };

  const product = await getPrisma().product.update({
    where: { id: existing.id },
    data,
  });
  revalidateStorefront();
  return jsonResponse(
    { message: 'Product updated.', product },
    { headers: privateNoStoreHeaders },
  );
});

/**
 * Deletes a product, or archives it when existing orders reference it so that
 * order history stays intact. Archived products disappear from the store.
 */
export const DELETE = route<Context>(async (request, { params }) => {
  await requireAdmin(request);
  const existing = await findProduct((await params).id);
  const prisma = getPrisma();

  if (existing._count.orderItems > 0) {
    await prisma.product.update({
      where: { id: existing.id },
      data: { isArchived: true },
    });
    revalidateStorefront();
    return jsonResponse(
      {
        archived: true,
        message:
          'This product appears in past orders, so it was archived instead of deleted. It is hidden from the store and can be restored from the product editor.',
      },
      { headers: privateNoStoreHeaders },
    );
  }

  await prisma.product.delete({ where: { id: existing.id } });
  revalidateStorefront();
  return jsonResponse(
    { archived: false, message: 'Product deleted.' },
    { headers: privateNoStoreHeaders },
  );
});
