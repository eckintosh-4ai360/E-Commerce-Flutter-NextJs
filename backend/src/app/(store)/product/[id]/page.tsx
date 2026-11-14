import { BadgeCheck, RotateCcw, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductCard } from '@/components/store/ProductCard';
import { ProductGallery } from '@/components/store/ProductGallery';
import { PurchasePanel } from '@/components/store/PurchasePanel';
import { PriceRow, RatingStars } from '@/components/store/ui';
import { getProduct, getRelatedProducts } from '@/lib/catalog';
import { getSiteBaseUrl } from '@/lib/http';
import { discountPercent, formatMoney, formatPrice } from '@/lib/money';
import { parseList, productImagePaths, resolveImageUrl, serialiseProduct } from '@/lib/serializers';
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
  const siteUrl = getSiteBaseUrl();
  const rawImage = resolveImageUrl(product.imagePath, { absolute: true });
  const image = rawImage.startsWith('/') ? `${siteUrl}${rawImage}` : rawImage;
  const description =
    product.description.length > 155
      ? `${product.description.slice(0, 152)}...`
      : product.description;

  return {
    title: `${product.name} | Buy Online Ghana`,
    description,
    keywords: [
      product.name,
      product.category,
      ...parseList(product.tags),
      storeConfig.name,
      'online shopping Ghana',
      'buy in Ghana',
    ],
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: `${product.name} · ${storeConfig.name}`,
      description,
      url: `/product/${product.id}`,
      images: [
        {
          url: image,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} · ${storeConfig.name}`,
      description,
      images: [image],
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
  const siteUrl = getSiteBaseUrl();

  const absoluteImages = productImagePaths(record, { absolute: true }).map((img) =>
    img.startsWith('/') ? `${siteUrl}${img}` : img,
  );

  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: absoluteImages.length > 0 ? absoluteImages : [`${siteUrl}/logo.jpeg`],
    category: product.category,
    sku: String(product.id),
    brand: { '@type': 'Brand', name: storeConfig.shortName },
    itemCondition: 'https://schema.org/NewCondition',
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
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/product/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: storeConfig.name,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'GH',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: storeConfig.returnWindowDays,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: product.shippingFee,
          currency: storeConfig.currencyCode,
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'GH',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  const breadcrumbStructuredData = {
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
        name: product.category,
        item: `${siteUrl}/shop?category=${encodeURIComponent(product.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}/product/${product.id}`,
      },
    ],
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, '\\u003c'),
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
