import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type VerifiedCustomer = {
  uid: string;
  email: string;
  name: string | null;
};

function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    '\n',
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in backend/.env.',
    );
  }

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

  return getAuth(app);
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')?.trim();
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length == 0 ? null : token;
}

export async function verifyAuthenticatedCustomer(
  request: Request,
): Promise<VerifiedCustomer> {
  const idToken = readBearerToken(request);
  if (!idToken) {
    throw new Error(
      'Sign in with Google before placing your order. Missing Firebase ID token.',
    );
  }

  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);
  const email = decodedToken.email?.trim();
  if (!email) {
    throw new Error(
      'The signed-in Google account does not have an email address attached.',
    );
  }

  return {
    uid: decodedToken.uid,
    email,
    name: decodedToken.name?.trim() || null,
  };
}
