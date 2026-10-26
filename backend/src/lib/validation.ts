import { z } from 'zod';

import {
  orderStatuses,
  paymentOnDeliveryMethods,
  paymentMethods,
  returnReasons,
  returnStatuses,
  storeConfig,
} from './store-config';

const paymentMethodValues = paymentMethods.map((method) => method.value) as [
  (typeof paymentMethods)[number]['value'],
  ...(typeof paymentMethods)[number]['value'][],
];

const paymentPreferenceValues = paymentOnDeliveryMethods.map((method) => method.value) as [
  (typeof paymentOnDeliveryMethods)[number]['value'],
  ...(typeof paymentOnDeliveryMethods)[number]['value'][],
];

function text(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);
}

function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .nullish()
    .transform((value) => (value ? value : null));
}

export const phoneSchema = z
  .string({ error: 'Phone number is required.' })
  .trim()
  .transform((value) => value.replace(/\s+/g, ' '))
  .refine(
    (value) =>
      /^\+?[0-9 ()-]{7,20}$/.test(value) && value.replace(/\D/g, '').length >= 7,
    'Enter a valid phone number, e.g. 059 859 9687.',
  );

const optionValue = z
  .string()
  .trim()
  .max(40, 'Option values must be at most 40 characters.')
  .nullish()
  .transform((value) => (value ? value : null));

export const createOrderSchema = z.object({
  customerName: text('Full name', 2, 100),
  customerPhone: phoneSchema,
  deliveryAddress: text('Delivery address', 5, 300),
  notes: optionalText('Order notes', 500),
  paymentMethod: z
    .enum(paymentMethodValues, { error: 'Choose a valid payment method.' })
    .default('CASH_ON_DELIVERY'),
  expectedTotal: z.number().nonnegative().finite().optional(),
  items: z
    .array(
      z.object({
        productId: z
          .number({ error: 'Each item needs a product id.' })
          .int()
          .positive(),
        quantity: z
          .number()
          .int('Quantities must be whole numbers.')
          .min(1, 'Quantities must be at least 1.')
          .max(
            storeConfig.maxQuantityPerLine,
            `You can order at most ${storeConfig.maxQuantityPerLine} of one item.`,
          )
          .default(1),
        selectedColor: optionValue,
        selectedSize: optionValue,
      }),
      { error: 'At least one cart item is required.' },
    )
    .min(1, 'At least one cart item is required.')
    .max(
      storeConfig.maxLinesPerOrder,
      `An order can contain at most ${storeConfig.maxLinesPerOrder} lines.`,
    ),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateProfileSchema = z.object({
  name: text('Name', 2, 100).optional(),
  phone: z
    .union([phoneSchema, z.literal('').transform(() => null), z.null()])
    .optional(),
  preferredPaymentMethod: z
    .enum(paymentPreferenceValues, { error: 'Choose a valid payment method.' })
    .optional(),
});

export const addressSchema = z.object({
  label: text('Label', 1, 40),
  recipientName: text('Recipient name', 2, 100),
  phone: phoneSchema,
  street: text('Street address', 3, 200),
  city: text('City or town', 2, 80),
  region: text('Region', 2, 80),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const wishlistAddSchema = z.object({
  productIds: z
    .array(z.number().int().positive())
    .max(200, 'Too many wishlist items in one request.'),
});

export const createReturnSchema = z.object({
  orderId: text('Order', 1, 64),
  reason: z.enum(returnReasons, { error: 'Choose a reason for the return.' }),
  details: optionalText('Details', 1000),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses, {
    error: `Status must be one of: ${orderStatuses.join(', ')}`,
  }),
  note: optionalText('Note', 300),
});

export const updateReturnSchema = z.object({
  status: z.enum(returnStatuses, {
    error: `Status must be one of: ${returnStatuses.join(', ')}`,
  }),
  adminNote: optionalText('Note', 500),
});

const listOfLabels = (label: string) =>
  z
    .array(z.string().trim().min(1).max(40, `${label} must be at most 40 characters.`))
    .max(30, `At most 30 ${label.toLowerCase()} are allowed.`)
    .transform((values) => Array.from(new Set(values)));

const imagePathSchema = z
  .string({ error: 'A product image is required.' })
  .trim()
  .min(1, 'A product image is required.')
  .max(500)
  .refine(
    (value) =>
      (value.startsWith('/') && !value.startsWith('//') && !value.includes('..')) ||
      /^https:\/\/[^\s"'<>]+$/.test(value),
    'Image must be an uploaded image, an https:// URL or a /products/ path.',
  );

const galleryImagesSchema = z
  .array(imagePathSchema)
  .max(4, 'A product can have at most 5 images including the main image.')
  .transform((values) => Array.from(new Set(values)));

const productFields = {
  name: text('Product name', 2, 120),
  description: text('Description', 1, 2000),
  price: z
    .number({ error: 'Price must be a number.' })
    .positive('Price must be greater than zero.')
    .max(1_000_000),
  shippingFee: z
    .number({ error: 'Shipping fee must be a number.' })
    .min(0, 'Shipping fee cannot be negative.')
    .max(1_000_000, 'Shipping fee is too large.'),
  originalPrice: z
    .number()
    .positive('Original price must be greater than zero.')
    .max(1_000_000)
    .nullable()
    .optional(),
  imagePath: imagePathSchema,
  galleryImages: galleryImagesSchema,
  category: text('Category', 1, 60),
  tags: listOfLabels('Tags'),
  rating: z.number().min(0, 'Rating must be between 0 and 5.').max(5, 'Rating must be between 0 and 5.'),
  reviewCount: z.number().int().min(0).max(10_000_000),
  stockQuantity: z
    .number({ error: 'Stock quantity must be a number.' })
    .int('Stock quantity must be a whole number.')
    .min(0, 'Stock quantity cannot be negative.')
    .max(10_000_000, 'Stock quantity is too large.'),
  sizes: listOfLabels('Sizes'),
  colors: listOfLabels('Colors'),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  isArchived: z.boolean(),
};

function originalPriceAbovePrice(value: {
  price?: number;
  originalPrice?: number | null;
}) {
  return (
    value.originalPrice === null ||
    value.originalPrice === undefined ||
    value.price === undefined ||
    value.originalPrice > value.price
  );
}

const originalPriceMessage = {
  message: 'Original price must be higher than the selling price, or left empty.',
  path: ['originalPrice'],
};

export function productImagesAreDistinct(value: {
  imagePath?: string;
  galleryImages?: string[];
}) {
  return (
    value.imagePath === undefined ||
    value.galleryImages === undefined ||
    !value.galleryImages.includes(value.imagePath)
  );
}

const distinctProductImagesMessage = {
  message: 'The main image cannot also be included in the additional images.',
  path: ['galleryImages'],
};

export const createProductSchema = z
  .object({
    ...productFields,
    galleryImages: productFields.galleryImages.default([]),
    tags: productFields.tags.default([]),
    sizes: productFields.sizes.default([]),
    colors: productFields.colors.default([]),
    shippingFee: productFields.shippingFee.default(0),
    rating: productFields.rating.default(4.5),
    reviewCount: productFields.reviewCount.default(0),
    stockQuantity: productFields.stockQuantity.default(0),
    isNew: productFields.isNew.default(false),
    isBestSeller: productFields.isBestSeller.default(false),
    isArchived: productFields.isArchived.default(false),
  })
  .refine(originalPriceAbovePrice, originalPriceMessage)
  .refine(productImagesAreDistinct, distinctProductImagesMessage);

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine(productImagesAreDistinct, distinctProductImagesMessage);

export function assertOriginalPriceAbovePrice(value: {
  price?: number;
  originalPrice?: number | null;
}) {
  return originalPriceAbovePrice(value);
}
