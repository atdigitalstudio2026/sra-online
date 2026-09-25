import { siteConfig } from '../config/site';

/**
 * Format numeric value to Indonesian Rupiah currency format (e.g. Rp 45.000)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat(siteConfig.currency.locale, {
    style: 'currency',
    currency: siteConfig.currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format weight with its corresponding unit
 */
export function formatWeight(weight: number | null | undefined, unit: string = 'kg'): string {
  if (weight === null || weight === undefined) return `- ${unit}`;
  return `${weight.toLocaleString(siteConfig.currency.locale)} ${unit}`;
}

/**
 * Generate URL-friendly slug from string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Format ISO date string to localized date
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(siteConfig.currency.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string to localized date and time
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(siteConfig.currency.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Normalize Indonesian phone number to international +62 standard
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length > 0) {
    cleaned = '+62' + cleaned;
  }
  return cleaned;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(price: number, comparePrice: number | null | undefined): number | null {
  if (!comparePrice || comparePrice <= price) return null;
  const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
  return discount > 0 ? discount : null;
}
