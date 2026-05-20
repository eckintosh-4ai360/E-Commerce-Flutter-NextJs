/**
 * An error that maps directly to an HTTP response. Anything else thrown from a
 * route handler is treated as an unexpected 500 and its message is not exposed.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly headers: Record<string, string> = {},
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function isPrismaError(
  error: unknown,
  code: string,
): error is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}
