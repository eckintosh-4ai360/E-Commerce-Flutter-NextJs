'use client';

import {
  ChevronRight,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  MapPin,
  Phone,
  Receipt,
  RotateCcw,
  Smartphone,
  Truck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { storeConfig } from '@/lib/store-config';

import { Avatar } from '../Avatar';
import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from '../brand-icons';

type MenuItem = {
  icon: ReactNode;
  label: string;
  href: string;
  external?: boolean;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section className="menu-section">
      <h3>{title}</h3>
      <div className="menu-list">
        {items.map((item) =>
          item.external ? (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              <ChevronRight size={16} color="#9e9e9e" />
            </a>
          ) : (
            <Link key={item.label} href={item.href}>
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              <ChevronRight size={16} color="#9e9e9e" />
            </Link>
          ),
        )}
      </div>
    </section>
  );
}

export function AccountView() {
  const { user, status, busy, signIn, signOut, error, authedFetch } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const uid = user?.uid ?? null;

  useEffect(() => {
    setIsAdmin(false);
    if (!uid) {
      return;
    }
    authedFetch<{ isAdmin: boolean }>('/api/me')
      .then((response) => setIsAdmin(response.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [uid, authedFetch]);

  const shopping: MenuItem[] = [
    { icon: <Receipt size={18} />, label: 'My Orders', href: '/account/orders' },
    { icon: <Truck size={18} />, label: 'Track Order', href: '/track' },
    { icon: <RotateCcw size={18} />, label: 'Returns & Refunds', href: '/account/returns' },
  ];
  const account: MenuItem[] = [
    { icon: <User size={18} />, label: 'Edit Profile', href: '/account/profile' },
    { icon: <MapPin size={18} />, label: 'Delivery Addresses', href: '/account/addresses' },
    { icon: <CreditCard size={18} />, label: 'Payment Methods', href: '/account/payment' },
  ];
  const support: MenuItem[] = [
    { icon: <Phone size={18} />, label: `Call: ${storeConfig.supportPhone}`, href: storeConfig.supportPhoneHref, external: true },
    { icon: <Phone size={18} />, label: `Call: ${storeConfig.secondaryPhone}`, href: storeConfig.secondaryPhoneHref, external: true },
    { icon: <MessageCircle size={18} />, label: `WhatsApp: ${storeConfig.supportPhone}`, href: storeConfig.whatsappHref, external: true },
    { icon: <CircleHelp size={18} />, label: 'FAQ & Help Center', href: '/help' },
  ];
  const socialIcons = {
    Facebook: <FacebookIcon />,
    Instagram: <InstagramIcon />,
    TikTok: <TikTokIcon />,
    WhatsApp: <WhatsAppIcon />,
    Telegram: <TelegramIcon />,
  } as const;
  const follow: MenuItem[] = storeConfig.socials.map((social) => ({
    icon: socialIcons[social.label],
    label: `${social.label} ${social.handle}`,
    href: social.href,
    external: true,
  }));

  return (
    <div className="container">
      <div className="account-layout">
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="profile-card">
            {user ? <Avatar user={user} /> : <span className="avatar"><User size={28} /></span>}
            <div style={{ minWidth: 0 }}>
              <h2>{user ? user.displayName ?? user.email : 'Welcome!'}</h2>
              <p>
                {user
                  ? user.email
                  : 'Sign in for personalised checkout and tracking emails'}
              </p>
              {status === 'loading' ? null : user ? (
                <button type="button" className="btn btn-sm" style={{ background: '#fff', color: '#001a3a' }} onClick={() => void signOut()} disabled={busy}>
                  {busy ? 'Please wait' : 'Sign out'}
                </button>
              ) : (
                <button type="button" className="btn btn-accent btn-sm" onClick={() => void signIn()} disabled={busy}>
                  {busy ? 'Please wait' : 'Sign in with Google'}
                </button>
              )}
            </div>
          </div>
          {error ? <div className="alert alert--error" role="alert">{error}</div> : null}

          <Link href="/track" className="track-cta">
            <Truck size={28} color="#0b4aa2" />
            <span style={{ flex: 1 }}>
              <strong>Track Your Order</strong>
              <span>Enter your tracking code to follow your delivery</span>
            </span>
            <ChevronRight size={18} />
          </Link>

          {isAdmin ? (
            <Link href="/admin" className="track-cta" style={{ background: '#001a3a', color: '#fff', borderColor: '#001a3a' }}>
              <LayoutDashboard size={26} color="#ffb000" />
              <span style={{ flex: 1 }}>
                <strong>Store admin</strong>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>Manage products, orders and returns</span>
              </span>
              <ChevronRight size={18} />
            </Link>
          ) : null}
        </div>

        <div className="menu-sections">
          <MenuSection title="Shopping" items={shopping} />
          <MenuSection title="Account" items={account} />
          <MenuSection title="Support" items={support} />
          <MenuSection title="Follow us" items={follow} />
          <MenuSection
            title="Get the app"
            items={[{ icon: <Smartphone size={18} />, label: 'Download the GlobaCart app', href: '/get-the-app' }]}
          />
          <p className="small muted" style={{ textAlign: 'center', margin: '8px 0 0' }}>
            Shop Global, Pay Local — delivered across Ghana.
          </p>
        </div>
      </div>
    </div>
  );
}
