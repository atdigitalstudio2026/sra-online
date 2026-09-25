import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Order,
  OrderItem,
  OrderStatusHistory,
  OrderWithDetails,
  OrderStatus,
  CheckoutFormData,
} from '../types';
import { getProductById } from './productService';
import { getShippingMethodById } from './shippingService';
import { getCart, clearCart } from './cartService';
import { createCustomerAddress } from './addressService';
import { recordOrderInventoryMovement } from './inventoryService';
import { logAdminAction } from './auditLogService';
import { getStoredUTM, recordFunnelEvent } from '../utils/marketing';
import { sendCustomerNotification } from './notificationService';
import { recordCartActivity } from './abandonedCartService';
import { formatRupiah } from '../utils/formatters';

const LOCAL_ORDERS_KEY = 'fmcg_orders';
const LOCAL_ORDER_ITEMS_KEY = 'fmcg_order_items';
const LOCAL_ORDER_HISTORY_KEY = 'fmcg_order_history';

// ------------------------------------------------------------------------------
// Local storage helpers for demo / offline fallback
// ------------------------------------------------------------------------------
function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading orders from localStorage', e);
  }
  return [];
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed saving orders to localStorage', e);
  }
}

function getLocalOrderItems(): OrderItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDER_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading order items from localStorage', e);
  }
  return [];
}

function saveLocalOrderItems(items: OrderItem[]) {
  try {
    localStorage.setItem(LOCAL_ORDER_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed saving order items to localStorage', e);
  }
}

function getLocalOrderHistory(): OrderStatusHistory[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDER_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading order history from localStorage', e);
  }
  return [];
}

function saveLocalOrderHistory(history: OrderStatusHistory[]) {
  try {
    localStorage.setItem(LOCAL_ORDER_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed saving order history to localStorage', e);
  }
}

/**
 * Generate human-readable, unique order number (format: ORD-YYYYMMDD-XXXX)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `ORD-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Generate secure token for guest order lookup (Section 25)
 */
export function generateGuestToken(): string {
  return 'gt_' + crypto.randomUUID().replace(/-/g, '');
}

/**
 * Normalizes phone number into international Indonesian standard (+62...)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.slice(1);
  } else if (cleaned.startsWith('62')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+62')) {
    cleaned = '+62' + cleaned;
  }
  return cleaned;
}

/**
 * Validates phone number format
 */
export function isValidIndonesianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  // Must be between 10 and 15 digits
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Core atomic order creation with security re-verification and stock deduction
 */
export async function createOrder(
  formData: CheckoutFormData,
  userId?: string | null
): Promise<{ success: boolean; order: OrderWithDetails }> {
  // 1. Validate customer & address inputs
  if (!formData.customer_name || formData.customer_name.trim().length < 2) {
    throw new Error('Nama lengkap penerima minimal 2 karakter.');
  }

  if (!formData.customer_phone || !isValidIndonesianPhone(formData.customer_phone)) {
    throw new Error('Nomor WhatsApp tidak valid (contoh: 08123456789 atau +628123456789).');
  }

  if (!formData.address_line || formData.address_line.trim().length < 5) {
    throw new Error('Alamat pengiriman wajib diisi dengan lengkap.');
  }

  if (!formData.province || !formData.city || !formData.district || !formData.postal_code) {
    throw new Error('Mohon lengkapi provinsi, kota/kabupaten, kecamatan, dan kode pos pengiriman.');
  }

  if (!formData.shipping_method_id) {
    throw new Error('Silakan pilih salah satu metode pengiriman yang tersedia.');
  }

  // 2. Fetch current cart
  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) {
    throw new Error('Keranjang belanja Anda masih kosong. Silakan pilih produk terlebih dahulu.');
  }

  // 3. Security Rule: Re-verify all products, status, stock, and calculate prices from database
  let computedSubtotal = 0;
  const verifiedItemsToCreate: {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_image: string | null;
    unit_price: number;
    quantity: number;
    subtotal: number;
    current_stock: number;
  }[] = [];

  for (const item of cart.items) {
    const product = await getProductById(item.product_id);
    if (!product) {
      throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
    }

    if (!product.is_active) {
      throw new Error(`Produk "${product.name}" saat ini sudah tidak aktif atau dinonaktifkan.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Stok ${product.name} tidak mencukupi (tersedia: ${product.stock} ${product.unit}, diminta: ${item.quantity} ${product.unit}).`
      );
    }

    const itemSubtotal = product.price * item.quantity;
    computedSubtotal += itemSubtotal;

    verifiedItemsToCreate.push({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_image: product.primary_image || product.images?.[0]?.image_url || null,
      unit_price: product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      current_stock: product.stock,
    });
  }

  // 4. Fetch and re-verify shipping method from database
  const shippingMethod = await getShippingMethodById(formData.shipping_method_id);
  if (!shippingMethod || !shippingMethod.is_active) {
    throw new Error('Metode pengiriman yang dipilih tidak aktif atau tidak ditemukan.');
  }

  const verifiedShippingCost = shippingMethod.price;
  const discount = 0; // Discount system is for subsequent stages
  const grandTotal = computedSubtotal + verifiedShippingCost - discount;

  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const guestToken = userId ? null : generateGuestToken();
  const normalizedPhone = normalizePhoneNumber(formData.customer_phone);

  const orderRecord: Order = {
    id: orderId,
    order_number: orderNumber,
    guest_token: guestToken,
    user_id: userId || null,
    customer_name: formData.customer_name.trim(),
    customer_phone: normalizedPhone,
    customer_email: formData.customer_email ? formData.customer_email.trim() : null,
    shipping_address: formData.address_line.trim(),
    shipping_province: formData.province.trim(),
    shipping_city: formData.city.trim(),
    shipping_district: formData.district.trim(),
    shipping_subdistrict: formData.subdistrict ? formData.subdistrict.trim() : formData.district.trim(),
    shipping_postal_code: formData.postal_code.trim(),
    delivery_note: formData.delivery_note ? formData.delivery_note.trim() : null,
    shipping_method_id: shippingMethod.id,
    shipping_method_name: shippingMethod.name,
    shipping_cost: verifiedShippingCost,
    subtotal: computedSubtotal,
    discount,
    grand_total: grandTotal,
    status: 'pending_payment',
    payment_status: 'unpaid',
    utm_source: getStoredUTM()?.utm_source || null,
    utm_medium: getStoredUTM()?.utm_medium || null,
    utm_campaign: getStoredUTM()?.utm_campaign || null,
    utm_content: getStoredUTM()?.utm_content || null,
    created_at: now,
    updated_at: now,
  };

  const orderItemsRecords: OrderItem[] = verifiedItemsToCreate.map((item) => ({
    id: crypto.randomUUID(),
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_sku,
    product_image: item.product_image,
    unit_price: item.unit_price,
    quantity: item.quantity,
    subtotal: item.subtotal,
    created_at: now,
  }));

  const initialHistory: OrderStatusHistory = {
    id: crypto.randomUUID(),
    order_id: orderId,
    old_status: null,
    new_status: 'pending_payment',
    changed_by: userId ? 'Customer Terdaftar' : 'Tamu (Guest)',
    note: 'Pesanan baru berhasil dibuat dan menunggu pembayaran.',
    created_at: now,
  };

  // 5. Deduct stock and commit order
  if (isSupabaseConfigured() && supabase) {
    try {
      // Deduct stock for each item safely
      for (const item of verifiedItemsToCreate) {
        const { error: stockErr } = await supabase
          .from('products')
          .update({
            stock: item.current_stock - item.quantity,
            updated_at: now,
          })
          .eq('id', item.product_id)
          .gte('stock', item.quantity); // concurrency safety

        if (stockErr) {
          throw new Error(`Gagal memperbarui stok untuk ${item.product_name}.`);
        }
      }

      // Insert Order
      const { error: orderErr } = await supabase.from('orders').insert(orderRecord);
      if (orderErr) {
        throw new Error(`Gagal membuat data pesanan: ${orderErr.message}`);
      }

      // Insert Order Items
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsRecords);
      if (itemsErr) {
        throw new Error(`Gagal menyimpan item pesanan: ${itemsErr.message}`);
      }

      // Insert Order History
      await supabase.from('order_status_history').insert(initialHistory);

      // Convert Cart
      await supabase
        .from('carts')
        .update({ status: 'converted', updated_at: now })
        .eq('id', cart.id);

      // Clear Cart items
      await clearCart(userId);
    } catch (e: unknown) {
      console.error('Supabase createOrder error:', e);
      throw e;
    }
  } else {
    // Local / Offline fallback execution
    // Deduct stock in local products storage
    try {
      const LOCAL_PRODUCTS_KEY = 'fmcg_products';
      const rawProducts = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (rawProducts) {
        const prods = JSON.parse(rawProducts);
        for (const itm of verifiedItemsToCreate) {
          const pIdx = prods.findIndex((p: any) => p.id === itm.product_id);
          if (pIdx !== -1) {
            prods[pIdx].stock = Math.max(0, prods[pIdx].stock - itm.quantity);
            prods[pIdx].updated_at = now;
          }
        }
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(prods));
      }
    } catch (e) {
      console.warn('Failed local stock deduction:', e);
    }

    // Save order records locally
    const ordersList = getLocalOrders();
    ordersList.unshift(orderRecord);
    saveLocalOrders(ordersList);

    const itemsList = getLocalOrderItems();
    itemsList.push(...orderItemsRecords);
    saveLocalOrderItems(itemsList);

    const historyList = getLocalOrderHistory();
    historyList.push(initialHistory);
    saveLocalOrderHistory(historyList);

    // Clear active cart items
    await clearCart(userId);
  }

  // Record inventory movements for all verified items (Section 34)
  for (const itm of verifiedItemsToCreate) {
    recordOrderInventoryMovement({
      product_id: itm.product_id,
      quantity: -itm.quantity,
      order_number: orderNumber,
      previous_stock: itm.current_stock,
      new_stock: Math.max(0, itm.current_stock - itm.quantity),
      type: 'sale',
      actor_name: userId ? 'Customer Terdaftar' : 'Tamu (Guest)',
    }).catch((e) => console.warn('Record inventory movement error:', e));
  }

  // 6. If user requested to save address and is logged-in, save address
  if (formData.save_address && userId) {
    try {
      await createCustomerAddress({
        user_id: userId,
        label: formData.address_label || 'Rumah',
        recipient_name: formData.customer_name.trim(),
        phone: normalizedPhone,
        address_line: formData.address_line.trim(),
        province: formData.province.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        subdistrict: formData.subdistrict ? formData.subdistrict.trim() : formData.district.trim(),
        postal_code: formData.postal_code.trim(),
        delivery_note: formData.delivery_note ? formData.delivery_note.trim() : null,
        is_default: false,
      });
    } catch (e) {
      console.warn('Failed auto-saving address:', e);
    }
  }

  // Store guest token in sessionStorage for instant lookup on order success page
  if (guestToken) {
    try {
      sessionStorage.setItem(`guest_token_${orderNumber}`, guestToken);
    } catch (e) {
      console.warn('Failed saving guest token to sessionStorage', e);
    }
  }

  const orderWithDetails: OrderWithDetails = {
    ...orderRecord,
    items: orderItemsRecords,
    history: [initialHistory],
    shipping_method: shippingMethod,
  };

  // Tahap 9: Marketing Funnel, Cart Activity, & Customer Notification (Sections 33, 35, 52)
  recordFunnelEvent('order_created', { order_id: orderRecord.id, user_id: userId || null });
  await recordCartActivity(cart.id, 'order_created', userId || null);
  await sendCustomerNotification(
    userId || null,
    'order_created',
    'Pesanan Anda Berhasil Dibuat',
    `Pesanan ${orderRecord.order_number} telah berhasil dibuat dengan total ${formatRupiah(grandTotal)}. Menunggu pembayaran.`,
    'order',
    orderRecord.order_number
  );

  return { success: true, order: orderWithDetails };
}

/**
 * Fetch Order by Order Number with guest access token validation
 */
export async function getOrderByNumber(
  orderNumber: string,
  guestToken?: string | null,
  userId?: string | null,
  isAdmin = false
): Promise<OrderWithDetails | null> {
  if (!orderNumber) return null;

  // Retrieve guest token from session if available
  const effectiveGuestToken =
    guestToken || (typeof window !== 'undefined' ? sessionStorage.getItem(`guest_token_${orderNumber}`) : null);

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('orders').select('*').eq('order_number', orderNumber);

      const { data: orderData, error: orderErr } = await query.maybeSingle();

      if (orderErr || !orderData) {
        return null;
      }

      const order = orderData as Order;

      // Access control validation (Section 25 & 38)
      if (!isAdmin) {
        if (order.user_id && userId && order.user_id === userId) {
          // Logged-in user viewing their own order
        } else if (order.guest_token && effectiveGuestToken && order.guest_token === effectiveGuestToken) {
          // Guest viewing their own order with secure token
        } else if (!order.user_id && effectiveGuestToken && order.guest_token === effectiveGuestToken) {
          // Guest verified
        } else {
          console.warn('Access denied to order without credentials');
          return null;
        }
      }

      // Fetch items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      // Fetch history
      const { data: historyData } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      // Fetch shipping method
      const shippingMethod = await getShippingMethodById(order.shipping_method_id);

      const paymentsList = (paymentsData as any[]) || [];

      return {
        ...order,
        items: (itemsData as OrderItem[]) || [],
        history: (historyData as OrderStatusHistory[]) || [],
        shipping_method: shippingMethod,
        payments: paymentsList,
        latest_payment: paymentsList[0] || null,
      };
    } catch (e) {
      console.warn('Supabase getOrderByNumber failed, using local:', e);
    }
  }

  // Local fallback
  const localOrders = getLocalOrders();
  const order = localOrders.find((o) => o.order_number === orderNumber);
  if (!order) return null;

  // Access check
  if (!isAdmin) {
    if (order.user_id && userId && order.user_id === userId) {
      // Authorized
    } else if (order.guest_token && effectiveGuestToken && order.guest_token === effectiveGuestToken) {
      // Authorized
    } else if (!order.user_id) {
      // Authorized for demo local session
    } else {
      return null;
    }
  }

  const items = getLocalOrderItems().filter((it) => it.order_id === order.id);
  const history = getLocalOrderHistory().filter((h) => h.order_id === order.id);
  const shippingMethod = await getShippingMethodById(order.shipping_method_id);

  let localPayments: any[] = [];
  try {
    const rawP = localStorage.getItem('fmcg_payments');
    if (rawP) {
      localPayments = JSON.parse(rawP).filter((p: any) => p.order_id === order.id);
    }
  } catch {}

  return {
    ...order,
    items,
    history,
    shipping_method: shippingMethod,
    payments: localPayments,
    latest_payment: localPayments[0] || null,
  };
}

/**
 * Fetch Order by ID (used by admin or order details)
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('orders').select('*');
      if (orderId.startsWith('ORD-')) {
        query = query.eq('order_number', orderId);
      } else {
        query = query.eq('id', orderId);
      }
      const { data: orderData } = await query.maybeSingle();

      if (!orderData) return null;

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      const { data: historyData } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: true });

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: false });

      const shippingMethod = await getShippingMethodById(orderData.shipping_method_id);
      const paymentsList = (paymentsData as any[]) || [];

      return {
        ...(orderData as Order),
        items: (itemsData as OrderItem[]) || [],
        history: (historyData as OrderStatusHistory[]) || [],
        shipping_method: shippingMethod,
        payments: paymentsList,
        latest_payment: paymentsList[0] || null,
      };
    } catch (e) {
      console.warn('Supabase getOrderById failed, using local:', e);
    }
  }

  const localOrders = getLocalOrders();
  const order = localOrders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) return null;

  const items = getLocalOrderItems().filter((it) => it.order_id === order.id);
  const history = getLocalOrderHistory().filter((h) => h.order_id === order.id);
  const shippingMethod = await getShippingMethodById(order.shipping_method_id);

  let localPayments: any[] = [];
  try {
    const rawP = localStorage.getItem('fmcg_payments');
    if (rawP) {
      localPayments = JSON.parse(rawP).filter((p: any) => p.order_id === order.id);
    }
  } catch {}

  return {
    ...order,
    items,
    history,
    shipping_method: shippingMethod,
    payments: localPayments,
    latest_payment: localPayments[0] || null,
  };
}

/**
 * Fetch all orders for a logged in customer (/orders)
 */
export async function getUserOrders(
  userId: string,
  statusFilter?: OrderStatus | 'all'
): Promise<OrderWithDetails[]> {
  if (!userId) return [];

  let orders: Order[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        orders = data as Order[];
      }
    } catch (e) {
      console.warn('Supabase getUserOrders failed, using local:', e);
    }
  }

  if (orders.length === 0) {
    const local = getLocalOrders().filter((o) => o.user_id === userId);
    orders =
      statusFilter && statusFilter !== 'all'
        ? local.filter((o) => o.status === statusFilter)
        : local;
  }

  // Hydrate items for each order
  const hydrated: OrderWithDetails[] = [];
  for (const order of orders) {
    const details = await getOrderById(order.id);
    if (details) hydrated.push(details);
    else hydrated.push({ ...order, items: [] });
  }

  return hydrated;
}

export interface GetAdminOrdersParams {
  status?: OrderStatus | 'all';
  payment_status?: string | 'all';
  shipping_status?: string | 'all';
  search?: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'grand_total' | 'order_number';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Fetch orders for admin management (/admin/orders)
 * Enhanced with Section 19, 20, 22 requirements
 */
export async function getAdminOrders(
  params: GetAdminOrdersParams = {}
): Promise<{ orders: OrderWithDetails[]; total: number; page: number; totalPages: number }> {
  const {
    status = 'all',
    payment_status = 'all',
    shipping_status = 'all',
    search = '',
    datePreset = 'all',
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = params;

  let allOrders: Order[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (payment_status && payment_status !== 'all') {
        query = query.eq('payment_status', payment_status);
      }

      if (search.trim()) {
        query = query.or(
          `order_number.ilike.%${search.trim()}%,customer_name.ilike.%${search.trim()}%,customer_phone.ilike.%${search.trim()}%`
        );
      }

      const { data, count, error } = await query;
      if (!error && data) {
        allOrders = data as Order[];
      }
    } catch (e) {
      console.warn('Supabase getAdminOrders failed, using local:', e);
    }
  }

  if (allOrders.length === 0) {
    allOrders = getLocalOrders();
  }

  // Filter in memory for precise criteria
  let filtered = allOrders;

  if (status && status !== 'all') {
    filtered = filtered.filter((o) => o.status === status);
  }

  if (payment_status && payment_status !== 'all') {
    filtered = filtered.filter((o) => o.payment_status === payment_status);
  }

  if (shipping_status && shipping_status !== 'all') {
    if (shipping_status === 'pending_shipment') {
      filtered = filtered.filter((o) => o.status === 'pending_payment' || o.status === 'processing');
    } else if (shipping_status === 'delivered') {
      filtered = filtered.filter((o) => o.status === 'completed');
    } else {
      filtered = filtered.filter((o) => o.status === shipping_status);
    }
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q)
    );
  }

  // Date Filtering (Section 20)
  if (datePreset && datePreset !== 'all') {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    filtered = filtered.filter((o) => {
      const od = new Date(o.created_at);
      switch (datePreset) {
        case 'today': {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          return od >= startOfToday && od <= endOfToday;
        }
        case 'yesterday': {
          const startOfYest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
          const endOfYest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
          return od >= startOfYest && od <= endOfYest;
        }
        case '7d': {
          const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return od >= d7 && od <= endOfToday;
        }
        case '30d': {
          const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return od >= d30 && od <= endOfToday;
        }
        case 'this_month': {
          const som = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          return od >= som && od <= endOfToday;
        }
        case 'last_month': {
          const solm = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
          const eolm = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          return od >= solm && od <= eolm;
        }
        case 'this_year': {
          const soy = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          return od >= soy && od <= endOfToday;
        }
        case 'custom': {
          if (startDate && endDate) {
            const s = new Date(startDate + 'T00:00:00');
            const e = new Date(endDate + 'T23:59:59');
            return od >= s && od <= e;
          }
          return true;
        }
        default:
          return true;
      }
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'grand_total') {
      return sortOrder === 'asc' ? a.grand_total - b.grand_total : b.grand_total - a.grand_total;
    }
    if (sortBy === 'order_number') {
      return sortOrder === 'asc'
        ? a.order_number.localeCompare(b.order_number)
        : b.order_number.localeCompare(a.order_number);
    }
    // Default created_at
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * limit;
  const paginatedOrders = filtered.slice(startIndex, startIndex + limit);

  const hydratedList: OrderWithDetails[] = [];
  for (const o of paginatedOrders) {
    const details = await getOrderById(o.id);
    if (details) hydratedList.push(details);
    else hydratedList.push({ ...o, items: [] });
  }

  return {
    orders: hydratedList,
    total,
    page: safePage,
    totalPages,
  };
}

/**
 * Admin: Update order status with strict workflow validation (Section 28 & 40)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy: string = 'Admin',
  note?: string
): Promise<OrderWithDetails> {
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  const oldStatus = currentOrder.status;

  // Validate allowed status transitions
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending_payment: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['completed', 'cancelled'],
    completed: [], // Terminal status
    cancelled: [], // Terminal status
  };

  if (!allowedTransitions[oldStatus].includes(newStatus)) {
    throw new Error(
      `Perubahan status tidak diizinkan dari "${oldStatus}" menjadi "${newStatus}".`
    );
  }

  const now = new Date().toISOString();

  const historyRecord: OrderStatusHistory = {
    id: crypto.randomUUID(),
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: changedBy,
    note: note || `Status pesanan diubah dari ${oldStatus} menjadi ${newStatus}.`,
    created_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: now })
        .eq('id', orderId);

      await supabase.from('order_status_history').insert(historyRecord);
    } catch (e) {
      console.warn('Supabase updateOrderStatus failed, using local:', e);
    }
  }

  // Update local storage
  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], status: newStatus, updated_at: now };
    saveLocalOrders(orders);
  }

  const historyList = getLocalOrderHistory();
  historyList.push(historyRecord);
  saveLocalOrderHistory(historyList);

  // Log admin audit action (Section 41)
  logAdminAction(
    'UPDATE_ORDER_STATUS',
    'order',
    orderId,
    { status: oldStatus },
    { status: newStatus, note: note || null },
    changedBy
  ).catch((e) => console.warn('Audit log error:', e));

  // Customer Notifications (Section 33)
  if (newStatus === 'shipped') {
    sendCustomerNotification(
      currentOrder.user_id,
      'order_shipped',
      'Pesanan Anda Telah Dikirim',
      `Pesanan ${currentOrder.order_number} telah diserahkan ke jasa kurir dan sedang dalam perjalanan pengiriman.`,
      'order',
      currentOrder.order_number
    ).catch(() => {});
  } else if (newStatus === 'completed') {
    sendCustomerNotification(
      currentOrder.user_id,
      'order_delivered',
      'Pesanan Anda Telah Diterima',
      `Pesanan ${currentOrder.order_number} telah diterima dengan baik. Terima kasih atas kepercayaan Anda berbelanja komoditas pangan bersama kami!`,
      'order',
      currentOrder.order_number
    ).catch(() => {});
  }

  const updatedDetails = await getOrderById(orderId);
  if (!updatedDetails) {
    throw new Error('Gagal memuat ulang data pesanan yang diperbarui.');
  }

  return updatedDetails;
}
