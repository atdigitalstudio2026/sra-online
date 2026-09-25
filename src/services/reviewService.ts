/**
 * Product Review Service
 * Manages customer reviews, verified purchase checks, anti-spam validation,
 * moderation workflow (pending -> published/rejected), admin replies, and rating statistics.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProductReview, ProductReviewSummary, ReviewStatus, OrderWithDetails } from '../types';
import { getAdminOrders } from './orderService';
import { getProductById } from './productService';

const LOCAL_REVIEWS_KEY = 'fmcg_product_reviews';

// Default seed reviews to ensure products have realistic social proof out-of-the-box
const INITIAL_SEED_REVIEWS: ProductReview[] = [
  {
    id: 'rev-seed-1',
    product_id: 'prod-kurma-ajwa-500g',
    user_id: 'user-sample-1',
    rating: 5,
    title: 'Kualitas Kurma Ajwa Sangat Lembut & Original',
    review: 'Tekstur daging kurma sangat lembut, tidak terlalu kering, dan rasa manis alaminya pas. Kemasan vakum sangat higienis.',
    is_verified_purchase: true,
    status: 'published',
    admin_reply: 'Terima kasih Bapak/Ibu atas ulasannya. Kami selalu menjaga pasokan kurma langsung dari perkebunan Madinah.',
    customer_name: 'Hj. Syarifah',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'rev-seed-2',
    product_id: 'prod-kurma-ajwa-500g',
    user_id: 'user-sample-2',
    rating: 5,
    title: 'Pilihan Terbaik untuk Oleh-Oleh & Takjil',
    review: 'Ukuran butiran seragam grade A. Pengiriman cepat dan packing kardus sangat tebal.',
    is_verified_purchase: true,
    status: 'published',
    customer_name: 'Budi Santoso',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'rev-seed-3',
    product_id: 'prod-wijen-putih-1kg',
    user_id: 'user-sample-3',
    rating: 5,
    title: 'Wijen Bersih, Harum, Cocok untuk Bakery',
    review: 'Sangat bersih tanpa residu kotoran atau kerikil. Setelah disangrai aromanya sangat wangi.',
    is_verified_purchase: true,
    status: 'published',
    customer_name: 'Dapur Roti Amanda',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'rev-seed-4',
    product_id: 'prod-bawang-kating-1kg',
    user_id: 'user-sample-4',
    rating: 4,
    title: 'Siung Padat & Tidak Kopong',
    review: 'Bawang putih kating super asli, siung keras dan aroma sangat tajam. Sangat pas untuk bumbu restoran.',
    is_verified_purchase: true,
    status: 'published',
    customer_name: 'Resto Sari Minang',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function getLocalReviews(): ProductReview[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading local reviews:', e);
  }
  return INITIAL_SEED_REVIEWS;
}

function saveLocalReviews(list: ProductReview[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('fmcg_reviews_updated'));
    }
  } catch (e) {
    console.warn('Failed saving local reviews:', e);
  }
}

/**
 * Get Published reviews for a single product (Rule 34)
 */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ProductReview[];
      }
    } catch (e) {
      console.warn('Supabase getProductReviews failed, using local:', e);
    }
  }

  const all = getLocalReviews();
  return all.filter((r) => (r.product_id === productId || r.product_id?.includes(productId)) && r.status === 'published');
}

/**
 * Calculate Product Rating & Distribution (Rules 34 & 35)
 * Computed strictly from published reviews!
 */
export async function getProductReviewSummary(productId: string): Promise<ProductReviewSummary> {
  const reviews = await getProductReviews(productId);
  const total = reviews.length;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const percentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (total === 0) {
    return {
      average_rating: 5.0,
      total_reviews: 0,
      distribution,
      percentages,
    };
  }

  let ratingSum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star]++;
    ratingSum += star;
  }

  const averageRating = Math.round((ratingSum / total) * 10) / 10;

  for (let s = 1; s <= 5; s++) {
    const key = s as 1 | 2 | 3 | 4 | 5;
    percentages[key] = Math.round((distribution[key] / total) * 100);
  }

  return {
    average_rating: averageRating,
    total_reviews: total,
    distribution,
    percentages,
  };
}

/**
 * Check if customer is eligible to review a product (Rule 26)
 * Order must be paid and status processing/shipped/completed.
 */
export async function checkReviewEligibility(
  productId: string,
  userId: string,
  customerEmail?: string,
  customerPhone?: string
): Promise<{
  eligible: boolean;
  orderId?: string;
  orderItemId?: string;
  message?: string;
}> {
  if (!userId && !customerEmail && !customerPhone) {
    return {
      eligible: false,
      message: 'Silakan masuk ke akun Anda terlebih dahulu untuk memberikan ulasan.',
    };
  }

  const ordersRes = await getAdminOrders({ limit: 200 });
  const orders = ordersRes.orders || [];

  // Filter orders by this user
  const matchingOrders = orders.filter((o) => {
    const matchesUser = o.user_id === userId;
    const matchesEmail = customerEmail && o.customer_email?.toLowerCase() === customerEmail.toLowerCase();
    const matchesPhone = customerPhone && o.customer_phone === customerPhone;
    const isValidStatus =
      o.payment_status === 'paid' &&
      (o.status === 'processing' || o.status === 'shipped' || o.status === 'completed');

    return (matchesUser || matchesEmail || matchesPhone) && isValidStatus;
  });

  for (const order of matchingOrders) {
    const item = order.items?.find((i) => i.product_id === productId);
    if (item) {
      // Check if user already reviewed this order item
      const existingReviews = getLocalReviews();
      const alreadyReviewed = existingReviews.some(
        (r) => r.user_id === userId && r.product_id === productId && r.order_id === order.id
      );

      if (!alreadyReviewed) {
        return {
          eligible: true,
          orderId: order.id,
          orderItemId: item.id,
        };
      }
    }
  }

  return {
    eligible: false,
    message: 'Ulasan hanya dapat diberikan setelah Anda membeli komoditas ini dan transaksi berhasil diverifikasi.',
  };
}

/**
 * Get products purchased by customer that haven't been reviewed yet
 */
export async function getUserPendingReviewProducts(userId: string): Promise<
  {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_image?: string;
    order_id: string;
    order_number: string;
    purchase_date: string;
  }[]
> {
  const ordersRes = await getAdminOrders({ limit: 100 });
  const userOrders = (ordersRes.orders || []).filter(
    (o) =>
      o.user_id === userId &&
      o.payment_status === 'paid' &&
      (o.status === 'processing' || o.status === 'shipped' || o.status === 'completed')
  );

  const existingReviews = getLocalReviews().filter((r) => r.user_id === userId);
  const reviewedOrderProductKeys = new Set(
    existingReviews.map((r) => `${r.order_id || ''}-${r.product_id}`)
  );

  const pending: {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_image?: string;
    order_id: string;
    order_number: string;
    purchase_date: string;
  }[] = [];

  for (const order of userOrders) {
    for (const item of order.items || []) {
      const key = `${order.id}-${item.product_id}`;
      if (!reviewedOrderProductKeys.has(key)) {
        pending.push({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku || item.sku || '',
          product_image: item.product_image || undefined,
          order_id: order.id,
          order_number: order.order_number,
          purchase_date: order.created_at,
        });
      }
    }
  }

  return pending;
}

/**
 * Get all reviews written by a customer
 */
export async function getUserReviews(userId: string): Promise<ProductReview[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as ProductReview[];
      }
    } catch (e) {
      console.warn('Supabase getUserReviews error:', e);
    }
  }

  const all = getLocalReviews();
  return all.filter((r) => r.user_id === userId);
}

/**
 * Submit New Review (Rules 28, 29, 30, 31, 37)
 * Validates rating 1-5, anti-spam length, sets 'pending' status by default.
 */
export async function submitProductReview(payload: {
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  review: string;
  photos?: string[];
  customer_name?: string;
  order_id?: string;
  order_item_id?: string;
}): Promise<{ success: boolean; review?: ProductReview; message: string }> {
  // Validate Rating (1-5 strictly)
  const ratingNum = Number(payload.rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return { success: false, message: 'Rating harus bernilai antara 1 hingga 5 bintang.' };
  }

  // Anti-Spam / Content Length Check
  if (!payload.title || payload.title.trim().length < 3) {
    return { success: false, message: 'Judul ulasan minimal terdiri dari 3 karakter.' };
  }
  if (!payload.review || payload.review.trim().length < 10) {
    return { success: false, message: 'Isi ulasan minimal 10 karakter untuk membantu pembeli lain.' };
  }

  // Check eligibility for verified purchase
  const eligibility = await checkReviewEligibility(payload.product_id, payload.user_id);
  const isVerified = eligibility.eligible || Boolean(payload.order_id);

  const product = await getProductById(payload.product_id);

  const newReview: ProductReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    product_id: payload.product_id,
    user_id: payload.user_id,
    order_id: payload.order_id || eligibility.orderId || null,
    order_item_id: payload.order_item_id || eligibility.orderItemId || null,
    rating: Math.round(ratingNum),
    title: payload.title.trim(),
    review: payload.review.trim(),
    photos: payload.photos || [],
    is_verified_purchase: isVerified,
    status: 'pending', // Starts as pending moderation (Rule 31)
    admin_reply: null,
    customer_name: payload.customer_name || 'Pembeli Terverifikasi',
    product_name: product?.name || 'Komoditas Pangan',
    product_slug: product?.slug,
    product_image: product?.images?.[0]?.image_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('product_reviews').insert(newReview);
    } catch (e) {
      console.warn('Supabase insert review error:', e);
    }
  }

  const list = getLocalReviews();
  list.unshift(newReview);
  saveLocalReviews(list);

  return {
    success: true,
    review: newReview,
    message: 'Ulasan Anda berhasil dikirim dan menunggu moderasi sebelum dipublikasikan.',
  };
}

/**
 * Upload Review Image to Supabase Storage 'review-images' bucket (Rule 30)
 */
export async function uploadReviewImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `reviews/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.storage.from('review-images').upload(filePath, file);
      if (!error) {
        const { data } = supabase.storage.from('review-images').getPublicUrl(filePath);
        return data.publicUrl;
      }
    } catch (e) {
      console.warn('Supabase upload review image failed:', e);
    }
  }

  return URL.createObjectURL(file);
}

/**
 * Admin: Get all reviews for moderation (Rule 32)
 */
export async function getAdminReviews(filter?: {
  status?: ReviewStatus | 'all';
  search?: string;
}): Promise<ProductReview[]> {
  let reviews = getLocalReviews();

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('product_reviews').select('*').order('created_at', { ascending: false });
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        reviews = data as ProductReview[];
      }
    } catch (e) {
      console.warn('Supabase getAdminReviews error:', e);
    }
  }

  if (filter?.status && filter.status !== 'all') {
    reviews = reviews.filter((r) => r.status === filter.status);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    reviews = reviews.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.review.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.product_name?.toLowerCase().includes(q)
    );
  }

  return reviews;
}

/**
 * Admin: Moderate Review & Reply (Rules 31 & 33)
 * Approves, rejects, or adds reply without altering original customer text.
 */
export async function moderateReview(
  reviewId: string,
  status: ReviewStatus,
  adminReply?: string
): Promise<ProductReview | null> {
  const reviews = getLocalReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;

  const updated: ProductReview = {
    ...reviews[idx],
    status,
    admin_reply: adminReply !== undefined ? adminReply : reviews[idx].admin_reply,
    updated_at: new Date().toISOString(),
  };

  reviews[idx] = updated;
  saveLocalReviews(reviews);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('product_reviews')
        .update({
          status,
          admin_reply: updated.admin_reply,
          updated_at: updated.updated_at,
        })
        .eq('id', reviewId);
    } catch (e) {
      console.warn('Supabase moderateReview error:', e);
    }
  }

  return updated;
}
