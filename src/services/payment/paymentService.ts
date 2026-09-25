/**
 * Core Payment Service & Orchestration
 * Handles payment attempts, provider invocation, webhook verification,
 * status updates, idempotency, and admin reconciliation.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  PaymentRecord,
  PaymentMethodConfig,
  CreatePaymentResult,
  PaymentVerificationResult,
  OrderWithDetails,
} from '../../types';
import { getOrderById, getOrderByNumber } from '../orderService';
import { PaymentProvider } from './paymentProvider';
import { MidtransProvider } from './midtransProvider';
import { XenditProvider } from './xenditProvider';
import { sendCustomerNotification } from '../notificationService';
import { recordFunnelEvent } from '../../utils/marketing';
import { formatRupiah } from '../../utils/formatters';

const LOCAL_PAYMENTS_KEY = 'fmcg_payments';
const LOCAL_PAYMENT_METHODS_KEY = 'fmcg_payment_methods';

// Default initial payment methods for local fallback / seeding
const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-1',
    code: 'bank_transfer',
    name: 'Virtual Account & Transfer Bank',
    provider: 'midtrans',
    description: 'Bayar via BCA, Mandiri, BNI, BRI, & Permata Virtual Account dengan verifikasi otomatis 24 jam.',
    icon_url: null,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pm-2',
    code: 'qris',
    name: 'QRIS (GoPay, ShopeePay, Dana, OVO)',
    provider: 'midtrans',
    description: 'Scan kode QRIS langsung melalui seluruh aplikasi e-wallet dan mobile banking Indonesia.',
    icon_url: null,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pm-3',
    code: 'credit_card',
    name: 'Kartu Kredit / Debit Online',
    provider: 'midtrans',
    description: 'Pembayaran instan dengan proteksi 3D Secure untuk Visa, Mastercard, dan JCB.',
    icon_url: null,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pm-4',
    code: 'manual_transfer',
    name: 'Transfer Bank Manual (BCA)',
    provider: 'manual',
    description: 'Transfer konvensional langsung ke rekening operasional toko dengan verifikasi tim admin.',
    icon_url: null,
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Local storage helpers
function getLocalPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading payments from localStorage', e);
  }
  return [];
}

function saveLocalPayments(list: PaymentRecord[]) {
  try {
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed saving payments to localStorage', e);
  }
}

function getLocalPaymentMethods(): PaymentMethodConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading payment methods from localStorage', e);
  }
  return DEFAULT_PAYMENT_METHODS;
}

function saveLocalPaymentMethods(list: PaymentMethodConfig[]) {
  try {
    localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed saving payment methods to localStorage', e);
  }
}

/**
 * Provider factory
 */
export function getPaymentProvider(providerName: string = 'midtrans'): PaymentProvider {
  const norm = (providerName || '').toLowerCase().trim();
  if (norm === 'xendit') {
    return new XenditProvider();
  }
  return new MidtransProvider();
}

/**
 * Get active payment methods configured for checkout
 */
export async function getPaymentMethods(): Promise<PaymentMethodConfig[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as PaymentMethodConfig[];
      }
    } catch (e) {
      console.warn('Supabase getPaymentMethods failed, using local:', e);
    }
  }

  const local = getLocalPaymentMethods();
  return local.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Get all payment methods (for Admin configuration)
 */
export async function getAllPaymentMethodsAdmin(): Promise<PaymentMethodConfig[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as PaymentMethodConfig[];
      }
    } catch (e) {
      console.warn('Supabase getAllPaymentMethodsAdmin failed, using local:', e);
    }
  }

  return getLocalPaymentMethods().sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Admin: Toggle or update payment method
 */
export async function updatePaymentMethod(
  id: string,
  updates: Partial<PaymentMethodConfig>
): Promise<PaymentMethodConfig> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as PaymentMethodConfig;
      }
    } catch (e) {
      console.warn('Supabase updatePaymentMethod failed:', e);
    }
  }

  const list = getLocalPaymentMethods();
  const idx = list.findIndex((m) => m.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    saveLocalPaymentMethods(list);
    return list[idx];
  }

  throw new Error('Metode pembayaran tidak ditemukan.');
}

/**
 * Fetch all payment attempts for a specific order
 */
export async function getPaymentsByOrderId(orderId: string): Promise<PaymentRecord[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as PaymentRecord[];
      }
    } catch (e) {
      console.warn('Supabase getPaymentsByOrderId failed, using local:', e);
    }
  }

  const local = getLocalPayments();
  return local
    .filter((p) => p.order_id === orderId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Admin: Fetch all payments across system
 */
export async function getAllPaymentsAdmin(filter?: {
  status?: string;
  search?: string;
}): Promise<PaymentRecord[]> {
  let all: PaymentRecord[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;
      if (!error && data) {
        all = data as PaymentRecord[];
      }
    } catch (e) {
      console.warn('Supabase getAllPaymentsAdmin failed:', e);
    }
  }

  if (all.length === 0) {
    all = getLocalPayments();
    if (filter?.status && filter.status !== 'all') {
      all = all.filter((p) => p.status === filter.status);
    }
  }

  if (filter?.search?.trim()) {
    const q = filter.search.trim().toLowerCase();
    all = all.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.order_id.toLowerCase().includes(q) ||
        (p.provider_transaction_id && p.provider_transaction_id.toLowerCase().includes(q)) ||
        (p.payment_method && p.payment_method.toLowerCase().includes(q))
    );
  }

  return all;
}

/**
 * CORE: Create Payment Transaction (Section 8, 9, 12)
 * Validates order, takes grand_total strictly from database, creates payment record
 */
export async function createPayment(
  orderIdentifier: string, // orderId or orderNumber
  paymentMethodCode: string = 'bank_transfer',
  guestToken?: string | null
): Promise<CreatePaymentResult> {
  // 1. Fetch order directly from database
  let order: OrderWithDetails | null = null;
  if (orderIdentifier.startsWith('ORD-')) {
    order = await getOrderByNumber(orderIdentifier, guestToken || null, null, false);
  } else {
    order = await getOrderById(orderIdentifier);
  }

  if (!order) {
    throw new Error('Data pesanan tidak ditemukan di sistem.');
  }

  // 2. Validate payment state
  if (order.payment_status === 'paid') {
    throw new Error('Pesanan ini sudah berhasil dibayar. Tidak perlu melakukan pembayaran ulang.');
  }

  if (order.status === 'cancelled') {
    throw new Error('Pesanan telah dibatalkan dan tidak dapat diproses pembayarannya.');
  }

  // 3. Security Rule (Section 9): Amount MUST strictly come from orders.grand_total in database
  const grandTotal = Number(order.grand_total);
  if (!grandTotal || grandTotal <= 0) {
    throw new Error('Nilai total pesanan tidak valid.');
  }

  // 4. Select provider
  const provider = getPaymentProvider('midtrans');
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();

  // 5. Invoke provider to create transaction
  const providerResult = await provider.createTransaction({
    order_id: order.id,
    order_number: order.order_number,
    amount: grandTotal,
    customer: {
      first_name: order.customer_name,
      email: order.customer_email || undefined,
      phone: order.customer_phone,
      address: order.shipping_address,
      city: order.shipping_city,
      postal_code: order.shipping_postal_code,
    },
    items: order.items.map((i) => ({
      id: i.product_id,
      name: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
    })),
    shipping_cost: order.shipping_cost,
    payment_method_code: paymentMethodCode,
  });

  // 6. Record payment attempt in payments table (Section 4)
  const paymentRecord: PaymentRecord = {
    id: paymentId,
    order_id: order.id,
    provider: providerResult.provider,
    provider_transaction_id: providerResult.provider_transaction_id || null,
    payment_method: paymentMethodCode,
    amount: grandTotal,
    currency: 'IDR',
    status: 'pending',
    payment_url: providerResult.payment_url || null,
    payment_token: providerResult.payment_token || null,
    expires_at: providerResult.expires_at,
    paid_at: null,
    failure_reason: null,
    raw_response: providerResult.raw_response,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error: insErr } = await supabase.from('payments').insert(paymentRecord);
      if (insErr) {
        console.warn('Supabase insert payment failed:', insErr.message);
      }
    } catch (e) {
      console.warn('Supabase payments insert error:', e);
    }
  }

  // Save in local storage
  const localList = getLocalPayments();
  localList.unshift(paymentRecord);
  saveLocalPayments(localList);

  return {
    success: true,
    payment_id: paymentId,
    order_id: order.id,
    order_number: order.order_number,
    amount: grandTotal,
    currency: 'IDR',
    provider: providerResult.provider,
    payment_token: providerResult.payment_token,
    payment_url: providerResult.payment_url,
    expires_at: providerResult.expires_at,
    payment_method: paymentMethodCode,
    status: 'pending',
  };
}

/**
 * CORE: Verify Payment Status (Section 14 & 18)
 * Checks status from provider or database and updates order & payment atomically
 */
export async function verifyPayment(
  orderIdentifier: string,
  paymentId?: string
): Promise<PaymentVerificationResult> {
  let order: OrderWithDetails | null = null;
  if (orderIdentifier.startsWith('ORD-')) {
    order = await getOrderByNumber(orderIdentifier, null, null, false);
  } else {
    order = await getOrderById(orderIdentifier);
  }

  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  // If already paid, return confirmed result
  if (order.payment_status === 'paid') {
    const existingPayments = await getPaymentsByOrderId(order.id);
    const paidAttempt = existingPayments.find((p) => p.status === 'paid') || existingPayments[0];

    return {
      success: true,
      order_id: order.id,
      payment_id: paidAttempt?.id || '',
      status: 'paid',
      order_payment_status: 'paid',
      paid_at: paidAttempt?.paid_at || order.updated_at,
      raw_response: paidAttempt?.raw_response,
    };
  }

  // Query provider Status API
  const provider = getPaymentProvider('midtrans');
  const providerCheck = await provider.verifyTransaction(order.order_number);

  const now = new Date().toISOString();

  // If provider confirms payment is paid
  if (providerCheck.status === 'paid') {
    await markOrderAsPaid(
      order.id,
      providerCheck.provider_transaction_id,
      providerCheck.payment_method || 'midtrans',
      providerCheck.raw_response,
      providerCheck.paid_at || now,
      'Verifikasi Gateway Otomatis'
    );

    return {
      success: true,
      order_id: order.id,
      payment_id: paymentId || '',
      status: 'paid',
      order_payment_status: 'paid',
      paid_at: providerCheck.paid_at || now,
      raw_response: providerCheck.raw_response,
    };
  }

  // Otherwise return current pending or failure state
  return {
    success: false,
    order_id: order.id,
    payment_id: paymentId || '',
    status: providerCheck.status,
    order_payment_status: order.payment_status,
    failure_reason: providerCheck.failure_reason,
    raw_response: providerCheck.raw_response,
  };
}

/**
 * Handle incoming Webhook Notification (Section 15, 16, 17, 18)
 * Verifies signature, guarantees idempotency, updates order & payment
 */
export async function handleWebhookNotification(
  payload: any,
  signatureHeader?: string
): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
  const provider = getPaymentProvider('midtrans');

  // 1. Verify signature security
  const isValidSignature = await provider.verifyWebhookSignature(payload, signatureHeader);
  if (!isValidSignature) {
    throw new Error('Validasi signature webhook gagal. Permintaan tidak sah.');
  }

  // 2. Parse standardized notification
  const parsed = provider.parseWebhookNotification(payload);
  if (!parsed.order_number) {
    throw new Error('Payload webhook tidak memiliki order_id / nomor pesanan.');
  }

  // 3. Find order in system
  const order = await getOrderByNumber(parsed.order_number, null, null, false);
  if (!order) {
    throw new Error(`Pesanan dengan nomor ${parsed.order_number} tidak ditemukan.`);
  }

  // 4. Idempotency Check (Section 17): Prevent double processing
  if (order.payment_status === 'paid' && parsed.status === 'paid') {
    return {
      success: true,
      message: `Pesanan ${parsed.order_number} telah berstatus PAID sebelumnya (idempotent).`,
      duplicate: true,
    };
  }

  const now = new Date().toISOString();

  // 5. Update based on status
  if (parsed.status === 'paid') {
    await markOrderAsPaid(
      order.id,
      parsed.provider_transaction_id || '',
      parsed.payment_method || 'midtrans',
      parsed.raw_payload,
      parsed.paid_at || now,
      'Webhook Midtrans'
    );
    return {
      success: true,
      message: `Pembayaran pesanan ${parsed.order_number} berhasil diverifikasi via Webhook.`,
    };
  } else if (parsed.status === 'expired' || parsed.status === 'failed' || parsed.status === 'cancelled') {
    // Update payment record attempt
    await updatePaymentAttemptStatus(
      order.id,
      parsed.provider_transaction_id,
      parsed.status,
      parsed.raw_payload
    );

    return {
      success: true,
      message: `Status pembayaran pesanan ${parsed.order_number} diperbarui menjadi ${parsed.status}.`,
    };
  }

  return {
    success: true,
    message: `Notifikasi webhook diterima dengan status: ${parsed.status}.`,
  };
}

/**
 * Atomically marks an order and its payment as PAID
 * Updates: orders(payment_status='paid', status='processing'), payments(status='paid'), order_status_history
 */
export async function markOrderAsPaid(
  orderId: string,
  providerTransactionId: string,
  paymentMethod: string,
  rawResponse: any,
  paidAt: string,
  actor: string = 'Sistem Gateway'
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update payments table
  if (isSupabaseConfigured() && supabase) {
    try {
      // Find latest pending payment for this order
      const { data: latestPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestPayment) {
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            provider_transaction_id: providerTransactionId,
            payment_method: paymentMethod,
            paid_at: paidAt,
            raw_response: rawResponse,
            updated_at: now,
          })
          .eq('id', latestPayment.id);
      } else {
        // Insert new payment record
        await supabase.from('payments').insert({
          id: crypto.randomUUID(),
          order_id: orderId,
          provider: 'midtrans',
          provider_transaction_id: providerTransactionId,
          payment_method: paymentMethod,
          amount: 0,
          currency: 'IDR',
          status: 'paid',
          paid_at: paidAt,
          raw_response: rawResponse,
          created_at: now,
          updated_at: now,
        });
      }

      // 2. Update orders table
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing', // Move from pending_payment to processing
          updated_at: now,
        })
        .eq('id', orderId);

      // 3. Add to order status history
      await supabase.from('order_status_history').insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        old_status: 'pending_payment',
        new_status: 'processing',
        changed_by: actor,
        note: `Pembayaran berhasil diverifikasi melalui ${paymentMethod}. Status otomatis berubah menjadi diproses.`,
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase markOrderAsPaid error, updating local:', e);
    }
  }

  // Update local storage
  const payments = getLocalPayments();
  const pIdx = payments.findIndex((p) => p.order_id === orderId);
  if (pIdx !== -1) {
    payments[pIdx] = {
      ...payments[pIdx],
      status: 'paid',
      provider_transaction_id: providerTransactionId,
      payment_method: paymentMethod,
      paid_at: paidAt,
      raw_response: rawResponse,
      updated_at: now,
    };
    saveLocalPayments(payments);
  } else {
    payments.unshift({
      id: crypto.randomUUID(),
      order_id: orderId,
      provider: 'midtrans',
      provider_transaction_id: providerTransactionId,
      payment_method: paymentMethod,
      amount: 0,
      currency: 'IDR',
      status: 'paid',
      paid_at: paidAt,
      raw_response: rawResponse,
      created_at: now,
      updated_at: now,
    });
    saveLocalPayments(payments);
  }

  // Update local orders
  try {
    const rawOrders = localStorage.getItem('fmcg_orders');
    if (rawOrders) {
      const orders = JSON.parse(rawOrders);
      const oIdx = orders.findIndex((o: any) => o.id === orderId);
      if (oIdx !== -1) {
        orders[oIdx].payment_status = 'paid';
        if (orders[oIdx].status === 'pending_payment') {
          orders[oIdx].status = 'processing';
        }
        orders[oIdx].updated_at = now;
        localStorage.setItem('fmcg_orders', JSON.stringify(orders));
      }
    }
  } catch (e) {
    console.warn('Failed local order payment update', e);
  }

  // Append history locally
  try {
    const rawHistory = localStorage.getItem('fmcg_order_history');
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    history.push({
      id: crypto.randomUUID(),
      order_id: orderId,
      old_status: 'pending_payment',
      new_status: 'processing',
      changed_by: actor,
      note: `Pembayaran berhasil diverifikasi melalui ${paymentMethod}. Status otomatis berubah menjadi diproses.`,
      created_at: now,
    });
    localStorage.setItem('fmcg_order_history', JSON.stringify(history));
  } catch (e) {
    console.warn('Failed local history append', e);
  }

  // Tahap 9: Payment Success Customer Notification & Conversion Funnel Event (Section 33, 52)
  try {
    const updatedOrder = await getOrderById(orderId);
    if (updatedOrder) {
      recordFunnelEvent('order_paid', { order_id: orderId, user_id: updatedOrder.user_id });
      await sendCustomerNotification(
        updatedOrder.user_id,
        'payment_success',
        'Pembayaran Berhasil Dikonfirmasi',
        `Pembayaran senilai ${formatRupiah(updatedOrder.grand_total)} untuk pesanan ${updatedOrder.order_number} telah berhasil diterima. Pesanan Anda segera disiapkan ke logistik.`,
        'order',
        updatedOrder.order_number
      );
    }
  } catch (notifErr) {
    console.warn('Could not send payment success notification:', notifErr);
  }
}

/**
 * Updates a payment attempt status (e.g. expired or failed)
 */
async function updatePaymentAttemptStatus(
  orderId: string,
  providerTransactionId: string | undefined,
  newStatus: 'expired' | 'failed' | 'cancelled',
  rawPayload: any
) {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('payments')
        .update({
          status: newStatus,
          raw_response: rawPayload,
          updated_at: now,
        })
        .eq('order_id', orderId);
    } catch (e) {
      console.warn('Supabase updatePaymentAttemptStatus error:', e);
    }
  }

  const payments = getLocalPayments();
  const pIdx = payments.findIndex((p) => p.order_id === orderId);
  if (pIdx !== -1) {
    payments[pIdx] = {
      ...payments[pIdx],
      status: newStatus,
      raw_response: rawPayload,
      updated_at: now,
    };
    saveLocalPayments(payments);
  }
}

/**
 * Admin: Manually confirm payment for an order
 */
export async function manualAdminConfirmPayment(
  orderId: string,
  adminName: string = 'Admin Toko',
  note: string = 'Konfirmasi pembayaran transfer manual via Rekening Bank'
): Promise<OrderWithDetails> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  if (order.payment_status === 'paid') {
    throw new Error('Pesanan ini sudah berstatus LUNAS.');
  }

  const now = new Date().toISOString();
  const manualTxId = `MANUAL-${Date.now().toString(36).toUpperCase()}`;

  await markOrderAsPaid(
    order.id,
    manualTxId,
    'Transfer Bank Manual (BCA)',
    { manual_note: note, confirmed_by: adminName },
    now,
    `Admin: ${adminName}`
  );

  const updated = await getOrderById(orderId);
  if (!updated) {
    throw new Error('Gagal memuat ulang data pesanan.');
  }
  return updated;
}

/**
 * Sandbox Simulator: Trigger test webhook for developer / admin testing
 */
export async function simulateWebhook(
  orderNumber: string,
  targetStatus: 'settlement' | 'pending' | 'expire' | 'cancel' | 'deny'
): Promise<{ success: boolean; message: string }> {
  const order = await getOrderByNumber(orderNumber, null, null, false);
  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  const simulatedPayload = {
    order_id: order.order_number,
    transaction_status: targetStatus,
    fraud_status: 'accept',
    gross_amount: String(order.grand_total),
    payment_type: 'bank_transfer',
    transaction_id: `sim_tx_${Date.now()}`,
    transaction_time: new Date().toISOString(),
    settlement_time: targetStatus === 'settlement' ? new Date().toISOString() : undefined,
    signature_key: 'simulated_signature_key',
  };

  return handleWebhookNotification(simulatedPayload);
}
