import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Eckintoshmall Backend',
  description: 'Next.js API for catalog and order workflows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
