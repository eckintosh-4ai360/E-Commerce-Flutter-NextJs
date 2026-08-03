'use client';

import { CloudOff } from 'lucide-react';
import { useEffect } from 'react';

import { EmptyState } from '@/components/store/ui';

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container">
      <EmptyState
        icon={<CloudOff size={44} />}
        title="We could not load this page"
        action={
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
        }
      >
        Something went wrong on our side. Please try again in a moment.
      </EmptyState>
    </div>
  );
}
