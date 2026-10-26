import { requireUser } from '@/lib/auth';
import { removeFromWishlist } from '@/lib/customers';
import {
  jsonResponse,
  parseIntParam,
  preflight,
  privateNoStoreHeaders,
  route,
} from '@/lib/http';

type Context = { params: Promise<{ productId: string }> };

export const runtime = 'nodejs';

export const DELETE = route<Context>(async (request, { params }) => {
  const user = await requireUser(request);
  const { productId } = await params;
  await removeFromWishlist(user, parseIntParam(productId, 'product id'));
  return jsonResponse({ message: 'Removed from wishlist.' }, { headers: privateNoStoreHeaders });
});

export const OPTIONS = preflight;
