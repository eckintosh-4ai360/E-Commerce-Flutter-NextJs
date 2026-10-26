import { BadgeCheck, RotateCcw, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductCard } from '@/components/store/ProductCard';
import { ProductGallery } from '@/components/store/ProductGallery';
import { PurchasePanel } from '@/components/store/PurchasePanel';
import { PriceRow, RatingStars } from '@/components/store/ui';
import { getProduct, getRelatedProducts } from '@/lib/catalog';
import { getPublicBaseUrl } from '@/lib/http';
import { discountPercent, formatMoney, formatPrice } from '@/lib/money';
import { productImagePaths, resolveImageUrl, serialiseProduct } from '@/lib/serializers';
import { storeConfig } from '@/lib/store-config';

type ProductPageProps = { params: Promise<{ id: string }> };

export const revalidate = 300;

// Pages are rendered on first visit and then cached, rather than at build time.
export function generateStaticParams() {
  return [];
}

async function loadProduct(id: string) {
  if (!/^\d{1,9}$/.test(id)) {
    return null;
  }
  return getProduct(Number(id));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProduct((await params).id);
  if (!product) {
    return { title: 'Product not found' };
  }
  const image = resolveImageUrl(product.imagePath);
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: image }],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const record = await loadProduct((await params).id);
  if (!record) {
    notFound();
  }

  const product = serialiseProduct(record, { absoluteImages: false });
  const related = (await getRelatedProducts(record)).map((item) =>
    serialiseProduct(item, { absoluteImages: false }),
  );
  const discount = discountPercent(product.price, product.originalPrice);
  const baseUrl = getPublicBaseUrl();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: productImagePaths(record),
    category: product.category,
    sku: String(product.id),
    brand: { '@type': 'Brand', name: storeConfig.shortName },
    aggregateRating:
      product.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: storeConfig.currencyCode,
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: baseUrl ? `${baseUrl}/product/${product.id}` : undefined,
    },
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        // JSON.stringify output is escaped for "<" so it cannot close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <ProductGallery
          images={product.images}
          productName={product.name}
          discount={discount}
          isNew={product.isNew}
        />

        <div className="pdp__info">
          <div className="pdp__title-row">
            <h1>{product.name}</h1>
            <span className={`badge ${product.inStock ? 'badge--stock' : 'badge--nostock'}`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
          </div>

          <div className="pdp__price">
            <PriceRow price={product.price} originalPrice={product.originalPrice} />
            {discount !== null && product.originalPrice !== null ? (
              <span className="badge badge--save">
                Save {formatPrice(product.originalPrice - product.price)}
              </span>
            ) : null}
          </div>

          <PurchasePanel product={product} />

          <h2 style={{ fontSize: 16, margin: '8px 0' }}>Description</h2>
          <p className="pdp__description">{product.description}</p>

          <div className="feature-list">
            <div>
              <span className="feature-icon"><BadgeCheck size={20} /></span>
              <span>
                <strong>Premium Quality</strong>
                <span>Hand-selected materials</span>
              </span>
            </div>
            <div>
              <span className="feature-icon"><Truck size={20} /></span>
              <span>
                <strong>Fast Delivery</strong>
                <span>
                  Delivered across Ghana · {product.shippingFee === 0
                    ? 'shipping included'
                    : `${formatMoney(product.shippingFee)} per item`}
                </span>
              </span>
            </div>
            <div>
              <span className="feature-icon"><RotateCcw size={20} /></span>
              <span>
                <strong>Easy Returns</strong>
                <span>{storeConfig.returnWindowDays}-day hassle-free returns</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="section" aria-labelledby="related-heading">
          <div className="section-header">
            <h2 id="related-heading">You may also like</h2>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
