import { AlertCircle, CheckCircle, Clock, RotateCcw, Truck, XCircle, type LucideIcon } from 'lucide-react';

export const statusColors: Record<string, string> = {
  PENDING: '#9a5b00',
  PROCESSING: '#2563c9',
  SHIPPED: '#7551b5',
  DELIVERED: '#167a3f',
  CANCELLED: '#c43d3d',
  REQUESTED: '#9a5b00',
  APPROVED: '#2563c9',
  REJECTED: '#c43d3d',
  REFUNDED: '#167a3f',
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
      style={{ ['--pill-color' as string]: statusColors[status] ?? '#5c6b82' }}
    >
      <Icon size={12} /> {status}
    </span>
  );
}
