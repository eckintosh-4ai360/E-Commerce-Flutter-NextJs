import { createRemoteJWKSet, errors, jwtVerify } from 'jose';

import { HttpError } from './errors';
import { firebaseWebConfig } from './store-config';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

const firebaseSigningKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

function firebaseProjectId() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() || firebaseWebConfig.projectId;
  if (!projectId) {
    throw new HttpError(503, 'Authentication is temporarily unavailable. Please try again.');
  }
  return projectId;
}

function isPastTimestamp(value: unknown, now: number) {
  return typeof value === 'number' && Number.isFinite(value) && value <= now + 60;
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')?.trim();
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length === 0 ? null : token;
}

/**
 * Returns the signed-in user for a request carrying a Firebase ID token, null
 * when no token was sent, and throws 401 when the token is invalid or expired.
 */
export async function getAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const idToken = readBearerToken(request);
  if (!idToken) {
    return null;
  }

  const projectId = firebaseProjectId();
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, firebaseSigningKeys, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      requiredClaims: ['auth_time'],
    }));
  } catch (error) {
    if (error instanceof errors.JWKSTimeout || error instanceof errors.JWKSInvalid) {
      console.error('[auth] Firebase signing-key lookup failed', error);
      throw new HttpError(503, 'Authentication is temporarily unavailable. Please try again.');
    }
    if (!(error instanceof errors.JOSEError)) {
      console.error('[auth] Firebase token verification failed unexpectedly', error);
      throw new HttpError(503, 'Authentication is temporarily unavailable. Please try again.');
    }
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }

  const now = Math.floor(Date.now() / 1_000);
  const uid = payload.sub;
  if (
    typeof uid !== 'string' ||
    uid.length === 0 ||
    uid.length > 128 ||
    !isPastTimestamp(payload.iat, now) ||
    !isPastTimestamp(payload.auth_time, now)
  ) {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email) {
    throw new HttpError(
      401,
      'Your account does not have an email address. Sign in with Google to continue.',
    );
  }

  return {
    uid,
    email,
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
    emailVerified: payload.email_verified === true,
  };
}

export async function requireUser(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new HttpError(401, 'Sign in with Google to continue.');
  }
  return user;
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return adminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);

  if (adminEmails().length === 0) {
    throw new HttpError(
      403,
      'No admin accounts are configured. Add your Google email to ADMIN_EMAILS in backend/.env and restart the server.',
    );
  }

  if (!user.emailVerified || !isAdminEmail(user.email)) {
    throw new HttpError(403, `${user.email} is not allowed to manage this store.`);
  }

  return user;
}
