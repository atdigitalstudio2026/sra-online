import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  SalesSummary,
  SalesOverTimePoint,
  TopSellingProduct,
  CategoryAnalytics,
  BrandAnalytics,
  DateFilterRange,
  OrderWithDetails,
  OrderStatus,
  PaymentAttemptStatus,
  AdminUser,
  DailySalesRow,
  MonthlySalesRow,
  YearlySalesRow,
  ProductPerformanceItem,
} from '../types';
import { getAdminOrders } from './orderService';
import { getProducts } from './productService';
import { getCustomerMetrics } from './customerService';
import { getAllPaymentsAdmin } from './payment/paymentService';
import { hasPermission } from './adminUserService';
import { logAdminAction } from './auditLogService';

/**
 * Filter orders within date range preset or custom start/end
 */
function isDateInRange(dateIso: string, range?: DateFilterRange): boolean {
  if (!range || range.preset === 'all') return true;

  const targetDate = new Date(dateIso);
  const now = new Date();

  // Reset now to end of today
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (range.preset) {
    case 'today': {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return targetDate >= startOfToday && targetDate <= endOfToday;
    }
    case 'yesterday': {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return targetDate >= startOfYesterday && targetDate <= endOfYesterday;
    }
    case '7d': {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return targetDate >= sevenDaysAgo && targetDate <= endOfToday;
    }
    case '30d': {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return targetDate >= thirtyDaysAgo && targetDate <= endOfToday;
    }
    case '90d': {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return targetDate >= ninetyDaysAgo && targetDate <= endOfToday;
    }
    case '12m': {
      const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return targetDate >= twelveMonthsAgo && targetDate <= endOfToday;
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return targetDate >= startOfMonth && targetDate <= endOfToday;
    }
    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return targetDate >= startOfLastMonth && targetDate <= endOfLastMonth;
    }
    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      return targetDate >= startOfYear && targetDate <= endOfToday;
    }
    case 'custom': {
      if (range.startDate && range.endDate) {
        const start = new Date(range.startDate + 'T00:00:00');
        const end = new Date(range.endDate + 'T23:59:59');
        return targetDate >= start && targetDate <= end;
      }
      return true;
    }
    default:
      return true;
  }
}

/**
 * Valid order criteria (Section 4, 48):
 * - Excludes cancelled orders!
 * - Payment status must be paid (or in active processing/shipping)
 */
function isValidOrder(o: OrderWithDetails): boolean {
  if (o.status === 'cancelled') return false;
  return o.payment_status === 'paid' || o.status === 'processing' || o.status === 'shipped' || o.status === 'completed';
}

/**
 * 1. Global Sales Summary & Operational KPIs (Sections 2, 3, 6, 7, 23, 24)
 */
export async function getSalesSummary(dateRange?: DateFilterRange): Promise<SalesSummary> {
  const [ordersRes, prodsRes, custs, payments] = await Promise.all([
    getAdminOrders({ limit: 1000 }),
    getProducts({ limit: 500, is_active: undefined }),
    getCustomerMetrics(),
    getAllPaymentsAdmin(),
  ]);

  const allOrders = ordersRes.orders;
  const filteredOrders = allOrders.filter((o) => isDateInRange(o.created_at, dateRange));

  const validOrders = filteredOrders.filter(isValidOrder);
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled');

  let grossSales = 0;
  let totalDiscounts = 0;
  let totalShipping = 0;
  let itemsSold = 0;

  for (const vo of validOrders) {
    grossSales += Number(vo.subtotal || 0);
    totalDiscounts += Number(vo.discount || 0);
    totalShipping += Number(vo.shipping_cost || 0);
    if (vo.items) {
      itemsSold += vo.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }
  }

  // Formula (Section 23): Net Sales = Gross Sales - Discount
  const netSales = Math.max(0, grossSales - totalDiscounts);
  // Formula (Section 24): AOV = Valid Net Sales / Valid Orders
  const aov = validOrders.length > 0 ? Math.round(netSales / validOrders.length) : 0;

  // Time-based sales (Today, This Week, This Month, This Year)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);

  let todaySales = 0;
  let thisWeekSales = 0;
  let thisMonthSales = 0;
  let thisYearSales = 0;

  for (const o of allOrders) {
    if (!isValidOrder(o)) continue;
    const od = new Date(o.created_at);
    const amount = Number(o.subtotal || 0) - Number(o.discount || 0);

    if (od >= startOfToday) todaySales += amount;
    if (od >= startOfWeek) thisWeekSales += amount;
    if (od >= startOfMonth) thisMonthSales += amount;
    if (od >= startOfYear) thisYearSales += amount;
  }

  // Operational Counts
  const pendingPaymentsCount = allOrders.filter((o) => o.payment_status === 'unpaid' && o.status !== 'cancelled').length;
  const ordersToProcessCount = allOrders.filter((o) => o.status === 'processing').length;
  const ordersToShipCount = allOrders.filter((o) => o.status === 'processing' || o.status === 'shipped').length;

  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const p of prodsRes.data) {
    if (p.stock === 0) outOfStockCount++;
    else if (p.stock <= (p.low_stock_threshold || 10)) lowStockCount++;
  }

  // Order status counts
  const orderStatusCounts: Record<OrderStatus, number> = {
    pending_payment: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const o of filteredOrders) {
    if (orderStatusCounts[o.status] !== undefined) {
      orderStatusCounts[o.status]++;
    }
  }

  // Payment status counts (Section 7: From payments data)
  const paymentStatusCounts: Record<PaymentAttemptStatus, number> = {
    paid: 0,
    pending: 0,
    failed: 0,
    expired: 0,
    cancelled: 0,
    refunded: 0,
  };
  for (const p of payments) {
    if (isDateInRange(p.created_at, dateRange)) {
      if (paymentStatusCounts[p.status] !== undefined) {
        paymentStatusCounts[p.status]++;
      }
    }
  }

  // Shipping status counts (Section 8: Data from orders and shipments)
  const shippingStatusCounts: Record<string, number> = {
    pending_shipment: 0,
    processing: 0,
    shipped: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    returned: 0,
  };
  for (const o of filteredOrders) {
    if (o.status === 'processing') {
      shippingStatusCounts.processing++;
    } else if (o.status === 'shipped') {
      shippingStatusCounts.shipped++;
    } else if (o.status === 'completed') {
      shippingStatusCounts.delivered++;
    } else if (o.status === 'pending_payment') {
      shippingStatusCounts.pending_shipment++;
    }
  }

  return {
    gross_sales: grossSales,
    discounts: totalDiscounts,
    shipping_revenue: totalShipping,
    net_sales: netSales,
    total_orders: filteredOrders.length,
    valid_orders: validOrders.length,
    cancelled_orders: cancelledOrders.length,
    items_sold: itemsSold,
    average_order_value: aov,
    today_sales: todaySales,
    this_week_sales: thisWeekSales,
    this_month_sales: thisMonthSales,
    this_year_sales: thisYearSales,
    pending_payments_count: pendingPaymentsCount,
    orders_to_process_count: ordersToProcessCount,
    orders_to_ship_count: ordersToShipCount,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    total_customers_count: custs.length,
    total_products_count: prodsRes.total,
    order_status_counts: orderStatusCounts,
    payment_status_counts: paymentStatusCounts,
    shipping_status_counts: shippingStatusCounts,
  };
}

/**
 * 2. Sales Over Time Trend Chart (Section 4 & 5)
 */
export async function getSalesTrend(dateRange?: DateFilterRange): Promise<SalesOverTimePoint[]> {
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const allOrders = ordersRes.orders;

  const validOrders = allOrders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));

  // Determine granularity: daily grouping
  const dayMap = new Map<string, { sales: number; orders: number; label: string }>();

  // If 7d or 30d, generate continuous daily buckets
  const now = new Date();
  const daysToGenerate = dateRange?.preset === '7d' ? 7 : dateRange?.preset === '30d' ? 30 : 14;

  for (let i = daysToGenerate - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    dayMap.set(dateKey, { sales: 0, orders: 0, label });
  }

  for (const vo of validOrders) {
    const dateKey = vo.created_at.split('T')[0];
    const amount = Number(vo.subtotal || 0) - Number(vo.discount || 0);

    const existing = dayMap.get(dateKey);
    if (existing) {
      existing.sales += amount;
      existing.orders += 1;
    } else {
      const d = new Date(vo.created_at);
      dayMap.set(dateKey, {
        sales: amount,
        orders: 1,
        label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      });
    }
  }

  return Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      label: data.label,
      sales: data.sales,
      orders: data.orders,
    }));
}

/**
 * 3. Top Selling Products (Section 9, 10, 49)
 * Strictly calculated using snapshot order_items.unit_price * quantity from valid orders
 */
export async function getTopProducts(
  dateRange?: DateFilterRange,
  limit: number = 10,
  sortBy: 'units' | 'revenue' = 'units'
): Promise<TopSellingProduct[]> {
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));

  const productAgg = new Map<string, {
    product_id: string;
    product_name: string;
    product_sku: string;
    units_sold: number;
    revenue: number;
  }>();

  for (const o of validOrders) {
    if (!o.items) continue;
    for (const item of o.items) {
      const existing = productAgg.get(item.product_id);
      const itemRev = Number(item.unit_price || 0) * Number(item.quantity || 0);

      if (existing) {
        existing.units_sold += Number(item.quantity || 0);
        existing.revenue += itemRev;
      } else {
        productAgg.set(item.product_id, {
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku || '-',
          units_sold: Number(item.quantity || 0),
          revenue: itemRev,
        });
      }
    }
  }

  let list = Array.from(productAgg.values());

  if (sortBy === 'revenue') {
    list.sort((a, b) => b.revenue - a.revenue);
  } else {
    list.sort((a, b) => b.units_sold - a.units_sold);
  }

  return list.slice(0, limit).map((p, idx) => ({
    rank: idx + 1,
    product_id: p.product_id,
    product_name: p.product_name,
    product_sku: p.product_sku,
    category_name: 'Komoditas Pangan',
    units_sold: p.units_sold,
    revenue: p.revenue,
  }));
}

/**
 * 4. Category Performance Analytics (Section 12)
 */
export async function getCategoryPerformance(dateRange?: DateFilterRange): Promise<CategoryAnalytics[]> {
  const [ordersRes, prodsRes] = await Promise.all([
    getAdminOrders({ limit: 1000 }),
    getProducts({ limit: 500, is_active: undefined }),
  ]);

  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));
  const productCategoryMap = new Map<string, string>();
  for (const p of prodsRes.data) {
    productCategoryMap.set(p.id, p.category?.name || 'Komoditas Umum');
  }

  let grandNet = 0;
  const catAgg = new Map<string, { products_sold: number; revenue: number; orderIds: Set<string> }>();

  for (const o of validOrders) {
    if (!o.items) continue;
    for (const item of o.items) {
      const catName = productCategoryMap.get(item.product_id) || 'Komoditas Pangan';
      const itemRev = Number(item.unit_price || 0) * Number(item.quantity || 0);
      grandNet += itemRev;

      const existing = catAgg.get(catName);
      if (existing) {
        existing.products_sold += Number(item.quantity || 0);
        existing.revenue += itemRev;
        existing.orderIds.add(o.id);
      } else {
        catAgg.set(catName, {
          products_sold: Number(item.quantity || 0),
          revenue: itemRev,
          orderIds: new Set([o.id]),
        });
      }
    }
  }

  return Array.from(catAgg.entries())
    .map(([category_name, data]) => ({
      category_id: category_name,
      category_name,
      products_sold: data.products_sold,
      revenue: data.revenue,
      orders_count: data.orderIds.size,
      percentage_of_sales: grandNet > 0 ? Math.round((data.revenue / grandNet) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * 5. Brand Performance Analytics (Section 13)
 */
export async function getBrandPerformance(dateRange?: DateFilterRange): Promise<BrandAnalytics[]> {
  const [ordersRes, prodsRes] = await Promise.all([
    getAdminOrders({ limit: 1000 }),
    getProducts({ limit: 500, is_active: undefined }),
  ]);

  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));
  const productBrandMap = new Map<string, string>();
  for (const p of prodsRes.data) {
    productBrandMap.set(p.id, p.brand?.name || 'Agro Nusantara');
  }

  const brandAgg = new Map<string, { units_sold: number; revenue: number; orderIds: Set<string> }>();

  for (const o of validOrders) {
    if (!o.items) continue;
    for (const item of o.items) {
      const brandName = productBrandMap.get(item.product_id) || 'Agro Nusantara';
      const itemRev = Number(item.unit_price || 0) * Number(item.quantity || 0);

      const existing = brandAgg.get(brandName);
      if (existing) {
        existing.units_sold += Number(item.quantity || 0);
        existing.revenue += itemRev;
        existing.orderIds.add(o.id);
      } else {
        brandAgg.set(brandName, {
          units_sold: Number(item.quantity || 0),
          revenue: itemRev,
          orderIds: new Set([o.id]),
        });
      }
    }
  }

  return Array.from(brandAgg.entries())
    .map(([brand_name, data]) => ({
      brand_id: brand_name,
      brand_name,
      units_sold: data.units_sold,
      revenue: data.revenue,
      orders_count: data.orderIds.size,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * 6. Export Sales Report to CSV (Section 28 & 61)
 */
export async function exportSalesReportCsv(dateRange: DateFilterRange, actor: AdminUser): Promise<string> {
  // Permission check (Section 61)
  if (!hasPermission(actor.role, 'reports.export')) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin untuk mengekspor laporan penjualan.');
  }

  const ordersRes = await getAdminOrders({ limit: 1000 });
  const filteredOrders = ordersRes.orders.filter((o) => isDateInRange(o.created_at, dateRange));

  const headers = ['Nomor Pesanan', 'Tanggal', 'Nama Pelanggan', 'No WhatsApp', 'Subtotal', 'Diskon', 'Ongkir', 'Grand Total', 'Status Pesanan', 'Status Pembayaran'];

  const rows = filteredOrders.map((o) => [
    `"${o.order_number}"`,
    `"${o.created_at}"`,
    `"${o.customer_name.replace(/"/g, '""')}"`,
    `"${o.customer_phone}"`,
    o.subtotal,
    o.discount,
    o.shipping_cost,
    o.grand_total,
    `"${o.status}"`,
    `"${o.payment_status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  await logAdminAction(
    'EXPORT_SALES_REPORT',
    'sales_report',
    dateRange.preset,
    null,
    { count: filteredOrders.length },
    actor.name
  );

  return csvContent;
}

/**
 * 7. Export Sales Report to Excel-compatible HTML/XML (Section 28)
 */
export async function exportSalesReportExcel(dateRange: DateFilterRange, actor: AdminUser): Promise<string> {
  if (!hasPermission(actor.role, 'reports.export')) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin untuk mengekspor laporan penjualan.');
  }

  const ordersRes = await getAdminOrders({ limit: 1000 });
  const filteredOrders = ordersRes.orders.filter((o) => isDateInRange(o.created_at, dateRange));

  const rows = filteredOrders.map(
    (o) => `<tr>
      <td>${o.order_number}</td>
      <td>${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
      <td>${o.customer_name}</td>
      <td>${o.customer_phone}</td>
      <td>${o.subtotal}</td>
      <td>${o.discount}</td>
      <td>${o.shipping_cost}</td>
      <td>${o.grand_total}</td>
      <td>${o.status}</td>
      <td>${o.payment_status}</td>
    </tr>`
  );

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /></head>
    <body>
      <table border="1">
        <thead>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <th>Nomor Pesanan</th>
            <th>Tanggal</th>
            <th>Nama Pelanggan</th>
            <th>No WhatsApp</th>
            <th>Subtotal</th>
            <th>Diskon</th>
            <th>Ongkir</th>
            <th>Grand Total</th>
            <th>Status Pesanan</th>
            <th>Status Pembayaran</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('\n')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  await logAdminAction(
    'EXPORT_SALES_REPORT_EXCEL',
    'sales_report',
    dateRange.preset,
    null,
    { count: filteredOrders.length },
    actor.name
  );

  return html;
}

/**
 * 8. Product Performance Analytics with Filters (Section 11)
 * Product, SKU, Category, Units Sold, Revenue, Orders, Average Selling Price
 */
export async function getProductPerformance(
  dateRange?: DateFilterRange,
  categoryId?: string,
  brandId?: string
): Promise<ProductPerformanceItem[]> {
  const [ordersRes, prodsRes] = await Promise.all([
    getAdminOrders({ limit: 1000 }),
    getProducts({ limit: 500, is_active: undefined }),
  ]);

  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));

  // Build product lookup map
  const productMap = new Map<string, any>();
  for (const p of prodsRes.data) {
    productMap.set(p.id, p);
  }

  const aggMap = new Map<
    string,
    {
      product_id: string;
      product_name: string;
      sku: string;
      category_name: string;
      brand_name: string;
      units_sold: number;
      revenue: number;
      orderIds: Set<string>;
    }
  >();

  for (const o of validOrders) {
    if (!o.items) continue;
    for (const item of o.items) {
      const prodInfo = productMap.get(item.product_id);
      const catId = prodInfo?.category_id || '';
      const bId = prodInfo?.brand_id || '';

      if (categoryId && categoryId !== 'all' && catId !== categoryId) continue;
      if (brandId && brandId !== 'all' && bId !== brandId) continue;

      const catName = prodInfo?.category?.name || 'Komoditas Pangan';
      const bName = prodInfo?.brand?.name || 'Agro Nusantara';
      const itemRev = Number(item.unit_price || 0) * Number(item.quantity || 0);

      const existing = aggMap.get(item.product_id);
      if (existing) {
        existing.units_sold += Number(item.quantity || 0);
        existing.revenue += itemRev;
        existing.orderIds.add(o.id);
      } else {
        aggMap.set(item.product_id, {
          product_id: item.product_id,
          product_name: item.product_name || prodInfo?.name || 'Komoditas',
          sku: item.product_sku || prodInfo?.sku || '-',
          category_name: catName,
          brand_name: bName,
          units_sold: Number(item.quantity || 0),
          revenue: itemRev,
          orderIds: new Set([o.id]),
        });
      }
    }
  }

  return Array.from(aggMap.values())
    .map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      category_name: item.category_name,
      brand_name: item.brand_name,
      units_sold: item.units_sold,
      revenue: item.revenue,
      orders_count: item.orderIds.size,
      average_selling_price:
        item.units_sold > 0 ? Math.round(item.revenue / item.units_sold) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * 9. Daily Sales Table (Section 25)
 * Date, Orders, Items Sold, Gross Sales, Discount, Shipping, Net Sales
 */
export async function getDailySalesTable(dateRange?: DateFilterRange): Promise<DailySalesRow[]> {
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));

  const dayMap = new Map<
    string,
    {
      date: string;
      orders: number;
      items_sold: number;
      gross_sales: number;
      discount: number;
      shipping: number;
      net_sales: number;
    }
  >();

  for (const o of validOrders) {
    const dateKey = o.created_at.split('T')[0];
    const itemsCount = o.items ? o.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0;
    const gross = Number(o.subtotal || 0);
    const disc = Number(o.discount || 0);
    const ship = Number(o.shipping_cost || 0);
    const net = Math.max(0, gross - disc);

    const existing = dayMap.get(dateKey);
    if (existing) {
      existing.orders += 1;
      existing.items_sold += itemsCount;
      existing.gross_sales += gross;
      existing.discount += disc;
      existing.shipping += ship;
      existing.net_sales += net;
    } else {
      dayMap.set(dateKey, {
        date: dateKey,
        orders: 1,
        items_sold: itemsCount,
        gross_sales: gross,
        discount: disc,
        shipping: ship,
        net_sales: net,
      });
    }
  }

  return Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 10. Monthly Sales Table (Section 26)
 * Month, Orders, Items Sold, Gross Sales, Discount, Net Sales
 */
export async function getMonthlySalesTable(dateRange?: DateFilterRange): Promise<MonthlySalesRow[]> {
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));

  const monthMap = new Map<
    string,
    {
      month: string;
      orders: number;
      items_sold: number;
      gross_sales: number;
      discount: number;
      net_sales: number;
    }
  >();

  for (const o of validOrders) {
    const monthKey = o.created_at.substring(0, 7); // YYYY-MM
    const itemsCount = o.items ? o.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0;
    const gross = Number(o.subtotal || 0);
    const disc = Number(o.discount || 0);
    const net = Math.max(0, gross - disc);

    const existing = monthMap.get(monthKey);
    if (existing) {
      existing.orders += 1;
      existing.items_sold += itemsCount;
      existing.gross_sales += gross;
      existing.discount += disc;
      existing.net_sales += net;
    } else {
      monthMap.set(monthKey, {
        month: monthKey,
        orders: 1,
        items_sold: itemsCount,
        gross_sales: gross,
        discount: disc,
        net_sales: net,
      });
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * 11. Yearly Sales Table (Section 27)
 * Year, Orders, Items Sold, Gross Sales, Discount, Net Sales
 */
export async function getYearlySalesTable(dateRange?: DateFilterRange): Promise<YearlySalesRow[]> {
  const ordersRes = await getAdminOrders({ limit: 1000 });
  const validOrders = ordersRes.orders.filter((o) => isValidOrder(o) && isDateInRange(o.created_at, dateRange));

  const yearMap = new Map<
    string,
    {
      year: string;
      orders: number;
      items_sold: number;
      gross_sales: number;
      discount: number;
      net_sales: number;
    }
  >();

  for (const o of validOrders) {
    const yearKey = o.created_at.substring(0, 4); // YYYY
    const itemsCount = o.items ? o.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0;
    const gross = Number(o.subtotal || 0);
    const disc = Number(o.discount || 0);
    const net = Math.max(0, gross - disc);

    const existing = yearMap.get(yearKey);
    if (existing) {
      existing.orders += 1;
      existing.items_sold += itemsCount;
      existing.gross_sales += gross;
      existing.discount += disc;
      existing.net_sales += net;
    } else {
      yearMap.set(yearKey, {
        year: yearKey,
        orders: 1,
        items_sold: itemsCount,
        gross_sales: gross,
        discount: disc,
        net_sales: net,
      });
    }
  }

  return Array.from(yearMap.values()).sort((a, b) => b.year.localeCompare(a.year));
}
