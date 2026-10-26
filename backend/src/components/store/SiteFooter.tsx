import Link from 'next/link';

import { storeConfig } from '@/lib/store-config';

import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from './brand-icons';
import { BrandLogo } from './BrandLogo';
import { StoreBadges } from './StoreBadges';

const socialIcons = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  WhatsApp: WhatsAppIcon,
  Telegram: TelegramIcon,
} as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <BrandLogo className="brand--footer" />
            <p className="muted small" style={{ maxWidth: 320 }}>
              {storeConfig.description} {storeConfig.tagline}.
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
                    title={`${social.label}: ${social.handle}`}
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
              <li><Link href="/privacy">Privacy policy</Link></li>
              <li><Link href="/terms">Terms &amp; conditions</Link></li>
              <li><a href={storeConfig.supportPhoneHref}>Call {storeConfig.supportPhone}</a></li>
              <li><a href={storeConfig.secondaryPhoneHref}>Call {storeConfig.secondaryPhone}</a></li>
              <li><a href={storeConfig.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp us</a></li>
            </ul>
          </div>
          <div>
            <h3>Get the app</h3>
            <StoreBadges />
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {storeConfig.name}. {storeConfig.tagline}.
        </div>
      </div>
    </footer>
  );
}
