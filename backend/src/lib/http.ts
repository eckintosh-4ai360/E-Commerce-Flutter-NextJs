import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Checkout sends Firebase ID tokens through the Authorization header.
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function getHeaderValue(request: Request, name: string) {
  return request.headers
    .get(name)
    ?.split(',')[0]
    .trim();
}

export function getRequestOrigin(request: Request) {
  const configuredUrl =
    process.env.PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL;

  if (configuredUrl?.trim()) {
    try {
      return new URL(configuredUrl).origin;
    } catch (_) {
      // Fall through to request-derived origin if the env value is malformed.
    }
  }

  const fallbackOrigin = new URL(request.url).origin;
  const protocol =
    getHeaderValue(request, 'x-forwarded-proto') ??
    new URL(request.url).protocol.replace(':', '');
  const host =
    getHeaderValue(request, 'x-forwarded-host') ??
    getHeaderValue(request, 'host');

  if (!host) {
    return fallbackOrigin;
  }

  return `${protocol}://${host}`;
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

export function optionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
