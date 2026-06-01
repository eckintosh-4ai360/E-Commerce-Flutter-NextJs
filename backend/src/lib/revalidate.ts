import { revalidatePath } from 'next/cache';

/** Refreshes cached storefront pages after a catalog change in the admin. */
export function revalidateStorefront() {
  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('[revalidate] Could not refresh storefront pages', error);
  }
}
