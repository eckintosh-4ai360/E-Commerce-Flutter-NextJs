import Link from 'next/link';

import { storeConfig } from '@/lib/store-config';

import { FacebookIcon, InstagramIcon, XIcon } from './brand-icons';
import { StoreBadges } from './StoreBadges';

const socialIcons = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  Twitter: XIcon,
} as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" aria-label="Eckintosh Mall home">
              <span className="brand__mark" aria-hidden="true">
                E
              </span>
              <span className="brand__word" style={{ display: 'inline' }}>
                ECKINTOSH
              </span>
            </Link>
            <p className="muted small" style={{ maxWidth: 320 }}>
              {storeConfig.description} Shop here on the web or in our mobile app — your
              account, wishlist and orders follow you everywhere.
            </p>
            <div className="social-row">
              {storeConfig.socials.map((social) => {
                const Icon = socialIcons[social.label as keyof typeof socialIcons];
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} ${social.handle}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <h3>Shop</h3>
            <ul>
              <li><Link href="/shop">All products</Link></li>
              <li><Link href="/shop?featured=new">New arrivals</Link></li>
              <li><Link href="/shop?featured=best">Best sellers</Link></li>
              <li><Link href="/shop?featured=sale">On sale</Link></li>
            </ul>
          </div>
          <div>
            <h3>Help</h3>
            <ul>
              <li><Link href="/track">Track an order</Link></li>
              <li><Link href="/account/returns">Returns &amp; refunds</Link></li>
              <li><Link href="/help">FAQ &amp; help centre</Link></li>
              <li><a href={storeConfig.supportPhoneHref}>Call {storeConfig.supportPhone}</a></li>
              <li><a href={`mailto:${storeConfig.supportEmail}`}>{storeConfig.supportEmail}</a></li>
            </ul>
          </div>
          <div>
            <h3>Get the app</h3>
            <StoreBadges />
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {storeConfig.name}. Delivered across Ghana.
        </div>
      </div>
    </footer>
  );
}
