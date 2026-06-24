'use client';

// localStorage can be unavailable (private mode, blocked storage) or hold
// data written by an older version, so every access is defensive.

export function readStored<T>(key: string, validate: (value: unknown) => T | null): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? validate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked; the in-memory state still works this session.
  }
}

export function removeStored(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
