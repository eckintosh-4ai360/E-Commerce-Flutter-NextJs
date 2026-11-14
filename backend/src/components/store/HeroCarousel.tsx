'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { formatPrice } from '@/lib/money';
import { storeConfig } from '@/lib/store-config';

import { ProductImage } from './ProductImage';

type HeroProduct = {
  id: number;
  name: string;
  image: string;
  category: string;
  price: number;
  isNew: boolean;
};

export function HeroCarousel({ products }: { products: HeroProduct[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const slideCount = products.length + 1;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (slideCount < 2 || hovered || focused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slideCount);
    }, 5_500);
    return () => window.clearInterval(timer);
  }, [slideCount, hovered, focused, reducedMotion]);

  const activeProduct = activeIndex === 0 ? null : products[activeIndex - 1];
  const goTo = (index: number) => setActiveIndex((index + slideCount) % slideCount);

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <Link
        key={activeProduct?.id ?? 'brand'}
        href={activeProduct ? `/product/${activeProduct.id}` : '/shop'}
        className={`hero-carousel__slide${activeProduct ? '' : ' hero-carousel__slide--brand'}`}
        aria-label={activeProduct ? `View ${activeProduct.name}` : `Shop ${storeConfig.name}`}
      >
        <span className="hero-carousel__media">
          {activeProduct ? (
            <ProductImage
              src={activeProduct.image}
              alt={activeProduct.name}
              sizes="(min-width: 900px) 40vw, (min-width: 600px) 60vw, 85vw"
            />
          ) : (
            <Image
              src="/logo.jpeg"
              alt={storeConfig.name}
              fill
              loading="eager"
              sizes="(min-width: 900px) 40vw, (min-width: 600px) 60vw, 85vw"
            />
          )}
        </span>
        <span className="hero-carousel__caption">
          <span className="hero-carousel__details">
            <span className="hero-carousel__eyebrow">
              {activeProduct ? (activeProduct.isNew ? 'New arrival' : activeProduct.category) : 'Explore our store'}
            </span>
            <strong>{activeProduct?.name ?? 'Discover your next find'}</strong>
          </span>
          {activeProduct ? <span className="hero-carousel__price">{formatPrice(activeProduct.price)}</span> : null}
        </span>
      </Link>

      {slideCount > 1 ? (
        <div className="hero-carousel__controls" role="group" aria-label="Choose a slide">
          <button type="button" className="hero-carousel__arrow" aria-label="Previous slide" onClick={() => goTo(activeIndex - 1)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <div className="hero-carousel__dots">
            {Array.from({ length: slideCount }, (_, index) => (
              <button
                key={index}
                type="button"
                className={`hero-carousel__dot${activeIndex === index ? ' is-active' : ''}`}
                aria-label={index === 0 ? 'Show store logo' : `Show ${products[index - 1].name}`}
                aria-current={activeIndex === index ? 'true' : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
          <button type="button" className="hero-carousel__arrow" aria-label="Next slide" onClick={() => goTo(activeIndex + 1)}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
