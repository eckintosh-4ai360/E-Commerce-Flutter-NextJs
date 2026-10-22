import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  className?: string;
};

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <Image
      src="/logo.jpeg"
      width={777}
      height={601}
      sizes="48px"
      alt=""
      className={`brand__mark-image ${className}`.trim()}
    />
  );
}

export function BrandLogo({ href = '/', className = '' }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`brand ${className}`.trim()}
      aria-label="GlobaCart GH home"
    >
      <span className="brand__mark" aria-hidden="true">
        <BrandMark />
      </span>
      <span className="brand__word" aria-hidden="true">
        <span className="brand__global">Globa</span>
        <span className="brand__cart-word">Cart</span>
        <span className="brand__gh">GH</span>
      </span>
    </Link>
  );
}
