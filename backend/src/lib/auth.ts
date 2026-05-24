import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { HttpError } from './errors';
import { firebaseWebConfig } from './store-config';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() || firebaseWebConfig.projectId;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Verifying ID tokens only needs the project id (Google's signing keys are
  // public). A service account is optional and enables other Admin features.
  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  return initializeApp({ projectId });
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

  let decoded;
  try {
    decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }

  const email = decoded.email?.trim().toLowerCase();
  if (!email) {
    throw new HttpError(
      401,
      'Your account does not have an email address. Sign in with Google to continue.',
    );
  }

  return {
    uid: decoded.uid,
    email,
    name: typeof decoded.name === 'string' && decoded.name.trim() ? decoded.name.trim() : null,
    picture: typeof decoded.picture === 'string' ? decoded.picture : null,
    emailVerified: decoded.email_verified === true,
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
