import { PackageSearch, X } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ProductCard } from '@/components/store/ProductCard';
import { FiltersDrawerButton, FiltersSidebar, SortSelect } from '@/components/store/ShopFilters';
import { EmptyState } from '@/components/store/ui';
import { buildFacets, getActiveProducts, getCategories, listProducts } from '@/lib/catalog';
import {
  hasRefinements,
  parseCatalogFilters,
  shopHref,
  type CatalogFilters,
} from '@/lib/catalog-params';
import { getSiteBaseUrl } from '@/lib/http';
import { serialiseProduct } from '@/lib/serializers';
import { storeConfig } from '@/lib/store-config';

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const featuredTitles = {
  sale: 'On Sale',
  new: 'New Arrivals',
  best: 'Best Sellers',
} as const;

function titleFor(filters: CatalogFilters) {
  if (filters.search) return `Results for “${filters.search}”`;
  if (filters.featured) return featuredTitles[filters.featured];
  if (filters.category) return filters.category;
  return 'Shop';
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const filters = parseCatalogFilters(await searchParams);
  const title = titleFor(filters).replace(/[“”]/g, '"');
  const canonicalPath = filters.category
    ? `/shop?category=${encodeURIComponent(filters.category)}`
    : '/shop';
  const description = filters.category
    ? `Explore ${filters.category.toLowerCase()} at ${storeConfig.name}. Enjoy fast delivery across Accra and nationwide Ghana, with Mobile Money and Pay on Delivery.`
    : `Browse high-quality products across all categories at ${storeConfig.name}. Dependable delivery and authentic goods in Ghana.`;

  const shouldNoindex = Boolean(filters.search || hasRefinements(filters));

  return {
    title: `${title} · Online Shopping Ghana`,
    description,
    alternates: { canonical: canonicalPath },
    robots: shouldNoindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: `${title} · ${storeConfig.name}`,
      description,
      url: canonicalPath,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${title} · ${storeConfig.name}`,
      description,
    },
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const filters = parseCatalogFilters(await searchParams);
  const [products, allProducts, categories] = await Promise.all([
    listProducts(filters),
    getActiveProducts(),
    getCategories(),
  ]);
  const facets = buildFacets(allProducts);
  const items = products.map((product) => serialiseProduct(product, { absoluteImages: false }));
  const filterProps = { filters, colors: facets.colors, sizes: facets.sizes, maxPrice: facets.maxPrice };

  const siteUrl = getSiteBaseUrl();
  const canonicalPath = filters.category
    ? `/shop?category=${encodeURIComponent(filters.category)}`
    : '/shop';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: filters.category ?? 'Shop',
        item: `${siteUrl}${canonicalPath}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: titleFor(filters),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 24).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${siteUrl}/product/${product.id}`,
    })),
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
        }}
      />
      {items.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListSchema).replace(/</g, '\\u003c'),
          }}
        />
      ) : null}

      <h1 className="page-title">{titleFor(filters)}</h1>
      <p className="page-subtitle">Product categories</p>

      <nav className="chip-row" aria-label="Categories">
        <Link
          href={shopHref(filters, { category: null })}
          className={`chip${filters.category === null ? ' is-active' : ''}`}
          aria-current={filters.category === null ? 'true' : undefined}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.name}
            href={shopHref(filters, { category: category.name })}
            className={`chip${filters.category === category.name ? ' is-active' : ''}`}
            aria-current={filters.category === category.name ? 'true' : undefined}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {filters.search || filters.featured ? (
        <div className="chip-row" style={{ marginTop: 8 }}>
          {filters.search ? (
            <Link href={shopHref(filters, { search: null })} className="chip">
              Search: {filters.search} <X size={14} aria-label="Clear search" />
            </Link>
          ) : null}
          {filters.featured ? (
            <Link href={shopHref(filters, { featured: null })} className="chip">
              {featuredTitles[filters.featured]} <X size={14} aria-label="Clear" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="shop-layout" style={{ marginTop: 8 }}>
        <FiltersSidebar {...filterProps} />
        <section aria-label="Products">
          <div className="shop-toolbar">
            <span aria-live="polite">
              Showing {items.length} result{items.length === 1 ? '' : 's'}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <FiltersDrawerButton {...filterProps} />
              <SortSelect filters={filters} />
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={44} />}
              title="No products match"
              action={
                <Link href="/shop" className="btn btn-primary">
                  Clear all filters
                </Link>
              }
            >
              Try widening the price range, clearing a few filters, or searching for something
              else.
            </EmptyState>
          ) : (
            <div className="product-grid product-grid--3">
              {items.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
