'use client';

import { getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

import { firebaseWebConfig } from '@/lib/store-config';

let auth: Auth | null = null;

export function getFirebaseAuth() {
  if (!auth) {
    const app = getApps()[0] ?? initializeApp(firebaseWebConfig);
    auth = getAuth(app);
  }
  return auth;
}
