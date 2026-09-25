import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CartWithItems, CartItemWithProduct } from '../types';
import { getProductById } from './productService';

const SESSION_STORAGE_KEY = 'fmcg_guest_session_id';
const LOCAL_GUEST_CART_KEY = 'fmcg_local_guest_cart_items';
const LOCAL_USER_CARTS_KEY = 'fmcg_local_user_carts';

interface StoredCartItem {
  id: string;
  cart_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get or initialize persistent guest session ID
 */
export function getGuestSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = 'guest_' + crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return 'guest_default_session';
  }
}

/**
 * Get stored guest items from localStorage (stores ONLY product_id, quantity, unit_price)
 */
function getLocalGuestItems(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_GUEST_CART_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading guest cart from localStorage', e);
  }
  return [];
}

function saveLocalGuestItems(items: StoredCartItem[]) {
  try {
    localStorage.setItem(LOCAL_GUEST_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed saving guest cart to localStorage', e);
  }
}

/**
 * Get stored user items from localStorage (for demo/offline mode)
 */
function getLocalUserItems(userId: string): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_USER_CARTS_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading user cart from localStorage', e);
  }
  return [];
}

function saveLocalUserItems(userId: string, items: StoredCartItem[]) {
  try {
    localStorage.setItem(`${LOCAL_USER_CARTS_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed saving user cart to localStorage', e);
  }
}

/**
 * Resolves full product details for each stored cart item from database
 * and performs price change & stock reduction detection.
 */
async function hydrateCartItems(cartId: string, storedItems: StoredCartItem[]): Promise<CartItemWithProduct[]> {
  const hydratedList: CartItemWithProduct[] = [];

  for (const item of storedItems) {
    const product = await getProductById(item.product_id);

    if (!product) {
      // Product deleted from database
      hydratedList.push({
        ...item,
        cart_id: item.cart_id || cartId,
        product: {
          id: item.product_id,
          name: 'Produk Tidak Ditemukan',
          slug: '',
          sku: 'UNKNOWN',
          description: null,
          short_description: null,
          category_id: '',
          brand_id: null,
          price: item.unit_price,
          compare_price: null,
          cost_price: null,
          weight: 1,
          unit: 'pcs',
          stock: 0,
          low_stock_threshold: 0,
          is_active: false,
          is_featured: false,
          is_best_seller: false,
          created_at: item.created_at,
          updated_at: item.updated_at,
        },
        isUnavailable: true,
      });
      continue;
    }

    const isUnavailable = !product.is_active;
    const hasPriceChanged = product.price !== item.unit_price;
    const hasStockChanged = product.stock < item.quantity;

    hydratedList.push({
      ...item,
      cart_id: item.cart_id || cartId,
      product,
      hasPriceChanged,
      previousPrice: item.unit_price,
      currentPrice: product.price,
      hasStockChanged,
      maxAvailableStock: product.stock,
      isUnavailable,
    });
  }

  return hydratedList;
}

/**
 * Calculates cart total quantity and subtotal
 */
function calculateCartTotals(items: CartItemWithProduct[]): { total_items: number; subtotal: number } {
  let total_items = 0;
  let subtotal = 0;

  for (const item of items) {
    total_items += item.quantity;
    // Use fresh product price if available and active, otherwise unit_price
    const effectivePrice = item.product?.is_active ? item.product.price : item.unit_price;
    subtotal += effectivePrice * item.quantity;
  }

  return { total_items, subtotal };
}

/**
 * Fetch or initialize the active cart for either guest or logged-in user
 */
export async function getCart(userId?: string | null): Promise<CartWithItems> {
  const sessionId = getGuestSessionId();

  if (isSupabaseConfigured() && supabase) {
    try {
      // Find active cart
      let query = supabase.from('carts').select('*').eq('status', 'active');
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('session_id', sessionId);
      }

      let { data: cartData, error: cartError } = await query.maybeSingle();

      if (cartError) {
        console.warn('Error fetching cart from Supabase:', cartError.message);
      }

      // If cart doesn't exist, create it
      if (!cartData) {
        const newCartId = crypto.randomUUID();
        const now = new Date().toISOString();
        const { data: createdCart, error: createError } = await supabase
          .from('carts')
          .insert({
            id: newCartId,
            user_id: userId || null,
            session_id: userId ? null : sessionId,
            status: 'active',
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (!createError && createdCart) {
          cartData = createdCart;
        } else {
          cartData = {
            id: newCartId,
            user_id: userId || null,
            session_id: sessionId,
            status: 'active',
            created_at: now,
            updated_at: now,
          };
        }
      }

      // Fetch cart items
      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartData.id)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.warn('Error fetching cart items:', itemsError.message);
      }

      const storedItems: StoredCartItem[] = itemsData || [];
      const items = await hydrateCartItems(cartData.id, storedItems);
      const { total_items, subtotal } = calculateCartTotals(items);

      return {
        ...cartData,
        items,
        total_items,
        subtotal,
      };
    } catch (err) {
      console.warn('Supabase getCart failed, using local fallback:', err);
    }
  }

  // Local storage fallback for guest or demo user
  const cartId = userId ? `user_cart_${userId}` : `guest_cart_${sessionId}`;
  const storedItems = userId ? getLocalUserItems(userId) : getLocalGuestItems();
  const items = await hydrateCartItems(cartId, storedItems);
  const { total_items, subtotal } = calculateCartTotals(items);

  return {
    id: cartId,
    user_id: userId || null,
    session_id: userId ? null : sessionId,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items,
    total_items,
    subtotal,
  };
}

/**
 * Add a product to the cart with strict stock and active validation
 */
export async function addCartItem(
  productId: string,
  quantity: number,
  userId?: string | null
): Promise<{ success: boolean; cart: CartWithItems; message?: string }> {
  if (quantity <= 0) {
    throw new Error('Jumlah produk yang ditambahkan minimal 1.');
  }

  // 1. Fetch fresh product details to validate stock and active status
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  if (!product.is_active) {
    throw new Error('Produk ini saat ini sedang tidak aktif dan tidak dapat ditambahkan ke keranjang.');
  }

  if (product.stock <= 0) {
    throw new Error('Stok produk habis.');
  }

  // 2. Fetch current cart
  const cart = await getCart(userId);
  const existingItem = cart.items.find((i) => i.product_id === productId);
  const currentQtyInCart = existingItem ? existingItem.quantity : 0;
  const newTotalQty = currentQtyInCart + quantity;

  // 3. Stock limit validation
  if (newTotalQty > product.stock) {
    throw new Error(
      `Tidak dapat menambahkan produk melebihi stok yang tersedia. Stok tersisa: ${product.stock} ${product.unit}. Anda sudah memiliki ${currentQtyInCart} ${product.unit} di keranjang.`
    );
  }

  const now = new Date().toISOString();

  // 4. Update in Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({
            quantity: newTotalQty,
            updated_at: now,
          })
          .eq('id', existingItem.id);
      } else {
        await supabase.from('cart_items').insert({
          id: crypto.randomUUID(),
          cart_id: cart.id,
          product_id: productId,
          quantity: newTotalQty,
          unit_price: product.price,
          created_at: now,
          updated_at: now,
        });
      }

      const updatedCart = await getCart(userId);
      return { success: true, cart: updatedCart };
    } catch (e) {
      console.warn('Supabase addCartItem failed, updating local state:', e);
    }
  }

  // Local storage handling
  const storedItems = userId ? getLocalUserItems(userId) : getLocalGuestItems();
  const existingIndex = storedItems.findIndex((i) => i.product_id === productId);

  if (existingIndex !== -1) {
    storedItems[existingIndex].quantity = newTotalQty;
    storedItems[existingIndex].updated_at = now;
  } else {
    storedItems.push({
      id: crypto.randomUUID(),
      product_id: productId,
      quantity: newTotalQty,
      unit_price: product.price,
      created_at: now,
      updated_at: now,
    });
  }

  if (userId) {
    saveLocalUserItems(userId, storedItems);
  } else {
    saveLocalGuestItems(storedItems);
  }

  const updatedCart = await getCart(userId);
  return { success: true, cart: updatedCart };
}

/**
 * Update the quantity of a cart item
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  newQuantity: number,
  userId?: string | null
): Promise<CartWithItems> {
  if (newQuantity < 1) {
    return removeCartItem(cartItemId, userId);
  }

  const cart = await getCart(userId);
  const targetItem = cart.items.find((i) => i.id === cartItemId);
  if (!targetItem) {
    return cart;
  }

  // Stock check
  const product = await getProductById(targetItem.product_id);
  if (product && newQuantity > product.stock) {
    throw new Error(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit}).`);
  }

  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: now })
        .eq('id', cartItemId);

      return await getCart(userId);
    } catch (e) {
      console.warn('Supabase updateCartItemQuantity failed, using local:', e);
    }
  }

  const storedItems = userId ? getLocalUserItems(userId) : getLocalGuestItems();
  const index = storedItems.findIndex((i) => i.id === cartItemId);
  if (index !== -1) {
    storedItems[index].quantity = newQuantity;
    storedItems[index].updated_at = now;
    if (userId) saveLocalUserItems(userId, storedItems);
    else saveLocalGuestItems(storedItems);
  }

  return await getCart(userId);
}

/**
 * Remove an item from the cart
 */
export async function removeCartItem(cartItemId: string, userId?: string | null): Promise<CartWithItems> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('cart_items').delete().eq('id', cartItemId);
      return await getCart(userId);
    } catch (e) {
      console.warn('Supabase removeCartItem failed, using local:', e);
    }
  }

  const storedItems = userId ? getLocalUserItems(userId) : getLocalGuestItems();
  const filtered = storedItems.filter((i) => i.id !== cartItemId);
  if (userId) saveLocalUserItems(userId, filtered);
  else saveLocalGuestItems(filtered);

  return await getCart(userId);
}

/**
 * Clear all items from the cart
 */
export async function clearCart(userId?: string | null): Promise<CartWithItems> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const cart = await getCart(userId);
      await supabase.from('cart_items').delete().eq('cart_id', cart.id);
      return await getCart(userId);
    } catch (e) {
      console.warn('Supabase clearCart failed, using local:', e);
    }
  }

  if (userId) {
    saveLocalUserItems(userId, []);
  } else {
    saveLocalGuestItems([]);
  }

  return await getCart(userId);
}

/**
 * Merge Guest Cart into Logged-in User Cart when user logs in (TEST 6 requirement)
 */
export async function mergeGuestCart(userId: string): Promise<CartWithItems> {
  const sessionId = getGuestSessionId();
  const guestStoredItems = getLocalGuestItems();

  if (guestStoredItems.length === 0) {
    return await getCart(userId);
  }

  // Load user cart
  const userCart = await getCart(userId);

  for (const guestItem of guestStoredItems) {
    const product = await getProductById(guestItem.product_id);
    if (!product || !product.is_active || product.stock <= 0) continue;

    const existingUserItem = userCart.items.find((i) => i.product_id === guestItem.product_id);
    const existingQty = existingUserItem ? existingUserItem.quantity : 0;

    // Combine quantities and clamp to available stock
    const combinedQty = Math.min(existingQty + guestItem.quantity, product.stock);

    if (isSupabaseConfigured() && supabase) {
      const now = new Date().toISOString();
      if (existingUserItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: combinedQty, updated_at: now })
          .eq('id', existingUserItem.id);
      } else {
        await supabase.from('cart_items').insert({
          id: crypto.randomUUID(),
          cart_id: userCart.id,
          product_id: guestItem.product_id,
          quantity: combinedQty,
          unit_price: product.price,
          created_at: now,
          updated_at: now,
        });
      }
    } else {
      const userStored = getLocalUserItems(userId);
      const userIdx = userStored.findIndex((i) => i.product_id === guestItem.product_id);
      if (userIdx !== -1) {
        userStored[userIdx].quantity = combinedQty;
      } else {
        userStored.push({
          ...guestItem,
          quantity: combinedQty,
          unit_price: product.price,
        });
      }
      saveLocalUserItems(userId, userStored);
    }
  }

  // Clear guest cart after successful merge
  saveLocalGuestItems([]);

  // Return fresh combined user cart
  return await getCart(userId);
}

/**
 * Adjust cart item quantity to currently available stock
 */
export async function adjustItemToStock(
  cartItemId: string,
  newStock: number,
  userId?: string | null
): Promise<CartWithItems> {
  return updateCartItemQuantity(cartItemId, newStock, userId);
}

/**
 * Accept price change and update unit_price snapshot
 */
export async function acceptPriceChange(
  cartItemId: string,
  newPrice: number,
  userId?: string | null
): Promise<CartWithItems> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('cart_items')
        .update({ unit_price: newPrice, updated_at: now })
        .eq('id', cartItemId);

      return await getCart(userId);
    } catch (e) {
      console.warn('Supabase acceptPriceChange failed:', e);
    }
  }

  const storedItems = userId ? getLocalUserItems(userId) : getLocalGuestItems();
  const index = storedItems.findIndex((i) => i.id === cartItemId);
  if (index !== -1) {
    storedItems[index].unit_price = newPrice;
    storedItems[index].updated_at = now;
    if (userId) saveLocalUserItems(userId, storedItems);
    else saveLocalGuestItems(storedItems);
  }

  return await getCart(userId);
}
