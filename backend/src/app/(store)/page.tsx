import { ArrowRight, BadgeCheck, Headset, RotateCcw, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { CategoryBanners } from '@/components/store/CategoryBanners';
import { HomeProductTabs } from '@/components/store/HomeProductTabs';
import { ProductCard } from '@/components/store/ProductCard';
import { StoreBadges } from '@/components/store/StoreBadges';
import { getActiveProducts, getCategories } from '@/lib/catalog';
import { discountPercent } from '@/lib/money';
import { serialiseProduct } from '@/lib/serializers';
import { storeConfig } from '@/lib/store-config';

// Rebuilt at most every 5 minutes, and immediately when the admin edits products.
export const revalidate = 300;

export default async function HomePage() {
  const [products, categories] = await Promise.all([getActiveProducts(), getCategories()]);
  const items = products.map((product) => serialiseProduct(product, { absoluteImages: false }));
  const onSale = items.filter(
    (product) => discountPercent(product.price, product.originalPrice) !== null,
  );
  return (
    <div className="container">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero__rings" aria-hidden="true" />
        <div className="hero__content">
          <span className="hero__tag">{storeConfig.tagline}</span>
          <h1 id="hero-heading">
            Shop global.
            <br />
            <span>Pay local.</span>
          </h1>
          <p>
            Discover global finds, pay your way, and get dependable delivery across Ghana.
            Delivery fees are shown clearly at checkout.
          </p>
          <div className="hero__actions">
            <Link href="/shop" className="btn btn-accent">
              Shop now
            </Link>
            {onSale.length > 0 ? (
              <Link href="/shop?featured=sale" className="btn btn-outline">
                View deals
              </Link>
            ) : null}
          </div>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <Image
            src="/logo.jpeg"
            alt=""
            fill
            priority
            sizes="(min-width: 900px) 42vw, 0px"
            className="hero__logo-art"
          />
        </div>
      </section>

      <div className="feature-strip">
        <div>
          <Truck size={22} aria-hidden="true" />
          <span>
            Flexible{' '}
            <br />
            Delivery
          </span>
        </div>
        <div>
          <RotateCcw size={22} aria-hidden="true" />
          <span>
            Easy{' '}
            <br />
            Returns
          </span>
        </div>
        <div>
          <BadgeCheck size={22} aria-hidden="true" />
          <span>
            100%{' '}
            <br />
            Authentic
          </span>
        </div>
        <div>
          <Headset size={22} aria-hidden="true" />
          <span>
            24/7{' '}
            <br />
            Support
          </span>
        </div>
      </div>

      {onSale.length > 0 ? (
        <section className="section" aria-labelledby="sales-heading">
          <div className="section-header">
            <div>
              <h2 id="sales-heading">This Week&apos;s Sales</h2>
              <p>Grab the best deals before they run out</p>
            </div>
            <Link href="/shop?featured=sale" className="link-arrow">
              All deals <ArrowRight size={14} />
            </Link>
          </div>
          <div className="h-scroller">
            {onSale.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-label="Shop by category">
        <CategoryBanners categories={categories} />
      </section>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>New products are on the way</h2>
          <p>Our catalogue is being updated. Please check back soon.</p>
        </div>
      ) : (
        <HomeProductTabs
          products={items}
          categories={categories.map((category) => category.name)}
        />
      )}

      <section className="section app-cta" aria-labelledby="app-heading">
        <div>
          <h2 id="app-heading">Shop on the web or in the app</h2>
          <p>
            Same products, same account. Your wishlist, orders and delivery addresses stay in
            sync wherever you shop.
          </p>
        </div>
        <StoreBadges />
      </section>
    </div>
  );
}
