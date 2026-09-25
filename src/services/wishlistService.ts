/**
 * Wishlist Service
 * Handles customer wishlists, guest storage (IDs only), wishlist merging,
 * price drop detection, and moving items to cart.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WishlistItem, ProductWithDetails } from '../types';
import { getProductById, getProducts } from './productService';
import { addCartItem } from './cartService';

const GUEST_WISHLIST_KEY = 'fmcg_guest_wishlist_ids';
const LOCAL_USER_WISHLIST_KEY = 'fmcg_user_wishlist';

/**
 * Get guest wishlist (Product IDs only per Rule 19)
 */
export function getGuestWishlistIds(): string[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch {}
  return [];
}

export function saveGuestWishlistIds(ids: string[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const unique = Array.from(new Set(ids));
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(unique));
      window.dispatchEvent(new CustomEvent('fmcg_wishlist_updated'));
    }
  } catch {}
}

/**
 * Get local wishlist for user
 */
function getLocalUserWishlist(userId: string): WishlistItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`${LOCAL_USER_WISHLIST_KEY}_${userId}`);
      if (stored) return JSON.parse(stored);
    }
  } catch {}
  return [];
}

function saveLocalUserWishlist(userId: string, items: WishlistItem[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${LOCAL_USER_WISHLIST_KEY}_${userId}`, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('fmcg_wishlist_updated'));
    }
  } catch {}
}

/**
 * Fetch complete wishlist with full product details and price change info
 */
export async function getWishlist(userId?: string | null): Promise<WishlistItem[]> {
  let rawItems: { id: string; user_id: string; product_id: string; price_when_added?: number; created_at: string }[] = [];

  if (userId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          rawItems = data;
        }
      } catch (e) {
        console.warn('Supabase getWishlist error:', e);
      }
    }

    if (rawItems.length === 0) {
      rawItems = getLocalUserWishlist(userId);
    }
  } else {
    // Guest mode: get IDs
    const guestIds = getGuestWishlistIds();
    rawItems = guestIds.map((id) => ({
      id: `guest-${id}`,
      user_id: 'guest',
      product_id: id,
      created_at: new Date().toISOString(),
    }));
  }

  if (rawItems.length === 0) return [];

  // Populate product details
  const populated: WishlistItem[] = [];
  for (const item of rawItems) {
    try {
      const product = await getProductById(item.product_id);
      if (product) {
        populated.push({
          ...item,
          product,
          price_when_added: item.price_when_added || product.price,
        });
      }
    } catch {
      // product might have been deleted, omit or retain
    }
  }

  return populated;
}

/**
 * Check if a product is in wishlist
 */
export async function isInWishlist(productId: string, userId?: string | null): Promise<boolean> {
  if (!productId) return false;

  if (!userId) {
    const ids = getGuestWishlistIds();
    return ids.includes(productId);
  }

  const items = await getWishlist(userId);
  return items.some((i) => i.product_id === productId);
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(
  productId: string,
  userId?: string | null,
  currentPrice?: number
): Promise<boolean> {
  if (!productId) return false;

  if (!userId) {
    // Guest wishlist
    const ids = getGuestWishlistIds();
    if (!ids.includes(productId)) {
      ids.push(productId);
      saveGuestWishlistIds(ids);
    }
    return true;
  }

  // Logged-in user
  const newItem: WishlistItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    product_id: productId,
    price_when_added: currentPrice || 0,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('wishlists').upsert(
        {
          user_id: userId,
          product_id: productId,
          price_when_added: currentPrice || 0,
        },
        { onConflict: 'user_id,product_id' }
      );
    } catch (e) {
      console.warn('Supabase addToWishlist error:', e);
    }
  }

  const local = getLocalUserWishlist(userId);
  if (!local.some((i) => i.product_id === productId)) {
    local.unshift(newItem);
    saveLocalUserWishlist(userId, local);
  }

  return true;
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(productId: string, userId?: string | null): Promise<boolean> {
  if (!productId) return false;

  if (!userId) {
    const ids = getGuestWishlistIds().filter((id) => id !== productId);
    saveGuestWishlistIds(ids);
    return true;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
    } catch (e) {
      console.warn('Supabase removeFromWishlist error:', e);
    }
  }

  const local = getLocalUserWishlist(userId).filter((i) => i.product_id !== productId);
  saveLocalUserWishlist(userId, local);
  return true;
}

/**
 * Merge Guest Wishlist on Login (Rule 20)
 * Guest: [A, B] + Account: [B, C] -> Merged: [A, B, C] without duplicates.
 */
export async function mergeGuestWishlist(userId: string): Promise<void> {
  const guestIds = getGuestWishlistIds();
  if (guestIds.length === 0) return;

  const userItems = await getWishlist(userId);
  const existingProductIds = new Set(userItems.map((i) => i.product_id));

  for (const id of guestIds) {
    if (!existingProductIds.has(id)) {
      await addToWishlist(id, userId);
    }
  }

  // Clear guest wishlist after successful merge
  try {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
    window.dispatchEvent(new CustomEvent('fmcg_wishlist_updated'));
  } catch {}
}

/**
 * Move Wishlist Item to Shopping Cart (Rule 22)
 * Validates stock, active status, resolves current price, then addToCart() and removes from wishlist.
 */
export async function moveWishlistToCart(
  productId: string,
  userId?: string | null
): Promise<{ success: boolean; message: string }> {
  const product = await getProductById(productId);

  if (!product || !product.is_active) {
    return { success: false, message: 'Produk ini sudah tidak tersedia atau nonaktif.' };
  }

  if (product.stock <= 0) {
    return { success: false, message: 'Stok saat ini tidak mencukupi atau habis.' };
  }

  // Add to cart with current active price
  await addCartItem(productId, 1, userId);

  // Remove from wishlist
  await removeFromWishlist(productId, userId);

  return { success: true, message: `"${product.name}" berhasil dipindahkan ke keranjang belanja.` };
}
