'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { StoreProduct } from '@/lib/types';

import { ProductCard } from './ProductCard';

const visibleCount = 8;

/** "All products" section with category tabs, as on the app's home screen. */
export function HomeProductTabs({
  products,
  categories,
}: {
  products: StoreProduct[];
  categories: string[];
}) {
  const [selected, setSelected] = useState('All');
  const filtered =
    selected === 'All' ? products : products.filter((product) => product.category === selected);
  const viewAllHref =
    selected === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(selected)}`;

  return (
    <section className="section" aria-labelledby="all-products-heading">
      <div className="section-header">
        <div>
          <h2 id="all-products-heading">All Products</h2>
          <p>Eckintosh essentials for every season</p>
        </div>
        <Link href={viewAllHref} className="link-arrow">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="chip-row" role="group" aria-label="Filter by category" style={{ marginBottom: 14 }}>
        {['All', ...categories].map((category) => (
          <button
            key={category}
            type="button"
            className="chip"
            aria-pressed={category === selected}
            onClick={() => setSelected(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="product-grid">
        {filtered.slice(0, visibleCount).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filtered.length > visibleCount ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Link href={viewAllHref} className="btn btn-outline">
            See all {filtered.length} products
          </Link>
        </div>
      ) : null}
    </section>
  );
}
