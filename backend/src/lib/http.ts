import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

import { HttpError, isPrismaError } from './errors';

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Auth uses bearer tokens rather than cookies, so a wildcard origin cannot be
// used for CSRF. CORS_ALLOWED_ORIGINS narrows it further when set.
function corsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, Idempotency-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '600',
  };

  if (allowedOrigins.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  }

  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  headers.Vary = 'Origin';
  return headers;
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(
  message: string,
  status = 400,
  headers: Record<string, string> = {},
  details?: unknown,
) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status, headers },
  );
}

function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return errorResponse(error.message, error.status, error.headers, error.details);
  }

  if (error instanceof ZodError) {
    return errorResponse(error.issues[0]?.message ?? 'Invalid request.', 400);
  }

  if (isPrismaError(error, 'P2025')) {
    return errorResponse('Not found.', 404);
  }

  if (isPrismaError(error, 'P2002')) {
    return errorResponse('That record already exists.', 409);
  }

  console.error('[api] Unhandled error', error);
  return errorResponse('Something went wrong on our side. Please try again.', 500);
}

type RouteHandler<Context> = (
  request: Request,
  context: Context,
) => Promise<Response> | Response;

/**
 * Wraps a route handler with consistent error handling and CORS headers.
 */
export function route<Context = unknown>(handler: RouteHandler<Context>) {
  return async (request: Request, context: Context) => {
    let response: Response;
    try {
      response = await handler(request, context);
    } catch (error) {
      response = toErrorResponse(error);
    }

    for (const [name, value] of Object.entries(corsHeaders(request))) {
      response.headers.set(name, value);
    }
    return response;
  };
}

export function preflight(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

const maxJsonBytes = 64 * 1024;

/** Parses and validates a JSON body, turning malformed input into a 400. */
export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > maxJsonBytes) {
    throw new HttpError(413, 'Request body is too large.');
  }

  const text = await request.text();
  if (text.length > maxJsonBytes) {
    throw new HttpError(413, 'Request body is too large.');
  }

  let body: unknown;
  try {
    body = text.length === 0 ? {} : JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    throw new HttpError(
      400,
      issue?.message ?? 'Invalid request.',
      {},
      field ? { field } : undefined,
    );
  }
  return result.data;
}

/**
 * Best-effort client IP for rate limiting. Hosting platforms such as Vercel
 * set x-real-ip from the actual connection; the first x-forwarded-for entry
 * can be supplied by the client, so it is only a fallback.
 */
export function getClientIp(request: Request) {
  return (
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/** The configured public URL of this deployment, if any. */
export function getPublicBaseUrl() {
  const configured =
    process.env.PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!configured?.trim()) {
    return null;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

export function parseIntParam(value: string, label = 'id') {
  if (!/^\d{1,9}$/.test(value)) {
    throw new HttpError(400, `The ${label} must be a positive whole number.`);
  }
  return Number(value);
}

export const publicCacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
};

export const privateNoStoreHeaders = {
  'Cache-Control': 'private, no-store',
};
