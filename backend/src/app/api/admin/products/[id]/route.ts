import { errorResponse, jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { id: Number(id) } });
  if (!product) return errorResponse('Product not found.', 404);
  return jsonResponse({ product });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = getPrisma();
  const body = await request.json();

  const existing = await prisma.product.findUnique({ where: { id: Number(id) } });
  if (!existing) return errorResponse('Product not found.', 404);

  const {
    name, description, price, originalPrice,
    imagePath, category, tags, rating,
    reviewCount, inStock, sizes, colors,
    isNew, isBestSeller,
  } = body;

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(originalPrice !== undefined && { originalPrice: originalPrice ? Number(originalPrice) : null }),
      ...(imagePath !== undefined && { imagePath: String(imagePath).trim() }),
      ...(category !== undefined && { category: String(category).trim() }),
      ...(tags !== undefined && { tags: JSON.stringify(Array.isArray(tags) ? tags : []) }),
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(reviewCount !== undefined && { reviewCount: Number(reviewCount) }),
      ...(inStock !== undefined && { inStock: Boolean(inStock) }),
      ...(sizes !== undefined && { sizes: JSON.stringify(Array.isArray(sizes) ? sizes : []) }),
      ...(colors !== undefined && { colors: JSON.stringify(Array.isArray(colors) ? colors : []) }),
      ...(isNew !== undefined && { isNew: Boolean(isNew) }),
      ...(isBestSeller !== undefined && { isBestSeller: Boolean(isBestSeller) }),
    },
  });

  return jsonResponse({ message: 'Product updated.', product });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = getPrisma();
  const existing = await prisma.product.findUnique({ where: { id: Number(id) } });
  if (!existing) return errorResponse('Product not found.', 404);
  await prisma.product.delete({ where: { id: Number(id) } });
  return jsonResponse({ message: 'Product deleted.' });
}

export function OPTIONS() {
  return optionsResponse();
}
