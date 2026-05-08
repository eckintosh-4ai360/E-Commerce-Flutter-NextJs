import { PrismaClient } from '@prisma/client';

import { seedProducts } from '../src/lib/seed-data';

const prisma = new PrismaClient();

async function main() {
  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        imagePath: product.imagePath,
        category: product.category,
        tags: JSON.stringify(product.tags ?? []),
        rating: product.rating ?? 4.5,
        reviewCount: product.reviewCount ?? 0,
        inStock: product.inStock ?? true,
        sizes: JSON.stringify(product.sizes ?? []),
        colors: JSON.stringify(product.colors ?? []),
        isNew: product.isNew ?? false,
        isBestSeller: product.isBestSeller ?? false,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        imagePath: product.imagePath,
        category: product.category,
        tags: JSON.stringify(product.tags ?? []),
        rating: product.rating ?? 4.5,
        reviewCount: product.reviewCount ?? 0,
        inStock: product.inStock ?? true,
        sizes: JSON.stringify(product.sizes ?? []),
        colors: JSON.stringify(product.colors ?? []),
        isNew: product.isNew ?? false,
        isBestSeller: product.isBestSeller ?? false,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
