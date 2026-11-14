import type { Metadata } from 'next';

import { HelpCenter } from '@/components/store/HelpCenter';
import { storeFaqs } from '@/lib/faqs';
import { getSiteBaseUrl } from '@/lib/http';
import { storeConfig } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'FAQ & Help Center',
  description: `Answers about delivery fees, online Paystack payment, returns and order tracking at ${storeConfig.name}.`,
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: `FAQ & Help Center · ${storeConfig.name}`,
    description: `Answers about delivery fees, online Paystack payment, returns and order tracking at ${storeConfig.name}.`,
    url: '/help',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `FAQ & Help Center · ${storeConfig.name}`,
    description: `Answers about delivery fees, online Paystack payment, returns and order tracking at ${storeConfig.name}.`,
  },
};

export default function HelpPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: storeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="container narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />
      <h1 className="page-title">FAQ &amp; Help Center</h1>
      <p className="page-subtitle">Find answers fast, or reach our team directly.</p>
      <HelpCenter />
    </div>
  );
}
