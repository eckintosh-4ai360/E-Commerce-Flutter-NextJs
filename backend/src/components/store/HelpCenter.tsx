'use client';

import { MessageCircle, Phone, Search, Truck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { storeFaqs as faqs } from '@/lib/faqs';
import { storeConfig } from '@/lib/store-config';

export function HelpCenter() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(needle) || faq.answer.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <>
      <div className="header-search" style={{ maxWidth: 'none', margin: '0 0 24px' }}>
        <Search size={18} aria-hidden="true" />
        <label htmlFor="faq-search" className="visually-hidden">
          Search for help
        </label>
        <input
          id="faq-search"
          type="search"
          placeholder="Search for help..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>Frequently Asked Questions</h2>
      <div className="faq" aria-live="polite">
        {results.length === 0 ? (
          <p className="muted">No answers match “{query}”. Contact us below and we will help.</p>
        ) : (
          results.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))
        )}
      </div>

      <h2 style={{ fontSize: 18, margin: '32px 0 12px' }}>Contact Support</h2>
      <div className="contact-grid">
        <a className="contact-tile" href={storeConfig.supportPhoneHref}>
          <Phone size={20} />
          <strong>Call our main line</strong>
          <span>{storeConfig.supportPhone}</span>
        </a>
        <a className="contact-tile" href={storeConfig.secondaryPhoneHref}>
          <Phone size={20} />
          <strong>Call our second line</strong>
          <span>{storeConfig.secondaryPhone}</span>
        </a>
        <a className="contact-tile" href={storeConfig.whatsappHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={20} />
          <strong>WhatsApp us</strong>
          <span>{storeConfig.supportPhone}</span>
        </a>
        <Link className="contact-tile" href="/track">
          <Truck size={20} />
          <strong>Track an order</strong>
          <span>Check your delivery status</span>
        </Link>
      </div>
    </>
  );
}
