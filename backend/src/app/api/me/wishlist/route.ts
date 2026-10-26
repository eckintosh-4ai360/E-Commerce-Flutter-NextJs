import { requireUser } from '@/lib/auth';
import { addToWishlist, listWishlist } from '@/lib/customers';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { serialiseProduct } from '@/lib/serializers';
import { wishlistAddSchema } from '@/lib/validation';

async function respondWithWishlist(user: Awaited<ReturnType<typeof requireUser>>) {
  const products = await listWishlist(user);
  return jsonResponse(
    { products: products.map((product) => serialiseProduct(product)) },
    { headers: privateNoStoreHeaders },
  );
}

export const runtime = 'nodejs';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return respondWithWishlist(user);
});

/** Adds products (used to merge a device's local wishlist after sign-in). */
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { productIds } = await readJson(request, wishlistAddSchema);
  await addToWishlist(user, productIds);
  return respondWithWishlist(user);
});

export const OPTIONS = preflight;
