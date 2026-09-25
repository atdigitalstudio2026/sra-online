import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Product,
  ProductWithDetails,
  ProductFilterParams,
  PaginatedResult,
  DashboardStats,
  ProductFormData,
  ProductImage,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS } from './seedData';
import { uploadProductImage } from './storageService';

const LOCAL_STORAGE_KEY = 'fmcg_products';

function getLocalProducts(): ProductWithDetails[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading products from localStorage', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

function saveLocalProducts(products: ProductWithDetails[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Failed saving products to localStorage', e);
  }
}

/**
 * Fetch products with server-side pagination, search, filtering, and sorting
 */
export async function getProducts(
  params: ProductFilterParams = {}
): Promise<PaginatedResult<ProductWithDetails>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 12);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*)
        `,
          { count: 'exact' }
        );

      // Status filters
      if (params.is_active !== undefined) {
        query = query.eq('is_active', params.is_active);
      } else {
        // By default on public catalog, show only active products
        query = query.eq('is_active', true);
      }

      if (params.is_featured !== undefined) {
        query = query.eq('is_featured', params.is_featured);
      }

      if (params.is_best_seller !== undefined) {
        query = query.eq('is_best_seller', params.is_best_seller);
      }

      // Category filter
      if (params.category_id) {
        query = query.eq('category_id', params.category_id);
      }

      // Brand filter
      if (params.brand_id) {
        query = query.eq('brand_id', params.brand_id);
      }

      // Price range
      if (params.min_price !== undefined && params.min_price > 0) {
        query = query.gte('price', params.min_price);
      }
      if (params.max_price !== undefined && params.max_price > 0) {
        query = query.lte('price', params.max_price);
      }

      // Stock status
      if (params.stock_status === 'in_stock') {
        query = query.gt('stock', 0);
      } else if (params.stock_status === 'out_of_stock') {
        query = query.lte('stock', 0);
      } else if (params.stock_status === 'low_stock') {
        query = query.gt('stock', 0).lte('stock', 10);
      }

      // Search across name and SKU
      if (params.search && params.search.trim()) {
        const term = params.search.trim();
        query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      }

      // Sorting
      const sortBy = params.sort_by || 'created_at';
      const ascending = params.sort_order === 'asc';
      query = query.order(sortBy, { ascending });

      // Pagination
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        console.warn('Supabase getProducts error, falling back to local:', error.message);
        return filterLocalProducts(params, page, limit);
      }

      const productsWithPrimary: ProductWithDetails[] = (data || []).map((p: any) => {
        const sortedImages = (p.images || []).sort(
          (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
        );
        const primaryImg =
          sortedImages.find((img: ProductImage) => img.is_primary)?.image_url ||
          sortedImages[0]?.image_url ||
          '';

        return {
          ...p,
          images: sortedImages,
          primary_image: primaryImg,
        };
      });

      const total = count || 0;
      return {
        data: productsWithPrimary,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      };
    } catch (err) {
      console.warn('Error in getProducts Supabase query:', err);
      return filterLocalProducts(params, page, limit);
    }
  }

  return filterLocalProducts(params, page, limit);
}

/**
 * Filter local products in memory for preview & fallback
 */
function filterLocalProducts(
  params: ProductFilterParams,
  page: number,
  limit: number
): PaginatedResult<ProductWithDetails> {
  const all = getLocalProducts();
  const categories = INITIAL_CATEGORIES;
  const brands = INITIAL_BRANDS;

  let filtered = all.map((p) => {
    const cat = categories.find((c) => c.id === p.category_id);
    const b = brands.find((br) => br.id === p.brand_id);
    const primaryImg =
      p.images?.find((img) => img.is_primary)?.image_url ||
      p.images?.[0]?.image_url ||
      p.primary_image ||
      '';

    return {
      ...p,
      category: cat || p.category,
      brand: b || p.brand,
      primary_image: primaryImg,
    };
  });

  // Active filter
  if (params.is_active !== undefined) {
    filtered = filtered.filter((p) => p.is_active === params.is_active);
  } else {
    filtered = filtered.filter((p) => p.is_active);
  }

  // Category slug or id
  if (params.category_slug) {
    const matchingCat = categories.find((c) => c.slug === params.category_slug);
    if (matchingCat) {
      filtered = filtered.filter((p) => p.category_id === matchingCat.id);
    }
  } else if (params.category_id) {
    filtered = filtered.filter((p) => p.category_id === params.category_id);
  }

  // Brand id
  if (params.brand_id) {
    filtered = filtered.filter((p) => p.brand_id === params.brand_id);
  }

  // Featured / Best Seller
  if (params.is_featured !== undefined) {
    filtered = filtered.filter((p) => p.is_featured === params.is_featured);
  }
  if (params.is_best_seller !== undefined) {
    filtered = filtered.filter((p) => p.is_best_seller === params.is_best_seller);
  }

  // Price range
  if (params.min_price !== undefined && params.min_price > 0) {
    filtered = filtered.filter((p) => p.price >= (params.min_price || 0));
  }
  if (params.max_price !== undefined && params.max_price > 0) {
    filtered = filtered.filter((p) => p.price <= (params.max_price || Infinity));
  }

  // Stock status
  if (params.stock_status === 'in_stock') {
    filtered = filtered.filter((p) => p.stock > 0);
  } else if (params.stock_status === 'out_of_stock') {
    filtered = filtered.filter((p) => p.stock <= 0);
  } else if (params.stock_status === 'low_stock') {
    filtered = filtered.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold);
  }

  // Search by name, SKU, or brand name
  if (params.search && params.search.trim()) {
    const term = params.search.toLowerCase().trim();
    filtered = filtered.filter((p) => {
      const matchName = p.name.toLowerCase().includes(term);
      const matchSku = p.sku.toLowerCase().includes(term);
      const matchBrand = p.brand?.name?.toLowerCase().includes(term);
      return matchName || matchSku || matchBrand;
    });
  }

  // Sorting
  const sortBy = params.sort_by || 'created_at';
  const isAsc = params.sort_order === 'asc';

  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'price') {
      return isAsc ? a.price - b.price : b.price - a.price;
    }
    // Default created_at
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return isAsc ? timeA - timeB : timeB - timeA;
  });

  const total = filtered.length;
  const total_pages = Math.ceil(total / limit) || 1;
  const from = (page - 1) * limit;
  const paginatedData = filtered.slice(from, from + limit);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    total_pages,
  };
}

/**
 * Fetch a single product by slug with category, brand, and images
 */
export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*)
        `
        )
        .eq('slug', slug)
        .single();

      if (error) {
        console.warn('Supabase getProductBySlug error, using fallback:', error.message);
        return getLocalProductBySlug(slug);
      }

      if (!data) return null;

      const sortedImages = (data.images || []).sort(
        (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
      );

      return {
        ...data,
        images: sortedImages,
        primary_image:
          sortedImages.find((img: ProductImage) => img.is_primary)?.image_url ||
          sortedImages[0]?.image_url ||
          '',
      };
    } catch {
      return getLocalProductBySlug(slug);
    }
  }

  return getLocalProductBySlug(slug);
}

function getLocalProductBySlug(slug: string): ProductWithDetails | null {
  const all = getLocalProducts();
  const prod = all.find((p) => p.slug === slug);
  if (!prod) return null;

  const categories = INITIAL_CATEGORIES;
  const brands = INITIAL_BRANDS;

  return {
    ...prod,
    category: categories.find((c) => c.id === prod.category_id) || prod.category,
    brand: brands.find((b) => b.id === prod.brand_id) || prod.brand,
    primary_image:
      prod.images?.find((i) => i.is_primary)?.image_url ||
      prod.images?.[0]?.image_url ||
      prod.primary_image ||
      '',
  };
}

/**
 * Fetch a single product by ID (for admin editing)
 */
export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        return getLocalProductById(id);
      }

      const sortedImages = (data.images || []).sort(
        (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
      );

      return {
        ...data,
        images: sortedImages,
        primary_image:
          sortedImages.find((img: ProductImage) => img.is_primary)?.image_url ||
          sortedImages[0]?.image_url ||
          '',
      };
    } catch {
      return getLocalProductById(id);
    }
  }

  return getLocalProductById(id);
}

function getLocalProductById(id: string): ProductWithDetails | null {
  const all = getLocalProducts();
  const prod = all.find((p) => p.id === id);
  if (!prod) return null;

  return {
    ...prod,
    category: INITIAL_CATEGORIES.find((c) => c.id === prod.category_id) || prod.category,
    brand: INITIAL_BRANDS.find((b) => b.id === prod.brand_id) || prod.brand,
    primary_image:
      prod.images?.find((i) => i.is_primary)?.image_url ||
      prod.images?.[0]?.image_url ||
      prod.primary_image ||
      '',
  };
}

/**
 * Create a new product with images
 */
export async function createProduct(formData: ProductFormData): Promise<ProductWithDetails> {
  const productId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Process image files if any
  const processedImages: ProductImage[] = [];

  for (let i = 0; i < formData.images.length; i++) {
    const imgItem = formData.images[i];
    let finalUrl = imgItem.image_url;

    if (imgItem.file) {
      try {
        const uploadResult = await uploadProductImage(imgItem.file, productId);
        finalUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('Image upload failed, using fallback/data url:', uploadErr);
      }
    }

    processedImages.push({
      id: imgItem.id || crypto.randomUUID(),
      product_id: productId,
      image_url: finalUrl,
      alt_text: imgItem.alt_text || formData.name,
      sort_order: i + 1,
      is_primary: imgItem.is_primary || (i === 0 && !formData.images.some((img) => img.is_primary)),
      created_at: now,
    });
  }

  const newProduct: Product = {
    id: productId,
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    sku: formData.sku.trim().toUpperCase(),
    description: formData.description.trim() || null,
    short_description: formData.short_description.trim() || null,
    category_id: formData.category_id,
    brand_id: formData.brand_id || null,
    price: Number(formData.price),
    compare_price: formData.compare_price ? Number(formData.compare_price) : null,
    cost_price: formData.cost_price ? Number(formData.cost_price) : null,
    weight: Number(formData.weight),
    unit: formData.unit || 'kg',
    stock: Number(formData.stock),
    low_stock_threshold: Number(formData.low_stock_threshold || 10),
    is_active: formData.is_active,
    is_featured: formData.is_featured,
    is_best_seller: formData.is_best_seller,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    // 1. Insert product record
    const { error: prodError } = await supabase.from('products').insert(newProduct);
    if (prodError) throw new Error(`Gagal menyimpan produk: ${prodError.message}`);

    // 2. Insert product images
    if (processedImages.length > 0) {
      const { error: imgError } = await supabase
        .from('product_images')
        .insert(processedImages);
      if (imgError) console.warn('Gagal menyimpan record gambar produk:', imgError.message);
    }
  }

  // Always update local cache as well
  const locals = getLocalProducts();
  const createdWithDetails: ProductWithDetails = {
    ...newProduct,
    images: processedImages,
    primary_image:
      processedImages.find((img) => img.is_primary)?.image_url ||
      processedImages[0]?.image_url ||
      '',
  };
  saveLocalProducts([createdWithDetails, ...locals]);

  return createdWithDetails;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  formData: ProductFormData
): Promise<ProductWithDetails> {
  const now = new Date().toISOString();

  // Process images
  const processedImages: ProductImage[] = [];

  for (let i = 0; i < formData.images.length; i++) {
    const imgItem = formData.images[i];
    let finalUrl = imgItem.image_url;

    if (imgItem.file) {
      try {
        const uploadResult = await uploadProductImage(imgItem.file, id);
        finalUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('Image upload failed during update:', uploadErr);
      }
    }

    processedImages.push({
      id: imgItem.id || crypto.randomUUID(),
      product_id: id,
      image_url: finalUrl,
      alt_text: imgItem.alt_text || formData.name,
      sort_order: i + 1,
      is_primary: imgItem.is_primary || (i === 0 && !formData.images.some((img) => img.is_primary)),
      created_at: now,
    });
  }

  const updates = {
    name: formData.name.trim(),
    slug: formData.slug.trim(),
    sku: formData.sku.trim().toUpperCase(),
    description: formData.description.trim() || null,
    short_description: formData.short_description.trim() || null,
    category_id: formData.category_id,
    brand_id: formData.brand_id || null,
    price: Number(formData.price),
    compare_price: formData.compare_price ? Number(formData.compare_price) : null,
    cost_price: formData.cost_price ? Number(formData.cost_price) : null,
    weight: Number(formData.weight),
    unit: formData.unit || 'kg',
    stock: Number(formData.stock),
    low_stock_threshold: Number(formData.low_stock_threshold || 10),
    is_active: formData.is_active,
    is_featured: formData.is_featured,
    is_best_seller: formData.is_best_seller,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    const { error: prodError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (prodError) throw new Error(`Gagal memperbarui produk: ${prodError.message}`);

    // Update images in Supabase: remove existing and re-insert updated batch
    await supabase.from('product_images').delete().eq('product_id', id);
    if (processedImages.length > 0) {
      await supabase.from('product_images').insert(processedImages);
    }
  }

  // Update local storage
  const locals = getLocalProducts();
  const index = locals.findIndex((p) => p.id === id);
  if (index !== -1) {
    const existing = locals[index];
    const updatedProduct: ProductWithDetails = {
      ...existing,
      ...updates,
      images: processedImages,
      primary_image:
        processedImages.find((img) => img.is_primary)?.image_url ||
        processedImages[0]?.image_url ||
        '',
    };
    locals[index] = updatedProduct;
    saveLocalProducts(locals);
    return updatedProduct;
  }

  throw new Error('Produk tidak ditemukan untuk diperbarui');
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    // Foreign keys with cascade or explicit delete of product_images
    await supabase.from('product_images').delete().eq('product_id', id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Gagal menghapus produk: ${error.message}`);
  }

  const locals = getLocalProducts();
  const filtered = locals.filter((p) => p.id !== id);
  saveLocalProducts(filtered);
  return true;
}

/**
 * Quick toggle active status
 */
export async function toggleProductActive(id: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: newStatus, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Gagal mengubah status aktif: ${error.message}`);
  }

  const locals = getLocalProducts();
  const prod = locals.find((p) => p.id === id);
  if (prod) {
    prod.is_active = newStatus;
    prod.updated_at = now;
    saveLocalProducts(locals);
  }
  return newStatus;
}

/**
 * Quick toggle featured status
 */
export async function toggleProductFeatured(id: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: newStatus, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Gagal mengubah status unggulan: ${error.message}`);
  }

  const locals = getLocalProducts();
  const prod = locals.find((p) => p.id === id);
  if (prod) {
    prod.is_featured = newStatus;
    prod.updated_at = now;
    saveLocalProducts(locals);
  }
  return newStatus;
}

/**
 * Quick toggle best seller status
 */
export async function toggleProductBestSeller(id: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('products')
      .update({ is_best_seller: newStatus, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Gagal mengubah status terlaris: ${error.message}`);
  }

  const locals = getLocalProducts();
  const prod = locals.find((p) => p.id === id);
  if (prod) {
    prod.is_best_seller = newStatus;
    prod.updated_at = now;
    saveLocalProducts(locals);
  }
  return newStatus;
}

/**
 * Get aggregated dashboard statistics (Admin Dashboard)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [
        { count: totalProd },
        { count: totalCat },
        { count: totalBrnd },
        { count: activeProd },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      // Count low stock: stock <= 10
      const { count: lowStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 10);

      return {
        total_products: totalProd || 0,
        total_categories: totalCat || 0,
        total_brands: totalBrnd || 0,
        active_products: activeProd || 0,
        low_stock_products: lowStock || 0,
      };
    } catch (e) {
      console.warn('Dashboard stats fallback to local:', e);
    }
  }

  const products = getLocalProducts();
  const categories = INITIAL_CATEGORIES;
  const brands = INITIAL_BRANDS;

  return {
    total_products: products.length,
    total_categories: categories.length,
    total_brands: brands.length,
    active_products: products.filter((p) => p.is_active).length,
    low_stock_products: products.filter((p) => p.stock <= p.low_stock_threshold).length,
  };
}
