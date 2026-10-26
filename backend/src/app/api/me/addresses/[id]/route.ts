import { requireUser } from '@/lib/auth';
import { deleteAddress, updateAddress } from '@/lib/customers';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { serialiseAddress } from '@/lib/serializers';
import { addressSchema } from '@/lib/validation';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export const PUT = route<Context>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const input = await readJson(request, addressSchema);
  const address = await updateAddress(user, id, input);
  return jsonResponse(
    { message: 'Address updated.', address: serialiseAddress(address) },
    { headers: privateNoStoreHeaders },
  );
});

export const DELETE = route<Context>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  await deleteAddress(user, id);
  return jsonResponse({ message: 'Address removed.' }, { headers: privateNoStoreHeaders });
});

export const OPTIONS = preflight;
