import { HttpError } from './errors';
import { getClientIp } from './http';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) {
    return;
  }
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Fixed-window limiter kept in process memory. On a multi-instance deployment
 * each instance counts separately, so treat the limits as per-instance; that
 * still blunts enumeration and spam from a single client.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
) {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new HttpError(
      429,
      'Too many requests. Please wait a moment and try again.',
      { 'Retry-After': String(retryAfter) },
    );
  }
}

export function rateLimitByIp(
  request: Request,
  scope: string,
  options: { limit: number; windowMs: number },
) {
  rateLimit(`${scope}:ip:${getClientIp(request)}`, options);
}
