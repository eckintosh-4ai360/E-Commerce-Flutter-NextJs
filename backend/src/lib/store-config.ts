// Public store settings shared by the API, the website and emails. Nothing in
// this file is secret: it is bundled into the browser.

export const storeConfig = {
  name: 'Eckintosh Mall',
  shortName: 'Eckintosh',
  tagline: 'Leather Bags & Accessories',
  description:
    'Premium leather bags, wallets, watches and accessories delivered across Ghana.',
  currencyCode: 'GHS',
  currencySymbol: 'GH₵',
  freeShippingThreshold: 300,
  flatShippingFee: 25,
  maxQuantityPerLine: 20,
  maxLinesPerOrder: 50,
  maxSavedAddresses: 10,
  returnWindowDays: 14,
  supportPhone: '+233 59 859 9687',
  supportPhoneHref: 'tel:+233598599687',
  supportEmail: 'info@eckintoshmall.com',
  socials: [
    {
      label: 'Instagram',
      handle: '@Eckintoshmall',
      href: 'https://www.instagram.com/eckintoshmall',
    },
    {
      label: 'Facebook',
      handle: 'Eckintoshmall',
      href: 'https://www.facebook.com/eckintoshmall',
    },
    {
      label: 'Twitter',
      handle: '@Eckintosh_mall',
      href: 'https://x.com/Eckintosh_mall',
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

export const paymentMethods = [
  {
    value: 'CASH_ON_DELIVERY',
    label: 'Cash on delivery',
    description: 'Pay the rider in cash when your order arrives.',
  },
  {
    value: 'MOBILE_MONEY',
    label: 'Mobile Money on delivery',
    description: 'Pay with MTN, Telecel or AirtelTigo MoMo when your order arrives.',
  },
] as const;

export type PaymentMethodValue = (typeof paymentMethods)[number]['value'];

export function paymentMethodLabel(value: string) {
  return paymentMethods.find((method) => method.value === value)?.label ?? value;
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

export function shippingFeeFor(subtotal: number) {
  return subtotal >= storeConfig.freeShippingThreshold
    ? 0
    : storeConfig.flatShippingFee;
}

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
