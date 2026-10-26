import type { Metadata } from 'next';

import { LegalPage } from '@/components/store/LegalPage';
import { storeConfig } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: `The terms for shopping with ${storeConfig.name}.`,
};

const lastUpdated = '26 October 2026';

export default function TermsPage() {
  return (
    <LegalPage
      kind="terms"
      title="Terms & Conditions"
      description="These terms explain the basics of shopping, payment, delivery and returns with GlobaCart GH."
      lastUpdated={lastUpdated}
      sections={[
        {
          id: 'using-our-store',
          title: 'Using our store',
          children: <>
            <p>By using GlobaCart GH, you agree to use the store lawfully and provide accurate, current information when you create an account or place an order. You are responsible for keeping access to your account secure.</p>
          </>,
        },
        {
          id: 'products-prices-and-stock',
          title: 'Products, prices and stock',
          children: <>
            <p>We aim to keep product descriptions, prices, images and stock availability accurate. Product colours and details may appear differently depending on your device. Prices and availability can change before an order is confirmed.</p>
            <p>If a product becomes unavailable or an order needs correction, we will contact you using the details you provided.</p>
          </>,
        },
        {
          id: 'orders-and-payment',
          title: 'Orders and payment',
          children: <>
            <p>An order is subject to acceptance and stock availability. Paystack payments are complete only when Paystack confirms them. For payment on delivery, payment is due when the order arrives.</p>
            <p>Do not share your payment PIN, OTP or card details with anyone claiming to represent GlobaCart GH.</p>
          </>,
        },
        {
          id: 'delivery',
          title: 'Delivery and shipping fees',
          children: <>
            <p>Delivery estimates depend on your location and the availability of the items in your order. Shipping fees are set per product and shown in your cart and at checkout. A product with no listed shipping fee includes shipping at no additional charge.</p>
            <p>Please provide a reachable telephone number and accurate delivery address. We may contact you to coordinate delivery.</p>
          </>,
        },
        {
          id: 'cancellations-returns',
          title: 'Cancellations, returns and refunds',
          children: <>
            <p>You can request cancellation while an order is still pending. Return requests may be made within {storeConfig.returnWindowDays} days of delivery for eligible items in their original condition and packaging. Review the order in your account to start a request.</p>
            <p>Approved refunds are handled using the appropriate payment method and may take time to appear, depending on the payment provider.</p>
          </>,
        },
        {
          id: 'updates-and-contact',
          title: 'Updates and contact',
          children: <>
            <p>We may update these terms to reflect changes to our store or services. Continued use after an update means you accept the revised terms.</p>
            <p>For any question about an order or these terms, call {storeConfig.supportPhone} or message us on WhatsApp.</p>
          </>,
        },
      ]}
    />
  );
}
