import { getPrisma } from '@/lib/prisma';
import { jsonResponse, optionsResponse } from '@/lib/http';

export async function GET() {
  const prisma = getPrisma();
  const productCount = await prisma.product.count();

  return jsonResponse({
    status: 'ok',
    productCount,
    checkedAt: new Date().toISOString(),
  });
}

export function OPTIONS() {
  return optionsResponse();
}
