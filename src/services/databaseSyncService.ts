import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_BRANDS, INITIAL_PRODUCTS } from './seedData';
import { getShippingMethods } from './shippingService';
import { INITIAL_VOUCHERS, INITIAL_PROMOTIONS } from './pricingService';

export interface DatabaseSyncReport {
  connected: boolean;
  isConfigured: boolean;
  message: string;
  counts: {
    categories: number;
    brands: number;
    products: number;
    shipping_methods: number;
    vouchers: number;
  };
  syncedAt?: string;
  autoSeeded?: boolean;
}

const DEFAULT_SHIPPING_METHODS_SEED = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    name: 'Regular',
    code: 'REG',
    description: 'Layanan pengiriman standar reguler terpercaya ke seluruh wilayah.',
    price: 15000,
    estimated_days: '2-4 hari',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    name: 'Express',
    code: 'EXP',
    description: 'Pengiriman cepat prioritas untuk kebutuhan mendesak / bahan segar.',
    price: 25000,
    estimated_days: '1-2 hari',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    name: 'Cargo',
    code: 'CARGO',
    description: 'Ekspedisi kargo khusus muatan tonase besar, karungan, dan kartonan bisnis.',
    price: 50000,
    estimated_days: '3-7 hari',
    is_active: true,
    sort_order: 3,
  },
];

/**
 * Checks connectivity and counts records across all core tables
 */
export async function checkDatabaseStatus(): Promise<DatabaseSyncReport> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      isConfigured: false,
      message: 'Supabase credentials belum terkonfigurasi. Aplikasi berjalan menggunakan Local High-Performance Store.',
      counts: {
        categories: INITIAL_CATEGORIES.length,
        brands: INITIAL_BRANDS.length,
        products: INITIAL_PRODUCTS.length,
        shipping_methods: DEFAULT_SHIPPING_METHODS_SEED.length,
        vouchers: INITIAL_VOUCHERS.length,
      },
    };
  }

  try {
    const [catRes, brandRes, prodRes, shipRes, vouchRes] = await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('shipping_methods').select('*', { count: 'exact', head: true }),
      supabase.from('vouchers').select('*', { count: 'exact', head: true }),
    ]);

    const catCount = catRes.count ?? 0;
    const brandCount = brandRes.count ?? 0;
    const prodCount = prodRes.count ?? 0;
    const shipCount = shipRes.count ?? 0;
    const vouchCount = vouchRes.count ?? 0;

    return {
      connected: true,
      isConfigured: true,
      message: `Terhubung aktif ke Supabase PostgreSQL (${prodCount} produk, ${catCount} kategori, ${brandCount} brand terdeteksi).`,
      counts: {
        categories: catCount,
        brands: brandCount,
        products: prodCount,
        shipping_methods: shipCount,
        vouchers: vouchCount,
      },
      syncedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      isConfigured: true,
      message: `Koneksi Supabase gagal atau tabel belum siap: ${errorMsg}`,
      counts: {
        categories: 0,
        brands: 0,
        products: 0,
        shipping_methods: 0,
        vouchers: 0,
      },
    };
  }
}

/**
 * Seeds or syncs seed data to Supabase PostgreSQL database
 */
export async function seedDatabaseToSupabase(): Promise<{
  success: boolean;
  message: string;
  seeded: {
    categories: number;
    brands: number;
    products: number;
    images: number;
    shipping_methods: number;
    promotions: number;
    vouchers: number;
  };
}> {
  const result = {
    categories: 0,
    brands: 0,
    products: 0,
    images: 0,
    shipping_methods: 0,
    promotions: 0,
    vouchers: 0,
  };

  if (!isSupabaseConfigured() || !supabase) {
    // If Supabase not configured, refresh local storage caches
    try {
      localStorage.setItem('fmcg_categories', JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('fmcg_brands', JSON.stringify(INITIAL_BRANDS));
      localStorage.setItem('fmcg_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('fmcg_shipping_methods', JSON.stringify(DEFAULT_SHIPPING_METHODS_SEED));
      localStorage.setItem('fmcg_vouchers', JSON.stringify(INITIAL_VOUCHERS));
      localStorage.setItem('fmcg_promotions', JSON.stringify(INITIAL_PROMOTIONS));
    } catch {}

    return {
      success: true,
      message: 'Database Local Storage berhasil disinkronkan dengan seed data terbaru.',
      seeded: {
        categories: INITIAL_CATEGORIES.length,
        brands: INITIAL_BRANDS.length,
        products: INITIAL_PRODUCTS.length,
        images: INITIAL_PRODUCTS.reduce((acc, p) => acc + (p.images?.length || 0), 0),
        shipping_methods: DEFAULT_SHIPPING_METHODS_SEED.length,
        promotions: INITIAL_PROMOTIONS.length,
        vouchers: INITIAL_VOUCHERS.length,
      },
    };
  }

  try {
    // 1. Categories
    const categoriesToInsert = INITIAL_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image_url: c.image_url,
      is_active: c.is_active,
      sort_order: c.sort_order,
    }));
    const { error: catErr } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, { onConflict: 'id' });
    if (!catErr) result.categories = categoriesToInsert.length;

    // 2. Brands
    const brandsToInsert = INITIAL_BRANDS.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      logo_url: b.logo_url,
      is_active: b.is_active,
    }));
    const { error: brandErr } = await supabase
      .from('brands')
      .upsert(brandsToInsert, { onConflict: 'id' });
    if (!brandErr) result.brands = brandsToInsert.length;

    // 3. Products
    const productsToInsert = INITIAL_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      short_description: p.short_description,
      category_id: p.category_id,
      brand_id: p.brand_id,
      price: p.price,
      compare_price: p.compare_price,
      cost_price: p.cost_price,
      weight: p.weight,
      unit: p.unit,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      is_active: p.is_active,
      is_featured: p.is_featured,
      is_best_seller: p.is_best_seller,
    }));
    const { error: prodErr } = await supabase
      .from('products')
      .upsert(productsToInsert, { onConflict: 'id' });
    if (!prodErr) result.products = productsToInsert.length;

    // 4. Product Images
    const allImages: any[] = [];
    INITIAL_PRODUCTS.forEach((p) => {
      if (p.images && p.images.length > 0) {
        p.images.forEach((img) => {
          allImages.push({
            id: img.id,
            product_id: p.id,
            image_url: img.image_url,
            alt_text: img.alt_text || p.name,
            sort_order: img.sort_order || 1,
            is_primary: img.is_primary || false,
          });
        });
      }
    });

    if (allImages.length > 0) {
      const { error: imgErr } = await supabase
        .from('product_images')
        .upsert(allImages, { onConflict: 'id' });
      if (!imgErr) result.images = allImages.length;
    }

    // 5. Shipping Methods
    const { error: shipErr } = await supabase
      .from('shipping_methods')
      .upsert(DEFAULT_SHIPPING_METHODS_SEED, { onConflict: 'id' });
    if (!shipErr) result.shipping_methods = DEFAULT_SHIPPING_METHODS_SEED.length;

    // 6. Promotions
    const promotionsToInsert = INITIAL_PROMOTIONS.map((promo) => ({
      id: promo.id,
      name: promo.name,
      code: promo.code,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      minimum_purchase: promo.minimum_purchase,
      maximum_discount: promo.maximum_discount,
      start_at: promo.start_at,
      end_at: promo.end_at,
      usage_limit: promo.usage_limit,
      usage_count: promo.usage_count,
      customer_usage_limit: promo.customer_usage_limit,
      is_active: promo.is_active,
      priority: promo.priority,
      stackable: promo.stackable,
    }));
    const { error: promoErr } = await supabase
      .from('promotions')
      .upsert(promotionsToInsert, { onConflict: 'id' });
    if (!promoErr) result.promotions = promotionsToInsert.length;

    // 7. Vouchers
    const vouchersToInsert = INITIAL_VOUCHERS.map((v) => ({
      id: v.id,
      promotion_id: v.promotion_id,
      code: v.code,
      description: v.description,
      usage_limit: v.usage_limit,
      usage_count: v.usage_count,
      is_active: v.is_active,
    }));
    const { error: vouchErr } = await supabase
      .from('vouchers')
      .upsert(vouchersToInsert, { onConflict: 'id' });
    if (!vouchErr) result.vouchers = vouchersToInsert.length;

    return {
      success: true,
      message: `Database Supabase berhasil disinkronkan: ${result.products} produk, ${result.categories} kategori, ${result.brands} brand, ${result.shipping_methods} ekspedisi, ${result.vouchers} voucher.`,
      seeded: result,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed seeding to Supabase:', err);
    return {
      success: false,
      message: `Gagal sinkronisasi data ke Supabase: ${errorMsg}`,
      seeded: result,
    };
  }
}

/**
 * Ensures that if Supabase is connected but has empty catalog, it automatically seeds in background
 */
let autoSeedChecked = false;
export async function autoSeedIfDatabaseEmpty(): Promise<void> {
  if (autoSeedChecked) return;
  autoSeedChecked = true;

  if (!isSupabaseConfigured() || !supabase) return;

  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (!error && (count === null || count === 0)) {
      console.log('Supabase products table is empty. Running automatic seed initialization...');
      await seedDatabaseToSupabase();
      console.log('Supabase automatic seed completed successfully.');
    }
  } catch (e) {
    console.warn('Auto-seed check encountered non-fatal error:', e);
  }
}
