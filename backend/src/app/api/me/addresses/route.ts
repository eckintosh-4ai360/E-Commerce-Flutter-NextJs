import { requireUser } from '@/lib/auth';
import { createAddress, listAddresses } from '@/lib/customers';
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

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const addresses = await listAddresses(user);
  return jsonResponse(
    { addresses: addresses.map(serialiseAddress) },
    { headers: privateNoStoreHeaders },
  );
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const input = await readJson(request, addressSchema);
  const address = await createAddress(user, input);
  return jsonResponse(
    { message: 'Address saved.', address: serialiseAddress(address) },
    { status: 201, headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
