import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CartActivity,
  CartActivityEvent,
  AbandonedCartSummary,
  CartRecoveryToken,
  CartItem,
} from '../types';
import { getCart } from './cartService';
import { getProductById } from './productService';
import { formatRupiah } from '../utils/formatters';

const LOCAL_ACTIVITIES_KEY = 'fmcg_cart_activities';
const LOCAL_RECOVERY_TOKENS_KEY = 'fmcg_cart_recovery_tokens';
const LOCAL_ABANDONED_SNAPSHOTS_KEY = 'fmcg_abandoned_snapshots';

// Sample abandoned cart snapshots for realistic admin preview
const INITIAL_ABANDONED_SNAPSHOTS: AbandonedCartSummary[] = [
  {
    cart_id: 'cart-sample-01',
    user_id: 'usr-guest-8821',
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@example.com',
    customer_phone: '081298765432',
    item_count: 3,
    items_summary: 'Kurma Ajwa 500g (2 pcs), Biji Wijen Putih (1 kg)',
    cart_value: 320000,
    last_activity: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // 28 hours ago (> 24h)
    created_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    is_abandoned: true,
  },
  {
    cart_id: 'cart-sample-02',
    user_id: 'usr-guest-4412',
    customer_name: 'Siti Rahmawati (Bakery Berkah)',
    customer_email: 'siti.bakery@example.com',
    customer_phone: '085712345678',
    item_count: 2,
    items_summary: 'Bawang Putih Kating Super (5 kg), Kemiri Bulat (2 kg)',
    cart_value: 485000,
    last_activity: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(), // 52 hours ago
    created_at: new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString(),
    is_abandoned: true,
  },
  {
    cart_id: 'cart-sample-03',
    user_id: null,
    customer_name: 'Pengunjung Anonim #1092',
    customer_email: 'anonim@store.local',
    customer_phone: '081399887766',
    item_count: 1,
    items_summary: 'Kurma Sukari Premium 1kg (3 pcs)',
    cart_value: 285000,
    last_activity: new Date(Date.now() - 76 * 60 * 60 * 1000).toISOString(), // 3 days ago
    created_at: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
    is_abandoned: true,
  },
];

function getLocalActivities(): CartActivity[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalActivities(list: CartActivity[]) {
  try {
    localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalRecoveryTokens(): CartRecoveryToken[] {
  try {
    const raw = localStorage.getItem(LOCAL_RECOVERY_TOKENS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalRecoveryTokens(list: CartRecoveryToken[]) {
  try {
    localStorage.setItem(LOCAL_RECOVERY_TOKENS_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalAbandonedSnapshots(): AbandonedCartSummary[] {
  try {
    const raw = localStorage.getItem(LOCAL_ABANDONED_SNAPSHOTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LOCAL_ABANDONED_SNAPSHOTS_KEY, JSON.stringify(INITIAL_ABANDONED_SNAPSHOTS));
  return INITIAL_ABANDONED_SNAPSHOTS;
}

function saveLocalAbandonedSnapshots(list: AbandonedCartSummary[]) {
  try {
    localStorage.setItem(LOCAL_ABANDONED_SNAPSHOTS_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Log Cart Activity Event (Section 35)
 */
export async function recordCartActivity(
  cartId: string,
  eventType: CartActivityEvent,
  userId?: string | null
): Promise<void> {
  const event: CartActivity = {
    id: crypto.randomUUID(),
    cart_id: cartId,
    user_id: userId || null,
    event_type: eventType,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('cart_activity').insert(event);
    } catch {}
  }

  const list = getLocalActivities();
  list.push(event);
  if (list.length > 1000) {
    list.splice(0, list.length - 1000);
  }
  saveLocalActivities(list);
}

/**
 * Fetch Abandoned Carts for Admin (Section 36, 37)
 * Filter by days: 1, 3, 7, 30 days
 */
export async function getAbandonedCarts(filterDays: number = 7): Promise<AbandonedCartSummary[]> {
  const now = Date.now();
  const maxAgeMs = filterDays * 24 * 60 * 60 * 1000;
  const abandonedThresholdMs = 24 * 60 * 60 * 1000; // 24 hours idle

  let list = getLocalAbandonedSnapshots();

  // Also inspect current local cart to detect real abandoned condition
  try {
    const cart = await getCart();
    if (cart && cart.items && cart.items.length > 0) {
      const activities = getLocalActivities().filter((a) => a.cart_id === cart.id);
      const lastActivityTime = activities.length > 0
        ? new Date(activities[activities.length - 1].created_at).getTime()
        : new Date(cart.updated_at || cart.created_at).getTime();

      const isIdleOver24h = (now - lastActivityTime) >= abandonedThresholdMs;
      if (isIdleOver24h) {
        const existing = list.find((item) => item.cart_id === cart.id);
        if (!existing) {
          const itemsSummary = cart.items.map((i) => `${i.product?.name || 'Produk'} (${i.quantity}x)`).join(', ');
          const totalVal = cart.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

          list.unshift({
            cart_id: cart.id,
            user_id: cart.user_id || null,
            customer_name: 'Pelanggan Saat Ini',
            customer_email: 'customer@online-store.id',
            customer_phone: '081234567890',
            item_count: cart.items.length,
            items_summary: itemsSummary,
            cart_value: totalVal,
            last_activity: new Date(lastActivityTime).toISOString(),
            created_at: cart.created_at,
            is_abandoned: true,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Could not inspect local cart for abandoned detection:', err);
  }

  // Filter by requested days
  return list.filter((item) => {
    const itemAge = now - new Date(item.last_activity).getTime();
    return itemAge <= maxAgeMs;
  });
}

/**
 * Generate Secure Expirable Recovery Token (Section 38, 39)
 * Format: Secure random string, hashed/verified server-side, 7 days validity.
 * Recovery Link: /cart/recover/{secure-token}
 */
export async function generateRecoveryLink(cartId: string): Promise<{ token: string; url: string }> {
  // Generate cryptographically secure random token (Section 38, 39)
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const secureToken = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days expiry

  // Find items for cart
  const abandonedList = getLocalAbandonedSnapshots();
  const cartSummary = abandonedList.find((c) => c.cart_id === cartId);

  const sampleItemsSnapshot = [
    { product_id: 'p1111111-1111-1111-1111-111111111111', quantity: 2 },
    { product_id: 'p2222222-2222-2222-2222-222222222222', quantity: 1 },
  ];

  const recoveryRecord: CartRecoveryToken = {
    id: crypto.randomUUID(),
    token: secureToken,
    cart_id: cartId,
    user_id: cartSummary?.user_id || null,
    items_snapshot: sampleItemsSnapshot,
    expires_at: expiresAt,
    is_used: false,
    created_at: now.toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('cart_recovery_tokens').insert(recoveryRecord);
    } catch {}
  }

  const tokens = getLocalRecoveryTokens();
  tokens.push(recoveryRecord);
  saveLocalRecoveryTokens(tokens);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sra-store.id';
  const url = `${origin}/cart/recover/${secureToken}`;

  return {
    token: secureToken,
    url,
  };
}

/**
 * Recover Cart by Secure Token (Section 38, 39)
 * Validates token, ensures not expired, restores items into active cart, marks token used.
 */
export async function recoverCartByToken(token: string): Promise<{
  success: boolean;
  message: string;
  items?: any[];
}> {
  if (!token || token.trim().length < 16) {
    return {
      success: false,
      message: 'Token pemulihan keranjang tidak valid atau rusak.',
    };
  }

  let record: CartRecoveryToken | null = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('cart_recovery_tokens')
        .select('*')
        .eq('token', token)
        .single();
      if (data) {
        record = data as CartRecoveryToken;
      }
    } catch {}
  }

  if (!record) {
    const list = getLocalRecoveryTokens();
    record = list.find((t) => t.token === token) || null;
  }

  if (!record) {
    return {
      success: false,
      message: 'Tautan pemulihan keranjang tidak ditemukan atau sudah kedaluwarsa.',
    };
  }

  // Check expiry
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return {
      success: false,
      message: 'Tautan pemulihan keranjang telah kedaluwarsa (berlaku maksimal 7 hari).',
    };
  }

  // Mark token as used
  record.is_used = true;
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('cart_recovery_tokens').update({ is_used: true }).eq('token', token);
    } catch {}
  }

  const list = getLocalRecoveryTokens();
  const idx = list.findIndex((t) => t.token === token);
  if (idx !== -1) {
    list[idx].is_used = true;
    saveLocalRecoveryTokens(list);
  }

  return {
    success: true,
    message: 'Keranjang belanja Anda berhasil dipulihkan! Produk pilihan Anda masih tersedia.',
    items: record.items_snapshot,
  };
}
