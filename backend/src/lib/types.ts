// Shapes returned by the public API. Safe to import from client components.

export type StoreProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  /** Per-item delivery fee. Zero means shipping is included for this product. */
  shippingFee: number;
  originalPrice: number | null;
  images: string[];
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sizes: string[];
  colors: string[];
  isNew: boolean;
  isBestSeller: boolean;
};

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'MOBILE_MONEY' | 'PAYSTACK';

export type PaymentStatus = 'PAY_ON_DELIVERY' | 'PENDING' | 'PAID';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export type OrderItemView = {
  id: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedColor: string | null;
  selectedSize: string | null;
  imageUrl: string | null;
};

export type OrderEventView = {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
};

export type ReturnRequestView = {
  id: string;
  orderId: string;
  trackingCode: string;
  reason: string;
  details: string | null;
  status: ReturnStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderView = {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paidAt: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  items: OrderItemView[];
  events: OrderEventView[];
  /** True when the response was redacted for a public tracking lookup. */
  isRedacted: boolean;
  canCancel: boolean;
  canRequestReturn: boolean;
  returnRequests: ReturnRequestView[];
};

export type AddressView = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  isDefault: boolean;
};

export type CustomerProfile = {
  uid: string;
  email: string;
  name: string | null;
  phone: string | null;
  preferredPaymentMethod: PaymentMethod;
};
