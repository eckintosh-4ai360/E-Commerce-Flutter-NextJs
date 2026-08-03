import { SearchX } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/store/ui';

export default function StoreNotFound() {
  return (
    <div className="container">
      <EmptyState
        icon={<SearchX size={44} />}
        title="We couldn't find that page"
        action={
          <Link href="/shop" className="btn btn-primary">
            Browse the shop
          </Link>
        }
      >
        The product may have been removed, or the link might be mistyped.
      </EmptyState>
    </div>
  );
}
