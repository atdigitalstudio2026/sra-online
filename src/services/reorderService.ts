/**
 * Reorder ("Beli Lagi") Service
 * Handles re-purchasing items from past orders.
 * Strictly resolves CURRENT ACTIVE PRICING and validates live stock.
 */

import { OrderWithDetails, ProductWithDetails } from '../types';
import { getProductById } from './productService';
import { addCartItem } from './cartService';
import { getAdminOrders } from './orderService';

export interface ReorderResultItem {
  product_id: string;
  name: string;
  requested_quantity: number;
  added_quantity: number;
  old_order_price: number;
  current_price: number;
  price_changed: boolean;
  success: boolean;
  error?: string;
}

export interface ReorderSummary {
  success: boolean;
  total_items_requested: number;
  items_added_count: number;
  failed_items_count: number;
  items: ReorderResultItem[];
  message: string;
}

/**
 * Execute Reorder for an entire past order
 */
export async function reorderPastOrder(
  order: OrderWithDetails,
  userId?: string | null
): Promise<ReorderSummary> {
  const items = order.items || [];
  if (items.length === 0) {
    return {
      success: false,
      total_items_requested: 0,
      items_added_count: 0,
      failed_items_count: 0,
      items: [],
      message: 'Tidak ada item dalam pesanan ini untuk dibeli kembali.',
    };
  }

  const results: ReorderResultItem[] = [];
  let addedCount = 0;
  let failedCount = 0;

  for (const item of items) {
    const product = await getProductById(item.product_id);

    const itemPrice = item.unit_price ?? item.price ?? 0;

    if (!product || !product.is_active) {
      results.push({
        product_id: item.product_id,
        name: item.product_name,
        requested_quantity: item.quantity,
        added_quantity: 0,
        old_order_price: itemPrice,
        current_price: 0,
        price_changed: false,
        success: false,
        error: 'Produk ini sudah tidak tersedia.',
      });
      failedCount++;
      continue;
    }

    if (product.stock <= 0) {
      results.push({
        product_id: item.product_id,
        name: product.name,
        requested_quantity: item.quantity,
        added_quantity: 0,
        old_order_price: itemPrice,
        current_price: product.price,
        price_changed: product.price !== itemPrice,
        success: false,
        error: 'Stok saat ini tidak mencukupi (habis).',
      });
      failedCount++;
      continue;
    }

    // Determine safe quantity according to available stock
    const safeQty = Math.min(item.quantity, product.stock);

    try {
      // addCartItem resolves current live price in cartService
      await addCartItem(product.id, safeQty, userId);

      const priceChanged = product.price !== itemPrice;
      results.push({
        product_id: product.id,
        name: product.name,
        requested_quantity: item.quantity,
        added_quantity: safeQty,
        old_order_price: itemPrice,
        current_price: product.price, // Uses current price!
        price_changed: priceChanged,
        success: true,
      });
      addedCount++;
    } catch (err: any) {
      results.push({
        product_id: product.id,
        name: product.name,
        requested_quantity: item.quantity,
        added_quantity: 0,
        old_order_price: itemPrice,
        current_price: product.price,
        price_changed: false,
        success: false,
        error: err.message || 'Gagal menambahkan ke keranjang.',
      });
      failedCount++;
    }
  }

  const allSuccess = failedCount === 0;
  const partialSuccess = addedCount > 0 && failedCount > 0;

  let message = '';
  if (allSuccess) {
    message = `Berhasil memasukkan ${addedCount} produk ke keranjang belanja dengan harga terkini.`;
  } else if (partialSuccess) {
    message = `${addedCount} produk berhasil dimasukkan, namun ${failedCount} produk gagal (stok habis atau nonaktif).`;
  } else {
    message = 'Semua produk dalam pesanan lama sudah tidak tersedia atau stok habis.';
  }

  return {
    success: addedCount > 0,
    total_items_requested: items.length,
    items_added_count: addedCount,
    failed_items_count: failedCount,
    items: results,
    message,
  };
}
