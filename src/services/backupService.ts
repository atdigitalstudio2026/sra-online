/**
 * Production Backup & Data Disaster Recovery Service
 * Supports instant CSV and JSON exports for catalog, orders,
 * customers, inventory, and complete database snapshots.
 */

import {
  BackupType,
  BackupHistoryItem,
  ProductWithDetails,
  OrderWithDetails,
  CustomerMetric,
  InventoryStockItem,
} from '../types';
import { getProducts } from './productService';
import { getAdminOrders } from './orderService';
import { getCustomerMetrics } from './customerService';
import { getInventorySummary } from './inventoryService';

const BACKUP_HISTORY_STORAGE_KEY = 'fmcg_backup_history';

/**
 * Triggers a direct file download in the browser
 */
export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert an array of objects to CSV format
 */
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        let val = item[header];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function getBackupHistory(): BackupHistoryItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch {}
  return [];
}

function saveBackupHistoryItem(item: BackupHistoryItem) {
  try {
    if (typeof localStorage !== 'undefined') {
      const history = getBackupHistory();
      history.unshift(item);
      localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    }
  } catch {}
}

/**
 * Generate and trigger export for specific dataset
 */
export async function executeExport(
  type: BackupType,
  format: 'json' | 'csv'
): Promise<BackupHistoryItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let fileName = `backup-${type}-${timestamp}.${format}`;
  let content = '';
  let recordCount = 0;

  if (type === 'catalog') {
    const res = await getProducts({ limit: 1000 });
    const productList = res.data || [];
    const items = productList.map((p: ProductWithDetails) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category?.name || '',
      brand: p.brand?.name || '',
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      is_active: p.is_active,
      is_featured: p.is_featured,
      created_at: p.created_at,
    }));
    recordCount = items.length;
    content = format === 'csv' ? convertToCSV(items) : JSON.stringify(productList, null, 2);
  } else if (type === 'orders') {
    const ordersRes = await getAdminOrders({ limit: 1000 });
    const orderList = ordersRes.orders || [];
    const items = orderList.map((o: OrderWithDetails) => ({
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      grand_total: o.grand_total,
      status: o.status,
      payment_status: o.payment_status,
      shipping_method_name: o.shipping_method_name,
      created_at: o.created_at,
    }));
    recordCount = items.length;
    content = format === 'csv' ? convertToCSV(items) : JSON.stringify(orderList, null, 2);
  } else if (type === 'customers') {
    const customerList = await getCustomerMetrics();
    const items = customerList.map((c: CustomerMetric) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      total_orders: c.total_orders,
      total_spending: c.total_spending,
      segmentation: c.segmentation,
      last_order_date: c.last_order_date || '',
    }));
    recordCount = items.length;
    content = format === 'csv' ? convertToCSV(items) : JSON.stringify(customerList, null, 2);
  } else if (type === 'inventory') {
    const inventoryRes = await getInventorySummary();
    const items = inventoryRes.items.map((i: InventoryStockItem) => ({
      product_id: i.product?.id || '',
      product_name: i.product?.name || '',
      sku: i.product?.sku || '',
      current_stock: i.current_stock,
      available_stock: i.available_stock,
      low_stock_threshold: i.low_stock_threshold,
      status: i.status,
    }));
    recordCount = items.length;
    content = format === 'csv' ? convertToCSV(items) : JSON.stringify(inventoryRes, null, 2);
  } else {
    // Full Snapshot (JSON format)
    const [prodsRes, ordersRes, customers, inventory] = await Promise.all([
      getProducts({ limit: 1000 }),
      getAdminOrders({ limit: 1000 }),
      getCustomerMetrics(),
      getInventorySummary(),
    ]);

    const productList = prodsRes.data || [];
    const orderList = ordersRes.orders || [];

    const snapshot = {
      app: 'ONLINE STORE FMCG Product Catalog',
      version: '1.10.0',
      exported_at: new Date().toISOString(),
      metadata: {
        products_count: productList.length,
        orders_count: orderList.length,
        customers_count: customers.length,
        inventory_items_count: inventory.items.length,
      },
      data: {
        products: productList,
        orders: orderList,
        customers,
        inventory,
      },
    };

    recordCount =
      productList.length + orderList.length + customers.length + inventory.items.length;

    content = JSON.stringify(snapshot, null, 2);
    format = 'json';
    fileName = `backup-full-snapshot-${timestamp}.json`;
  }

  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';
  downloadFile(content, fileName, mimeType);

  const historyItem: BackupHistoryItem = {
    id: `bk-${Date.now()}`,
    type,
    file_name: fileName,
    format,
    record_count: recordCount,
    file_size_bytes: new Blob([content]).size,
    created_at: new Date().toISOString(),
  };

  saveBackupHistoryItem(historyItem);
  return historyItem;
}
