import type { Metadata } from 'next';

import { LegalPage } from '@/components/store/LegalPage';
import { storeConfig } from '@/lib/store-config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${storeConfig.name} collects, uses and protects personal information.`,
};

const lastUpdated = '26 October 2026';

export default function PrivacyPage() {
  return (
    <LegalPage
      kind="privacy"
      title="Privacy Policy"
      description="This policy explains what information we collect when you shop with us and how we use it to serve you."
      lastUpdated={lastUpdated}
      sections={[
        {
          id: 'information-we-collect',
          title: 'Information we collect',
          children: <>
            <p>We collect the information you provide when you create an account, place an order, save an address, contact support or request a return. This can include your name, email address, telephone number, delivery address and order details.</p>
            <p>We also keep limited technical information needed to run the site, such as your cart stored in your browser and basic service logs used for security and troubleshooting.</p>
          </>,
        },
        {
          id: 'how-we-use-information',
          title: 'How we use your information',
          children: <>
            <p>We use your information to process and deliver orders, provide order updates, answer support requests, manage returns and refunds, prevent fraud, and improve our store and customer service.</p>
            <p>We do not sell your personal information.</p>
          </>,
        },
        {
          id: 'payments-and-providers',
          title: 'Payments and service providers',
          children: <>
            <p>Online payments are processed by Paystack. We do not store your card details or Mobile Money PIN. Paystack and your payment provider handle payment authentication under their own policies.</p>
            <p>We use carefully selected service providers to operate the store, including account sign-in, hosting, email delivery and payment services. They receive only the information necessary to provide their service.</p>
          </>,
        },
        {
          id: 'sharing-information',
          title: 'When we share information',
          children: <>
            <p>We share the delivery details needed to fulfil your order with delivery partners. We may also disclose information where required to protect our customers, prevent fraud, comply with a legal obligation, or respond to a valid request from an authority.</p>
          </>,
        },
        {
          id: 'retention-and-security',
          title: 'Retention and security',
          children: <>
            <p>We keep information only for as long as it is reasonably needed for the purposes in this policy, including order records, support, accounting and dispute handling. We use reasonable technical and organisational safeguards to protect it, but no online service can guarantee absolute security.</p>
          </>,
        },
        {
          id: 'your-choices',
          title: 'Your choices and contact',
          children: <>
            <p>You may ask us to update your account or delivery details, or contact us with a privacy question. For help, call {storeConfig.supportPhone} or message us on WhatsApp. We may need to verify your identity before acting on a request.</p>
            <p>We may update this policy when our services or legal obligations change. The date at the top shows when it was last revised.</p>
          </>,
        },
      ]}
    />
  );
}
