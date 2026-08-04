import { AlertCircle, CheckCircle, Clock, RotateCcw, Truck, XCircle, type LucideIcon } from 'lucide-react';

export const statusColors: Record<string, string> = {
  PENDING: '#facc15',
  PROCESSING: '#60a5fa',
  SHIPPED: '#a78bfa',
  DELIVERED: '#4ade80',
  CANCELLED: '#f87171',
  REQUESTED: '#facc15',
  APPROVED: '#60a5fa',
  REJECTED: '#f87171',
  REFUNDED: '#4ade80',
};

export const statusIcons: Record<string, LucideIcon> = {
  PENDING: Clock,
  PROCESSING: AlertCircle,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
  REQUESTED: RotateCcw,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  REFUNDED: CheckCircle,
};

export function StatusBadge({ status }: { status: string }) {
  const Icon = statusIcons[status] ?? Clock;
  return (
    <span
      className="admin-pill"
      style={{ ['--pill-color' as string]: statusColors[status] ?? '#a0a0a0' }}
    >
      <Icon size={12} /> {status}
    </span>
  );
}
