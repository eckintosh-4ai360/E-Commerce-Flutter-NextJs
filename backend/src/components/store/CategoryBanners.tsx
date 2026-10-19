import { Footprints, Gem, ShoppingBag, Tag, Wallet, Watch } from 'lucide-react';
import Link from 'next/link';

const palette = ['#001a3a', '#0b4aa2', '#cc8900', '#164f86'];

function iconFor(category: string) {
  const name = category.toLowerCase();
  if (name.includes('bag')) return ShoppingBag;
  if (name.includes('watch')) return Watch;
  if (name.includes('wallet')) return Wallet;
  if (name.includes('shoe') || name.includes('slipper')) return Footprints;
  if (name.includes('accessor') || name.includes('jewel')) return Gem;
  return Tag;
}

export function CategoryBanners({
  categories,
}: {
  categories: Array<{ name: string; count: number }>;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="category-banners">
      {categories.slice(0, 4).map((category, index) => {
        const Icon = iconFor(category.name);
        return (
          <Link
            key={category.name}
            href={`/shop?category=${encodeURIComponent(category.name)}`}
            className="category-banner"
            style={{ background: palette[index % palette.length] }}
          >
            <Icon size={40} aria-hidden="true" />
            <span>
              <strong>{category.name}</strong>
              <span>
                {category.count} product{category.count === 1 ? '' : 's'}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
