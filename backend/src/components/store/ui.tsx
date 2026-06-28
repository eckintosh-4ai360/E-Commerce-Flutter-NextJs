import { Check, Clock, PackageCheck, Star, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

import { discountPercent, formatPrice } from '@/lib/money';
import type { OrderStatus } from '@/lib/types';

export function RatingStars({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const filled = Math.round(rating);
  return (
    <span className="rating">
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            size={15}
            fill={value <= filled ? 'currentColor' : 'none'}
            strokeWidth={1.6}
          />
        ))}
      </span>
      <span>
        {rating.toFixed(1)}
        {reviewCount !== undefined ? ` (${reviewCount} reviews)` : ''}
      </span>
      <span className="visually-hidden">Rated {rating.toFixed(1)} out of 5</span>
    </span>
  );
}

export function PriceRow({
  price,
  originalPrice,
}: {
  price: number;
  originalPrice: number | null;
}) {
  const hasDiscount = discountPercent(price, originalPrice) !== null;
  return (
    <div className="price-row">
      <span className="price">{formatPrice(price)}</span>
      {hasDiscount && originalPrice !== null ? (
        <span className="price--was">
          <span className="visually-hidden">Was </span>
          {formatPrice(originalPrice)}
        </span>
      ) : null}
    </div>
  );
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REFUNDED: 'Refunded',
};

export function statusLabel(status: string) {
  return statusLabels[status] ?? status;
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-pill--${status}`}>{statusLabel(status)}</span>;
}

const steps: Array<{ status: OrderStatus; label: string; icon: ReactNode }> = [
  { status: 'PENDING', label: 'Placed', icon: <Clock size={15} /> },
  { status: 'PROCESSING', label: 'Processing', icon: <PackageCheck size={15} /> },
  { status: 'SHIPPED', label: 'Shipped', icon: <Truck size={15} /> },
  { status: 'DELIVERED', label: 'Delivered', icon: <Check size={15} /> },
];

export function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return null;
  }
  const current = steps.findIndex((step) => step.status === status);
  return (
    <ol className="stepper" aria-label="Order progress">
      {steps.map((step, index) => (
        <li
          key={step.status}
          className={`stepper__step${index <= current ? ' is-done' : ''}`}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="stepper__dot">{step.icon}</span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="center-block" role="status">
      <div className="spinner" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
