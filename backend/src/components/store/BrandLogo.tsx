import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  className?: string;
};

/** Compact vector interpretation of the supplied globe, cart and wordmark. */
export function BrandLogo({ href = '/', className = '' }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`brand ${className}`.trim()}
      aria-label="GlobalCart GH home"
    >
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="presentation">
          <circle cx="17" cy="13" r="8" />
          <path d="M9 13h16M17 5c-2.5 2.4-3.5 5-3.5 8s1 5.6 3.5 8M17 5c2.5 2.4 3.5 5 3.5 8" />
          <path className="brand__cart" d="M3 8h3l2.4 13h14.2l2.1-8H8" />
          <circle className="brand__wheel" cx="11" cy="25.5" r="1.5" />
          <circle className="brand__wheel" cx="21" cy="25.5" r="1.5" />
        </svg>
      </span>
      <span className="brand__word" aria-hidden="true">
        <span className="brand__global">Global</span>
        <span className="brand__cart-word">Cart</span>
        <span className="brand__gh">GH</span>
      </span>
    </Link>
  );
}
