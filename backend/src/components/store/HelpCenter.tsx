'use client';

import { MessageCircle, Phone, Search, Truck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { storeConfig } from '@/lib/store-config';

const faqs = [
  {
    question: 'How do I track my order?',
    answer: `Go to Track Order (on the website or in the app's Account tab) and enter the 10-character tracking code from your confirmation email. Signed-in customers can also open My Orders to see every order.`,
  },
  {
    question: 'What is the return policy?',
    answer: `We offer a ${storeConfig.returnWindowDays}-day return policy for unused items in their original packaging. Request a return from Account → Returns & Refunds once your order has been delivered.`,
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Delivery within Accra typically takes 1-2 business days. Outside Accra it may take 3-5 business days.',
  },
  {
    question: 'How much is shipping?',
    answer: 'Shipping is set per product. Any applicable fee is shown on the product, in your cart, and at checkout; products with no fee include shipping.',
  },
  {
    question: 'How do I pay?',
    answer:
      'At checkout, choose Payment on delivery to pay in cash or with Mobile Money, or use Paystack to pay online by card or Mobile Money. We never store your card details.',
  },
  {
    question: 'Can I cancel my order?',
    answer:
      'Yes, while it is still pending. Open the order in My Orders and choose Cancel order. Once we start processing it, contact support and we will help.',
  },
  {
    question: 'Do I need an account to shop?',
    answer:
      'You can browse and fill your cart without one. To place an order, sign in with Google so we can email your confirmation and tracking updates.',
  },
  {
    question: 'Is my wishlist the same on the website and in the app?',
    answer:
      'Yes. When you are signed in, your wishlist, saved addresses and orders are linked to your account and appear on both.',
  },
];

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
