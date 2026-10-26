import { requireAdmin } from '@/lib/auth';
import { jsonResponse, privateNoStoreHeaders, route } from '@/lib/http';

export const runtime = 'nodejs';

export const GET = route(async (request) => {
  const admin = await requireAdmin(request);
  return jsonResponse(
    { admin: { email: admin.email, name: admin.name } },
    { headers: privateNoStoreHeaders },
  );
});
