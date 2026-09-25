import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CustomerMetric,
  CustomerDetailWithOrders,
  CustomerSegmentation,
  OrderWithDetails,
  AdminUser,
} from '../types';
import { getAdminOrders } from './orderService';
import { hasPermission } from './adminUserService';
import { logAdminAction } from './auditLogService';

/**
 * Valid order status criteria for counting revenue and valid purchases (Section 48 & 50)
 */
function isValidOrder(order: OrderWithDetails): boolean {
  if (order.status === 'cancelled') return false;
  return order.payment_status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'completed';
}

/**
 * Fetch all aggregated customer metrics from database & orders (Sections 14-17)
 */
export async function getCustomerMetrics(params?: {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}): Promise<CustomerMetric[]> {
  // 1. Fetch all orders across system
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const allOrders = ordersRes.orders;

  // 2. Group orders by customer phone number or email (primary customer identifier)
  const customerMap = new Map<string, {
    name: string;
    phone: string;
    email: string | null;
    orders: OrderWithDetails[];
    firstSeen: string;
    lastSeen: string;
  }>();

  for (const o of allOrders) {
    const key = o.customer_phone || o.customer_email || o.customer_name;
    if (!key) continue;

    const existing = customerMap.get(key);
    if (!existing) {
      customerMap.set(key, {
        name: o.customer_name,
        phone: o.customer_phone,
        email: o.customer_email || null,
        orders: [o],
        firstSeen: o.created_at,
        lastSeen: o.created_at,
      });
    } else {
      existing.orders.push(o);
      if (new Date(o.created_at) < new Date(existing.firstSeen)) {
        existing.firstSeen = o.created_at;
      }
      if (new Date(o.created_at) > new Date(existing.lastSeen)) {
        existing.lastSeen = o.created_at;
      }
    }
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 3. Aggregate metrics for each customer
  const metricsList: CustomerMetric[] = [];

  customerMap.forEach((cData, key) => {
    const totalOrders = cData.orders.length;
    const completedOrders = cData.orders.filter((o) => o.status === 'completed').length;
    const cancelledOrders = cData.orders.filter((o) => o.status === 'cancelled').length;

    // Financial rule (Section 50): only valid orders count towards total spending
    const validOrders = cData.orders.filter(isValidOrder);
    const totalSpending = validOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
    const aov = validOrders.length > 0 ? Math.round(totalSpending / validOrders.length) : 0;

    // Segmentation rule (Section 17)
    let segmentation: CustomerSegmentation = 'new';
    const lastDate = new Date(cData.lastSeen);

    if (totalOrders === 0 || lastDate < ninetyDaysAgo) {
      segmentation = 'inactive';
    } else if (validOrders.length >= 2) {
      segmentation = 'repeat';
    } else if (validOrders.length === 1) {
      segmentation = 'new';
    } else {
      segmentation = 'active';
    }

    const isActive = segmentation !== 'inactive' && cancelledOrders < totalOrders;

    // Use URL-safe customer ID (e.g. phone number encoded or UUID)
    const customerId = encodeURIComponent(cData.phone || key);

    metricsList.push({
      id: customerId,
      name: cData.name,
      phone: cData.phone,
      email: cData.email,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      total_spending: totalSpending,
      average_order_value: aov,
      last_order_date: cData.lastSeen,
      segmentation,
      status: isActive ? 'active' : 'inactive',
      registration_date: cData.firstSeen,
    });
  });

  // Sort by highest spending descending
  let result = metricsList.sort((a, b) => b.total_spending - a.total_spending);

  // Filter by search
  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  // Filter by status
  if (params?.status && params.status !== 'all') {
    result = result.filter((c) => c.status === params.status);
  }

  return result;
}

/**
 * Fetch individual customer details and full order history (Section 15)
 */
export async function getCustomerDetail(customerId: string): Promise<CustomerDetailWithOrders | null> {
  const decodedKey = decodeURIComponent(customerId);
  const allMetrics = await getCustomerMetrics();
  const metric = allMetrics.find(
    (c) => c.id === customerId || c.phone === decodedKey || c.email === decodedKey || c.name === decodedKey
  );

  if (!metric) return null;

  // Fetch orders specifically matching this customer
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const customerOrders = ordersRes.orders.filter(
    (o) =>
      o.customer_phone === metric.phone ||
      (o.customer_email && o.customer_email === metric.email) ||
      o.customer_name === metric.name
  );

  return {
    ...metric,
    orders: customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  };
}

/**
 * Export customer data to CSV (Section 18 & 60)
 * Enforces permission check and strictly strips authentication secrets
 */
export async function exportCustomersToCsv(actor: AdminUser): Promise<string> {
  // Permission check
  if (!hasPermission(actor.role, 'customers.export')) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin untuk mengekspor data pelanggan.');
  }

  const customers = await getCustomerMetrics();

  // CSV Headers (Section 18)
  const headers = ['Nama', 'Nomor Telepon', 'Email', 'Total Pesanan', 'Total Belanja (IDR)', 'Rata-Rata Pesanan (IDR)', 'Pesanan Terakhir', 'Segmentasi', 'Status'];

  const rows = customers.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.phone}"`,
    `"${c.email || '-'}"`,
    c.total_orders,
    c.total_spending,
    c.average_order_value,
    `"${c.last_order_date || '-'}"`,
    `"${c.segmentation}"`,
    `"${c.status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  await logAdminAction(
    'EXPORT_CUSTOMERS_CSV',
    'customer_export',
    'all',
    null,
    { count: customers.length },
    actor.name
  );

  return csvContent;
}
