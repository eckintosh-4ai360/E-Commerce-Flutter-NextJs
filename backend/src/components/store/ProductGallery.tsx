'use client';

import { useState } from 'react';

import { ProductImage } from './ProductImage';

type ProductGalleryProps = {
  images: string[];
  productName: string;
  discount: number | null;
  isNew: boolean;
};

export function ProductGallery({
  images,
  productName,
  discount,
  isNew,
}: ProductGalleryProps) {
  const availableImages = images.filter(Boolean).slice(0, 5);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = availableImages[selectedIndex] ?? availableImages[0];

  return (
    <div className="pdp__gallery-column">
      <div className="pdp__gallery">
        <ProductImage
          key={selectedImage}
          src={selectedImage}
          alt={
            availableImages.length > 1
              ? `${productName}, view ${selectedIndex + 1}`
              : productName
          }
          priority
          sizes="(min-width: 900px) 600px, 100vw"
        />
        {discount !== null ? (
          <span className="badge badge--sale">{discount}% OFF</span>
        ) : isNew ? (
          <span className="badge badge--new">NEW</span>
        ) : null}
      </div>

      {availableImages.length > 1 ? (
        <div className="pdp__thumbnails" aria-label="Product image gallery">
          {availableImages.map((image, index) => (
            <button
              key={image}
              type="button"
              className="pdp__thumbnail"
              aria-label={`Show ${productName} image ${index + 1}`}
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
            >
              <ProductImage
                src={image}
                alt=""
                sizes="80px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
