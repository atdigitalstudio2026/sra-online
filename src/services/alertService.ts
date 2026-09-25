import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StockAlert, PriceAlert, ProductWithDetails } from '../types';
import { getProductById } from './productService';
import { sendCustomerNotification } from './notificationService';
import { logAdminAction } from './auditLogService';

const LOCAL_STOCK_ALERTS_KEY = 'fmcg_stock_alerts';
const LOCAL_PRICE_ALERTS_KEY = 'fmcg_price_alerts';

// Sample stock alerts for admin view
const INITIAL_STOCK_ALERTS: StockAlert[] = [
  {
    id: 'stk-1',
    user_id: 'usr-1',
    product_id: 'p5555555-5555-5555-5555-555555555555', // Kemiri Bulat
    email: 'catering.nusantara@example.com',
    phone: '081234567890',
    status: 'active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notified_at: null,
  },
];

// Sample price alerts for admin view
const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'prc-1',
    user_id: 'usr-1',
    product_id: 'p1111111-1111-1111-1111-111111111111', // Kurma Ajwa 500g
    target_price: 125000,
    status: 'active',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    triggered_at: null,
  },
];

function getLocalStockAlerts(): StockAlert[] {
  try {
    const raw = localStorage.getItem(LOCAL_STOCK_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LOCAL_STOCK_ALERTS_KEY, JSON.stringify(INITIAL_STOCK_ALERTS));
  return INITIAL_STOCK_ALERTS;
}

function saveLocalStockAlerts(list: StockAlert[]) {
  try {
    localStorage.setItem(LOCAL_STOCK_ALERTS_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalPriceAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRICE_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LOCAL_PRICE_ALERTS_KEY, JSON.stringify(INITIAL_PRICE_ALERTS));
  return INITIAL_PRICE_ALERTS;
}

function saveLocalPriceAlerts(list: PriceAlert[]) {
  try {
    localStorage.setItem(LOCAL_PRICE_ALERTS_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Customer subscribes to Back In Stock alert (Section 41)
 */
export async function subscribeBackInStock(params: {
  productId: string;
  email: string;
  phone?: string;
  userId?: string | null;
}): Promise<StockAlert> {
  const product = await getProductById(params.productId);
  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  const alert: StockAlert = {
    id: crypto.randomUUID(),
    user_id: params.userId || null,
    product_id: params.productId,
    email: params.email.trim(),
    phone: params.phone?.trim() || null,
    status: 'active',
    created_at: new Date().toISOString(),
    notified_at: null,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('stock_alerts').insert(alert);
    } catch (e) {
      console.warn('Supabase subscribeBackInStock failed:', e);
    }
  }

  const list = getLocalStockAlerts();
  list.unshift(alert);
  saveLocalStockAlerts(list);

  return alert;
}

/**
 * Trigger Back in Stock alerts when product stock replenished 0 -> >0 (Section 42)
 */
export async function checkAndTriggerStockAlerts(
  productId: string,
  newStock: number,
  productName: string
): Promise<number> {
  if (newStock <= 0) return 0;

  const list = getLocalStockAlerts();
  const activeAlerts = list.filter((a) => a.product_id === productId && a.status === 'active');

  const now = new Date().toISOString();
  let triggeredCount = 0;

  for (const alert of activeAlerts) {
    alert.status = 'notified';
    alert.notified_at = now;
    triggeredCount++;

    // Generate Customer Notification (Section 42)
    await sendCustomerNotification(
      alert.user_id || null,
      'back_in_stock',
      'Produk Tersedia Kembali!',
      `Produk yang Anda tunggu, "${productName}", kini sudah tersedia kembali dengan stok ${newStock}. Segera checkout sebelum kehabisan!`,
      'product',
      productId
    );
  }

  if (triggeredCount > 0) {
    saveLocalStockAlerts(list);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('stock_alerts')
          .update({ status: 'notified', notified_at: now })
          .eq('product_id', productId)
          .eq('status', 'active');
      } catch {}
    }
  }

  return triggeredCount;
}

/**
 * Customer subscribes to Price Drop alert (Section 43, 44)
 * Uses database price validation to prevent client-side manipulation.
 */
export async function subscribePriceDrop(params: {
  productId: string;
  targetPrice: number;
  userId: string;
}): Promise<PriceAlert> {
  const product = await getProductById(params.productId);
  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  // Security Rule (Section 44): Target price must be lower than current database price
  if (params.targetPrice >= product.price) {
    throw new Error('Target harga pengingat harus lebih rendah dari harga produk saat ini.');
  }

  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    user_id: params.userId,
    product_id: params.productId,
    target_price: params.targetPrice,
    status: 'active',
    created_at: new Date().toISOString(),
    triggered_at: null,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('price_alerts').insert(alert);
    } catch (e) {
      console.warn('Supabase subscribePriceDrop failed:', e);
    }
  }

  const list = getLocalPriceAlerts();
  list.unshift(alert);
  saveLocalPriceAlerts(list);

  return alert;
}

/**
 * Check and trigger Price Drop alerts when admin updates product price
 */
export async function checkAndTriggerPriceAlerts(
  productId: string,
  newPrice: number,
  productName: string
): Promise<number> {
  const list = getLocalPriceAlerts();
  const matched = list.filter((a) => a.product_id === productId && a.status === 'active' && newPrice <= a.target_price);

  const now = new Date().toISOString();
  let count = 0;

  for (const alert of matched) {
    alert.status = 'triggered';
    alert.triggered_at = now;
    count++;

    await sendCustomerNotification(
      alert.user_id || null,
      'wishlist_price_drop',
      'Harga Produk Turun!',
      `Kabar gembira! Harga "${productName}" kini turun menjadi Rp${newPrice.toLocaleString('id-ID')}, sesuai target pengingat Anda.`,
      'product',
      productId
    );
  }

  if (count > 0) {
    saveLocalPriceAlerts(list);
  }

  return count;
}

/**
 * Fetch all alerts for Admin view
 */
export async function getAllStockAlerts(): Promise<StockAlert[]> {
  const alerts = getLocalStockAlerts();
  const hydrated: StockAlert[] = [];
  for (const a of alerts) {
    const p = await getProductById(a.product_id);
    hydrated.push({ ...a, product: p || undefined });
  }
  return hydrated;
}

export async function getAllPriceAlerts(): Promise<PriceAlert[]> {
  const alerts = getLocalPriceAlerts();
  const hydrated: PriceAlert[] = [];
  for (const a of alerts) {
    const p = await getProductById(a.product_id);
    hydrated.push({ ...a, product: p || undefined });
  }
  return hydrated;
}
