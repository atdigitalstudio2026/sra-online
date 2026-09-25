/**
 * Customer Profile Service
 * Manages customer account details, avatars, and dashboard metrics.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CustomerProfile, AccountDashboardData, OrderWithDetails } from '../types';
import { getAdminOrders } from './orderService';
import { getWishlist } from './wishlistService';
import { getLoyaltyAccount } from './loyaltyService';
import { getUserPendingReviewProducts } from './reviewService';

const LOCAL_PROFILES_KEY = 'fmcg_customer_profiles';

function getLocalProfiles(): Record<string, CustomerProfile> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading customer profiles from localStorage', e);
  }
  return {};
}

function saveLocalProfile(profile: CustomerProfile) {
  try {
    if (typeof localStorage !== 'undefined') {
      const map = getLocalProfiles();
      map[profile.user_id] = profile;
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(map));
    }
  } catch (e) {
    console.warn('Failed saving customer profile to localStorage', e);
  }
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  if (!userId) return null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as CustomerProfile;
      }
    } catch (e) {
      console.warn('Supabase getCustomerProfile failed, checking local:', e);
    }
  }

  const local = getLocalProfiles();
  if (local[userId]) return local[userId];

  // If no profile exists yet, create default
  const defaultProfile: CustomerProfile = {
    id: crypto.randomUUID(),
    user_id: userId,
    full_name: 'Pelanggan FMCG',
    phone: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return defaultProfile;
}

export async function updateCustomerProfile(
  userId: string,
  updates: Partial<Omit<CustomerProfile, 'id' | 'user_id' | 'price_level_id' | 'created_at'>>
): Promise<CustomerProfile> {
  const current = (await getCustomerProfile(userId)) || {
    id: crypto.randomUUID(),
    user_id: userId,
    full_name: updates.full_name || 'Pelanggan FMCG',
    phone: updates.phone || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Explicit security: Customer cannot modify price_level_id or user_id
  const payload: CustomerProfile = {
    ...current,
    full_name: updates.full_name !== undefined ? updates.full_name : current.full_name,
    phone: updates.phone !== undefined ? updates.phone : current.phone,
    email: updates.email !== undefined ? updates.email : current.email,
    date_of_birth: updates.date_of_birth !== undefined ? updates.date_of_birth : current.date_of_birth,
    gender: updates.gender !== undefined ? updates.gender : current.gender,
    avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : current.avatar_url,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (!error && data) {
        saveLocalProfile(data as CustomerProfile);
        return data as CustomerProfile;
      }
    } catch (e) {
      console.warn('Supabase updateCustomerProfile error:', e);
    }
  }

  saveLocalProfile(payload);
  return payload;
}

/**
 * Upload Avatar to Supabase Storage 'customer-avatars' bucket
 * Rejects base64; returns public URL.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from('customer-avatars').getPublicUrl(filePath);
        return data.publicUrl;
      }
    } catch (e) {
      console.warn('Storage upload error, using local object URL fallback:', e);
    }
  }

  // Local object URL fallback
  return URL.createObjectURL(file);
}

/**
 * Aggregates all Customer Dashboard statistics
 */
export async function getAccountDashboardData(userId: string): Promise<AccountDashboardData> {
  const [profile, ordersRes, wishlist, loyalty, pendingReviews] = await Promise.all([
    getCustomerProfile(userId),
    getAdminOrders({ limit: 50 }),
    getWishlist(userId),
    getLoyaltyAccount(userId),
    getUserPendingReviewProducts(userId),
  ]);

  // Filter orders matching user id or phone/email
  const userOrders = (ordersRes.orders || []).filter(
    (o) =>
      o.user_id === userId ||
      (profile?.email && o.customer_email === profile.email) ||
      (profile?.phone && o.customer_phone === profile.phone)
  );

  const totalSpending = userOrders
    .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);

  return {
    profile,
    total_orders: userOrders.length,
    total_spending: totalSpending,
    wishlist_count: wishlist.length,
    loyalty_points: loyalty.current_points,
    pending_reviews_count: pendingReviews.length,
    recent_orders: userOrders.slice(0, 5),
  };
}
