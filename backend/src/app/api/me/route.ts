import { isAdminEmail, requireUser } from '@/lib/auth';
import { ensureCustomer, updateProfile } from '@/lib/customers';
import {
  jsonResponse,
  preflight,
  privateNoStoreHeaders,
  readJson,
  route,
} from '@/lib/http';
import { serialiseProfile } from '@/lib/serializers';
import { updateProfileSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const customer = await ensureCustomer(user);

  return jsonResponse(
    {
      profile: serialiseProfile(customer),
      isAdmin: user.emailVerified && user.email !== null && isAdminEmail(user.email),
    },
    { headers: privateNoStoreHeaders },
  );
});

export const PATCH = route(async (request) => {
  const user = await requireUser(request);
  const input = await readJson(request, updateProfileSchema);
  const customer = await updateProfile(user, input);

  return jsonResponse(
    { message: 'Profile updated.', profile: serialiseProfile(customer) },
    { headers: privateNoStoreHeaders },
  );
});

export const OPTIONS = preflight;
