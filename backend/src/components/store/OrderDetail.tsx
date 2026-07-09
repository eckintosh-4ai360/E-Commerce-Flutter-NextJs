'use client';

import { Mail, MapPin, Phone, StickyNote, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { formatDateTime } from '@/lib/client/format';
import { formatMoney } from '@/lib/money';
import { paymentMethodLabel } from '@/lib/store-config';
import type { OrderView } from '@/lib/types';

import { ProductImage } from './ProductImage';
import { OrderStepper, StatusPill, statusLabel } from './ui';

export function OrderDetail({ order, actions }: { order: OrderView; actions?: ReactNode }) {
  return (
    <div className="detail-grid">
      <div>
        <div className="card">
          <div className="order-card__head">
            <div>
              <strong style={{ fontSize: 20 }}>Order #{order.trackingCode}</strong>
              <div className="muted small">Placed {formatDateTime(order.createdAt)}</div>
            </div>
            <StatusPill status={order.status} />
          </div>
          <div style={{ marginTop: 18 }}>
            {order.status === 'CANCELLED' ? (
              <div className="alert alert--error">This order was cancelled.</div>
            ) : (
              <OrderStepper status={order.status} />
            )}
          </div>
        </div>

        <div className="card">
          <h2>Items ({order.items.length})</h2>
          {order.items.map((item) => (
            <div key={item.id} className="item-row">
              <div className="thumb">
                <ProductImage src={item.imageUrl} alt="" sizes="60px" />
              </div>
              <div className="item-row__text">
                <strong>{item.productName}</strong>
                <span>
                  Qty {item.quantity}
                  {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                  {item.selectedSize ? ` · Size ${item.selectedSize}` : ''}
                </span>
              </div>
              <strong>{formatMoney(item.unitPrice * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-rows" style={{ marginTop: 14 }}>
            <div>
              <span className="muted">Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div>
              <span className="muted">Shipping</span>
              <span>{order.shippingFee === 0 ? 'Free' : formatMoney(order.shippingFee)}</span>
            </div>
            <div className="total">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <h2>Delivery</h2>
          <div className="kv">
            <div>
              <MapPin size={15} />
              <span>
                <strong>{order.customerName}</strong>
                {order.deliveryAddress ? <><br />{order.deliveryAddress}</> : null}
              </span>
            </div>
            <div>
              <Phone size={15} />
              <span>{order.customerPhone}</span>
            </div>
            {order.customerEmail ? (
              <div>
                <Mail size={15} />
                <span>{order.customerEmail}</span>
              </div>
            ) : null}
            <div>
              <Wallet size={15} />
              <span>{paymentMethodLabel(order.paymentMethod)}</span>
            </div>
            {order.notes ? (
              <div>
                <StickyNote size={15} />
                <span>{order.notes}</span>
              </div>
            ) : null}
          </div>
          {order.isRedacted ? (
            <p className="small muted" style={{ marginBottom: 0 }}>
              Contact and address details are hidden. Sign in with the account that placed
              this order to see them.
            </p>
          ) : null}
        </div>

        <div className="card">
          <h2>Timeline</h2>
          <ol className="timeline">
            {[...order.events].reverse().map((event, index) => (
              <li key={`${event.status}-${event.createdAt}-${index}`}>
                <strong>{statusLabel(event.status)}</strong>
                <span className="muted">{formatDateTime(event.createdAt)}</span>
                {event.note ? <div>{event.note}</div> : null}
              </li>
            ))}
          </ol>
        </div>

        {order.returnRequests.length > 0 ? (
          <div className="card">
            <h2>Returns</h2>
            {order.returnRequests.map((request) => (
              <div key={request.id} style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong className="small">{request.reason}</strong>
                  <StatusPill status={request.status} />
                </div>
                {request.adminNote ? <span className="small muted">{request.adminNote}</span> : null}
              </div>
            ))}
          </div>
        ) : null}

        {actions}
      </div>
    </div>
  );
}
