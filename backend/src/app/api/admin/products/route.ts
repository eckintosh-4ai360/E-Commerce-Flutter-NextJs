import { requireAdmin } from '@/lib/auth';
import { isPrismaError } from '@/lib/errors';
import { jsonResponse, privateNoStoreHeaders, readJson, route } from '@/lib/http';
import { getPrisma } from '@/lib/prisma';
import { revalidateStorefront } from '@/lib/revalidate';
import { createProductSchema } from '@/lib/validation';

export const GET = route(async (request) => {
  await requireAdmin(request);
  const products = await getPrisma().product.findMany({
    orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { orderItems: true } } },
  });

  return jsonResponse(
    {
      products: products.map(({ _count, ...product }) => ({
        ...product,
        orderCount: _count.orderItems,
      })),
    },
    { headers: privateNoStoreHeaders },
  );
});

export const POST = route(async (request) => {
  await requireAdmin(request);
  const input = await readJson(request, createProductSchema);
  const prisma = getPrisma();

  const data = {
    ...input,
    originalPrice: input.originalPrice ?? null,
    tags: JSON.stringify(input.tags),
    sizes: JSON.stringify(input.sizes),
    colors: JSON.stringify(input.colors),
  };

  // Product ids are plain integers; retry if two admins create at once.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const last = await prisma.product.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    try {
      const product = await prisma.product.create({
        data: { ...data, id: (last?.id ?? 0) + 1 },
      });
      revalidateStorefront();
      return jsonResponse(
        { message: 'Product created.', product },
        { status: 201, headers: privateNoStoreHeaders },
      );
    } catch (error) {
      if (!isPrismaError(error, 'P2002')) {
        throw error;
      }
    }
  }

  return jsonResponse(
    { error: 'Could not allocate a product id. Please try again.' },
    { status: 503 },
  );
});
