'use client';

import type { User } from 'firebase/auth';

export function initialsFor(name: string | null | undefined, email: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return `${first}${last}`.toUpperCase();
  }
  return (email ?? '?').slice(0, 1).toUpperCase();
}

export function Avatar({ user }: { user: Pick<User, 'displayName' | 'email' | 'photoURL'> }) {
  return (
    <span className="avatar" aria-hidden="true">
      {user.photoURL ? (
        // Google avatars are small and already sized; next/image adds nothing here.
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        initialsFor(user.displayName, user.email)
      )}
    </span>
  );
}
