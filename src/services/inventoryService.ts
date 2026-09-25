import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ProductWithDetails,
  InventoryMovement,
  InventoryStockItem,
  InventoryMovementType,
  AdminUser,
} from '../types';
import { getProducts } from './productService';
import { logAdminAction } from './auditLogService';
import { hasPermission } from './adminUserService';
import { createNotification } from './notificationService';

const LOCAL_MOVEMENTS_KEY = 'fmcg_inventory_movements';

function getLocalMovements(): InventoryMovement[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_MOVEMENTS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading inventory movements from localStorage', e);
  }
  return [];
}

function saveLocalMovements(list: InventoryMovement[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_MOVEMENTS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed saving inventory movements to localStorage', e);
  }
}

/**
 * Get comprehensive inventory summary and item status breakdown (Sections 29-32)
 */
export async function getInventorySummary(): Promise<{
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  reserved_stock_count: number;
  items: InventoryStockItem[];
}> {
  // Fetch all active products
  const prodsRes = await getProducts({ limit: 500, is_active: undefined });
  const products = prodsRes.data;

  let totalStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const reservedStockCount = 0; // future reservations or pending allocations

  const items: InventoryStockItem[] = products.map((product) => {
    const currentStock = Math.max(0, Number(product.stock) || 0);
    const reserved = 0;
    const available = Math.max(0, currentStock - reserved);
    const threshold = Number(product.low_stock_threshold) || 10;

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (currentStock === 0) {
      status = 'out_of_stock';
      outOfStockCount++;
    } else if (currentStock <= threshold) {
      status = 'low_stock';
      lowStockCount++;
    }

    totalStock += currentStock;

    return {
      product,
      current_stock: currentStock,
      reserved_stock: reserved,
      available_stock: available,
      low_stock_threshold: threshold,
      status,
    };
  });

  return {
    total_products: products.length,
    total_stock: totalStock,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    reserved_stock_count: reservedStockCount,
    items,
  };
}

/**
 * Perform manual stock adjustment with strict audit trail & permission check (Sections 33-36)
 */
export async function adjustStock(params: {
  product_id: string;
  quantity_delta: number; // positive to add, negative to reduce
  type: InventoryMovementType;
  reason: string;
  actor: AdminUser;
}): Promise<{ product: ProductWithDetails; movement: InventoryMovement }> {
  // 1. Permission check (Section 36)
  if (!hasPermission(params.actor.role, 'inventory.adjust')) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin untuk melakukan penyesuaian stok.');
  }

  // 2. Reason validation (Section 35: Wajib Reason)
  if (!params.reason || params.reason.trim().length < 3) {
    throw new Error('Alasan penyesuaian stok wajib diisi (minimal 3 karakter).');
  }

  if (params.quantity_delta === 0) {
    throw new Error('Jumlah perubahan stok tidak boleh 0.');
  }

  // 3. Fetch product
  const prodsRes = await getProducts({ limit: 500, is_active: undefined });
  const product = prodsRes.data.find((p) => p.id === params.product_id);
  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  const previousStock = product.stock;
  const newStock = previousStock + params.quantity_delta;

  if (newStock < 0) {
    throw new Error(
      `Stok tidak mencukupi untuk pengurangan ini (stok saat ini: ${previousStock}, pengurangan: ${Math.abs(
        params.quantity_delta
      )}).`
    );
  }

  const now = new Date().toISOString();
  const movementId = crypto.randomUUID();

  const movementRecord: InventoryMovement = {
    id: movementId,
    product_id: product.id,
    type: params.type,
    quantity: params.quantity_delta,
    reference_type: 'manual_adjustment',
    reference_id: `ADJ-${Date.now().toString(36).toUpperCase()}`,
    previous_stock: previousStock,
    new_stock: newStock,
    note: params.reason.trim(),
    created_by: params.actor.name,
    created_at: now,
    product_name: product.name,
    product_sku: product.sku,
  };

  // 4. Update in Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('products')
        .update({ stock: newStock, updated_at: now })
        .eq('id', product.id);

      await supabase.from('inventory_movements').insert({
        id: movementRecord.id,
        product_id: product.id,
        type: movementRecord.type,
        quantity: movementRecord.quantity,
        reference_type: movementRecord.reference_type,
        reference_id: movementRecord.reference_id,
        previous_stock: movementRecord.previous_stock,
        new_stock: movementRecord.new_stock,
        note: movementRecord.note,
        created_by: movementRecord.created_by,
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase stock adjustment error:', e);
    }
  }

  // Update in local storage
  try {
    const rawProds = localStorage.getItem('fmcg_products');
    if (rawProds) {
      const pList = JSON.parse(rawProds);
      const pIdx = pList.findIndex((p: any) => p.id === product.id);
      if (pIdx !== -1) {
        pList[pIdx].stock = newStock;
        pList[pIdx].updated_at = now;
        localStorage.setItem('fmcg_products', JSON.stringify(pList));
      }
    }
  } catch (e) {
    console.warn('Failed local product stock update', e);
  }

  // Save movement locally
  const movements = getLocalMovements();
  movements.unshift(movementRecord);
  saveLocalMovements(movements);

  // 5. Log audit trail (Section 41)
  await logAdminAction(
    'STOCK_ADJUSTMENT',
    'product_stock',
    product.id,
    { stock: previousStock },
    { stock: newStock, delta: params.quantity_delta, reason: params.reason },
    params.actor.name
  );

  // 6. Check low stock notification trigger
  if (newStock <= product.low_stock_threshold) {
    await createNotification(
      'low_stock',
      'Peringatan Stok Menipis',
      `Stok ${product.name} kini tersisa ${newStock} ${product.unit} (di bawah batas ${product.low_stock_threshold}).`,
      'product',
      product.id
    );
  }

  const updatedProduct: ProductWithDetails = {
    ...product,
    stock: newStock,
    updated_at: now,
  };

  return { product: updatedProduct, movement: movementRecord };
}

/**
 * Record inventory movement for orders (e.g. sale or return)
 */
export async function recordOrderInventoryMovement(params: {
  product_id: string;
  quantity: number;
  order_number: string;
  previous_stock: number;
  new_stock: number;
  type?: InventoryMovementType;
  actor_name?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const movement: InventoryMovement = {
    id: crypto.randomUUID(),
    product_id: params.product_id,
    type: params.type || 'sale',
    quantity: params.quantity,
    reference_type: 'order',
    reference_id: params.order_number,
    previous_stock: params.previous_stock,
    new_stock: params.new_stock,
    note: `Pengurangan stok otomatis pesanan ${params.order_number}`,
    created_by: params.actor_name || 'System (Order)',
    created_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('inventory_movements').insert(movement);
    } catch (e) {
      console.warn('Supabase recordOrderInventoryMovement error:', e);
    }
  }

  const movements = getLocalMovements();
  movements.unshift(movement);
  saveLocalMovements(movements);
}

/**
 * Fetch inventory movement history (Section 33 & 34)
 */
export async function getInventoryMovements(params?: {
  productId?: string;
  limit?: number;
}): Promise<InventoryMovement[]> {
  const limit = params?.limit || 50;

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (params?.productId) {
        query = query.eq('product_id', params.productId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as InventoryMovement[];
      }
    } catch (e) {
      console.warn('Supabase getInventoryMovements failed:', e);
    }
  }

  let local = getLocalMovements();
  if (params?.productId) {
    local = local.filter((m) => m.product_id === params.productId);
  }
  return local.slice(0, limit);
}
