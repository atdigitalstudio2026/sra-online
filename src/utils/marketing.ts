import { UTMParams } from '../types';

const UTM_STORAGE_KEY = 'fmcg_utm_attribution';
const SESSION_ID_KEY = 'fmcg_anonymous_session_id';
const COOKIE_CONSENT_KEY = 'fmcg_cookie_consent';
const FUNNEL_EVENTS_KEY = 'fmcg_funnel_events';

export interface FunnelEventRecord {
  id: string;
  stage: 'visitor' | 'product_view' | 'add_to_cart' | 'checkout_started' | 'order_created' | 'order_paid';
  session_id: string;
  user_id?: string | null;
  product_id?: string;
  order_id?: string;
  timestamp: string;
  utm?: UTMParams;
}

/**
 * Returns a stable anonymous session ID for attribution without collecting PII.
 */
export function getAnonymousSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `ses_${crypto.randomUUID()}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `ses_fallback_${Date.now()}`;
  }
}

/**
 * Captures UTM parameters from current window URL query string and persists attribution snapshot.
 * Supports: utm_source, utm_medium, utm_campaign, utm_content
 */
export function captureUTMFromURL(): UTMParams | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    const content = params.get('utm_content');

    if (source || campaign) {
      const utm: UTMParams = {
        utm_source: source || null,
        utm_medium: medium || null,
        utm_campaign: campaign || null,
        utm_content: content || null,
      };

      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
      return utm;
    }
  } catch (e) {
    console.warn('Failed parsing or saving UTM params:', e);
  }

  return getStoredUTM();
}

/**
 * Retrieves the persisted UTM attribution snapshot for orders and analytics.
 */
export function getStoredUTM(): UTMParams | null {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

/**
 * Cookie / privacy consent status
 */
export type CookieConsentStatus = 'accepted' | 'declined' | 'pending';

export function getCookieConsentStatus(): CookieConsentStatus {
  try {
    const status = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (status === 'accepted' || status === 'declined') {
      return status;
    }
  } catch {}
  return 'pending';
}

export function setCookieConsentStatus(status: 'accepted' | 'declined') {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
  } catch {}
}

/**
 * Lightweight in-memory and local funnel event tracking
 */
export function recordFunnelEvent(
  stage: 'visitor' | 'product_view' | 'add_to_cart' | 'checkout_started' | 'order_created' | 'order_paid',
  metadata?: { product_id?: string; order_id?: string; user_id?: string | null }
) {
  try {
    const event: FunnelEventRecord = {
      id: crypto.randomUUID(),
      stage,
      session_id: getAnonymousSessionId(),
      user_id: metadata?.user_id || null,
      product_id: metadata?.product_id,
      order_id: metadata?.order_id,
      timestamp: new Date().toISOString(),
      utm: getStoredUTM() || undefined,
    };

    const raw = localStorage.getItem(FUNNEL_EVENTS_KEY);
    const events: FunnelEventRecord[] = raw ? JSON.parse(raw) : [];
    events.push(event);

    // Keep last 1,000 events to respect client storage
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }

    localStorage.setItem(FUNNEL_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('Could not record funnel event:', err);
  }
}

export function getLocalFunnelEvents(): FunnelEventRecord[] {
  try {
    const raw = localStorage.getItem(FUNNEL_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
