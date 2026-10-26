import { storeConfig } from './store-config';

/** Rounds to whole pesewas so float arithmetic never leaks into totals. */
export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Adds the optional, per-item shipping fees selected by the admin. */
export function shippingFeeForLines(
  lines: ReadonlyArray<{ shippingFee: number; quantity: number }>,
) {
  return roundMoney(
    lines.reduce((total, line) => total + line.shippingFee * line.quantity, 0),
  );
}

/**
 * Formats without Intl so server-rendered and hydrated output always match.
 */
export function formatMoney(value: number, { decimals = 2 } = {}) {
  const [whole, fraction] = Math.abs(value).toFixed(decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 ? '-' : '';
  return `${sign}${storeConfig.currencySymbol} ${grouped}${fraction ? `.${fraction}` : ''}`;
}

/** Whole-number prices drop the decimals (GH₵ 150), others keep them (GH₵ 89.50). */
export function formatPrice(value: number) {
  return formatMoney(value, { decimals: Number.isInteger(value) ? 0 : 2 });
}

export function discountPercent(price: number, originalPrice: number | null) {
  if (originalPrice === null || originalPrice <= price) {
    return null;
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
