import { storeConfig } from './store-config';

export interface StoreFaq {
  question: string;
  answer: string;
}

export const storeFaqs: StoreFaq[] = [
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
    answer:
      'Shipping is set per product. Any applicable fee is shown on the product, in your cart, and at checkout; products with no fee include shipping.',
  },
  {
    question: 'How do I pay?',
    answer:
      'At checkout, pay online by card or Mobile Money through Paystack. We never store your card details or Mobile Money PIN.',
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
