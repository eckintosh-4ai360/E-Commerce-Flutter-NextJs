import type { ReactNode } from 'react';

import { storeConfig } from '@/lib/store-config';

import { AndroidIcon, AppleIcon } from './brand-icons';

/** Download buttons for the mobile app. Unconfigured platforms show "coming soon". */
export function StoreBadges() {
  const { android, ios } = storeConfig.appLinks;

  const badge = (href: string | null, icon: ReactNode, small: string, label: string) =>
    href ? (
      <a className="store-badge" href={href} target="_blank" rel="noopener noreferrer">
        {icon}
        <span>
          <small>{small}</small>
          <strong>{label}</strong>
        </span>
      </a>
    ) : (
      <span className="store-badge" aria-disabled="true">
        {icon}
        <span>
          <small>Coming soon</small>
          <strong>{label}</strong>
        </span>
      </span>
    );

  return (
    <div className="store-badges">
      {badge(android, <AndroidIcon />, 'Get it for', 'Android')}
      {badge(ios, <AppleIcon />, 'Download for', 'iPhone')}
    </div>
  );
}
