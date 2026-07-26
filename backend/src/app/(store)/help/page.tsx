import type { Metadata } from 'next';

import { HelpCenter } from '@/components/store/HelpCenter';

export const metadata: Metadata = {
  title: 'FAQ & Help Center',
  description: 'Answers about delivery, payment, returns and order tracking at Eckintosh Mall.',
};

export default function HelpPage() {
  return (
    <div className="container narrow">
      <h1 className="page-title">FAQ &amp; Help Center</h1>
      <p className="page-subtitle">Find answers fast, or reach our team directly.</p>
      <HelpCenter />
    </div>
  );
}
