'use client';

import { ImageOff } from 'lucide-react';
import Image, { type ImageLoaderProps } from 'next/image';
import { useState } from 'react';

const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

// Cloudinary resizes and picks the best format itself, so the Next.js
// optimiser is skipped for those URLs.
function cloudinaryLoader({ src, width }: ImageLoaderProps) {
  return src.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

type ProductImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
};

export function ProductImage({ src, alt, sizes, priority = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: '#9e9e9e',
        }}
      >
        <ImageOff size={32} />
      </div>
    );
  }

  const isCloudinary = cloudinaryPattern.test(src);
  const isLocal = src.startsWith('/');

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loader={isCloudinary ? cloudinaryLoader : undefined}
      unoptimized={!isCloudinary && !isLocal}
      onError={() => setFailed(true)}
    />
  );
}
