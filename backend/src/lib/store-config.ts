// Public store settings shared by the API, the website and emails. Nothing in
// this file is secret: it is bundled into the browser.

export const storeConfig = {
  name: 'GlobaCart GH',
  shortName: 'GlobaCart',
  tagline: 'Shop Global, Pay Local',
  description:
    'Global finds, local convenience and dependable delivery across Ghana.',
  currencyCode: 'GHS',
  currencySymbol: 'GH₵',
  maxQuantityPerLine: 20,
  maxLinesPerOrder: 50,
  maxSavedAddresses: 10,
  returnWindowDays: 14,
  supportPhone: '024 307 3148',
  supportPhoneHref: 'tel:+233243073148',
  secondaryPhone: '054 134 1263',
  secondaryPhoneHref: 'tel:+233541341263',
  whatsappHref: 'https://whatsapp.com/channel/0029VbCeBSQGU3BEzkzs2h2l',
  socials: [
    {
      label: 'Facebook',
      handle: 'GlobaCart GH',
      href: 'https://www.facebook.com/share/1d8ryVyhhK/',
    },
    {
      label: 'Instagram',
      handle: '@globacartgh',
      href: 'https://www.instagram.com/globacartgh?igsh=azVkNnBuamNidXI0',
    },
    {
      label: 'TikTok',
      handle: '@globacart.gh',
      href: 'https://www.tiktok.com/@globacart.gh',
    },
    {
      label: 'WhatsApp',
      handle: 'GlobaCart Channel',
      href: 'https://whatsapp.com/channel/0029VbCeBSQGU3BEzkzs2h2l',
    },
    {
      label: 'Telegram',
      handle: '@GlobaCart_GH',
      href: 'https://t.me/GlobaCart_GH',
    },
  ],
  appLinks: {
    android: process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim() || null,
    ios: process.env.NEXT_PUBLIC_IOS_APP_URL?.trim() || null,
  },
} as const;

export const ghanaRegions = [
  'Greater Accra',
  'Ashanti',
  'Central',
  'Eastern',
  'Western',
  'Western North',
  'Volta',
  'Oti',
  'Northern',
  'Savannah',
  'North East',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
] as const;

export const paymentOnDeliveryMethods = [
  {
    value: 'CASH_ON_DELIVERY',
    label: 'Payment on delivery',
    description: 'Pay the rider in cash or with Mobile Money when your order arrives.',
  },
] as const;

export const paymentMethods = [
  ...paymentOnDeliveryMethods,
  {
    value: 'PAYSTACK',
    label: 'Paystack online payment',
    description: 'Pay securely by card or Mobile Money through Paystack.',
  },
] as const;

export type PaymentMethodValue = (typeof paymentMethods)[number]['value'];

export function paymentMethodLabel(value: string) {
  // Preserve a clear label for orders created before cash and MoMo delivery
  // options were consolidated.
  if (value === 'MOBILE_MONEY') return 'Payment on delivery';
  return paymentMethods.find((method) => method.value === value)?.label ?? value;
}

export function paymentStatusLabel(value: string) {
  switch (value) {
    case 'PAID':
      return 'Paid';
    case 'PENDING':
      return 'Payment pending';
    case 'PAY_ON_DELIVERY':
      return 'Due on delivery';
    default:
      return value;
  }
}

export const returnReasons = [
  'Damaged or defective',
  'Wrong item received',
  'Not as described',
  'Size or fit issue',
  'Changed my mind',
  'Other',
] as const;

export const orderStatuses = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof orderStatuses)[number];

export const returnStatuses = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
] as const;

export type ReturnStatusValue = (typeof returnStatuses)[number];

// The Firebase web config identifies the project to the browser SDK. These are
// public identifiers, not credentials; access is enforced by the backend.
export const firebaseWebConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    'AIzaSyB0pzElFNXMNqBXDHasJnH5WSHhtsvfd7k',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    'commerce-80c74.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'commerce-80c74',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    '1:24986377031:web:f9cc0d83dcd7151968ca62',
};
