/**
 * Security Service
 * Provides sanitization helpers, data masking utilities, and
 * security audit telemetry logging.
 */

import { systemLogger } from './security/systemLogger';
import { SecurityLogLevel, SecurityLogCategory, SecurityAuditEntry } from '../types';

/**
 * XSS & HTML Input Sanitizer
 * Strips HTML tags and script elements from user inputs
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Data Masking: Customer Phone Number
 * Example: '081234567890' -> '0812****7890'
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '-';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}****${end}`;
}

/**
 * Data Masking: Customer Email
 * Example: 'customer@gmail.com' -> 'c***r@gmail.com'
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email || '-';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  const maskedLocal = `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Log Security Events to the Audit Trail
 */
export function recordSecurityEvent(
  level: SecurityLogLevel,
  category: SecurityLogCategory,
  message: string,
  details?: any
): SecurityAuditEntry {
  return systemLogger.log({
    level,
    category,
    message,
    actor_name: 'Client Browser',
    details,
  });
}

/**
 * Retrieve Audit & System Logs
 */
export function getSecurityLogs(filter?: {
  level?: SecurityLogLevel | 'ALL';
  category?: SecurityLogCategory | 'ALL';
  search?: string;
  limit?: number;
}): SecurityAuditEntry[] {
  return systemLogger.getLogs(filter);
}
