import { errorResponse, jsonResponse, optionsResponse } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return jsonResponse({ products });
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const body = await request.json();

  const {
    name, description, price, originalPrice,
    imagePath, category, tags, rating,
    reviewCount, inStock, sizes, colors,
    isNew, isBestSeller,
  } = body;

  if (!name || !description || !price || !imagePath || !category) {
    return errorResponse('name, description, price, imagePath, category are required.', 400);
  }

  // Auto-generate next id
  const last = await prisma.product.findFirst({ orderBy: { id: 'desc' } });
  const nextId = (last?.id ?? 0) + 1;

  const product = await prisma.product.create({
    data: {
      id: nextId,
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      imagePath: String(imagePath).trim(),
      category: String(category).trim(),
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      rating: rating ? Number(rating) : 4.5,
      reviewCount: reviewCount ? Number(reviewCount) : 0,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      sizes: JSON.stringify(Array.isArray(sizes) ? sizes : []),
      colors: JSON.stringify(Array.isArray(colors) ? colors : []),
      isNew: isNew !== undefined ? Boolean(isNew) : false,
      isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : false,
    },
  });

  return jsonResponse({ message: 'Product created.', product }, { status: 201 });
}

export function OPTIONS() {
  return optionsResponse();
}
