import { getProduct } from '@/lib/catalog';
import { HttpError } from '@/lib/errors';
import {
  jsonResponse,
  parseIntParam,
  preflight,
  publicCacheHeaders,
  route,
} from '@/lib/http';
import { serialiseProduct } from '@/lib/serializers';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const product = await getProduct(parseIntParam(id, 'product id'));
  if (!product) {
    throw new HttpError(404, 'Product not found.');
  }

  return jsonResponse(
    { product: serialiseProduct(product) },
    { headers: publicCacheHeaders },
  );
});

export const OPTIONS = preflight;
