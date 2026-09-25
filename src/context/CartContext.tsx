import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartWithItems, CartItemWithProduct } from '../types';
import {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart as clearCartService,
  mergeGuestCart,
  adjustItemToStock,
  acceptPriceChange,
} from '../services/cartService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../components/common/Toast';

interface CartUser {
  id: string;
  email: string;
  name?: string;
}

interface CartContextType {
  cart: CartWithItems | null;
  items: CartItemWithProduct[];
  totalCount: number;
  subtotal: number;
  isLoading: boolean;
  isSyncing: boolean;
  user: CartUser | null;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  adjustToStock: (cartItemId: string, stock: number) => Promise<void>;
  confirmPriceChange: (cartItemId: string, newPrice: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  toggleMiniCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error } = useToast();
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState<boolean>(false);
  const [user, setUser] = useState<CartUser | null>(() => {
    try {
      const saved = localStorage.getItem('fmcg_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Reference for optimistic race-condition safety
  const pendingUpdatesRef = useRef<Map<string, number>>(new Map());
  const debounceTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load cart based on current auth state
  const loadCartData = useCallback(async (userId?: string | null) => {
    setIsLoading(true);
    try {
      const data = await getCart(userId);
      setCart(data);
    } catch (err: unknown) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Auth & Cart listener
  useEffect(() => {
    loadCartData(user?.id);

    // If Supabase Auth is enabled, listen for auth changes
    if (isSupabaseConfigured() && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const authUser: CartUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          };
          setUser(authUser);
          localStorage.setItem('fmcg_current_user', JSON.stringify(authUser));

          // Merge guest cart on login!
          setIsSyncing(true);
          try {
            const merged = await mergeGuestCart(authUser.id);
            setCart(merged);
            success('Keranjang tamu berhasil disinkronkan ke akun Anda.');
          } catch (e) {
            console.error('Error merging cart on auth change:', e);
          } finally {
            setIsSyncing(false);
          }
        } else {
          setUser(null);
          localStorage.removeItem('fmcg_current_user');
          loadCartData(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadCartData, success]);

  // Add product to cart
  const addToCart = useCallback(
    async (productId: string, quantity: number = 1): Promise<boolean> => {
      setIsSyncing(true);
      try {
        const result = await addCartItem(productId, quantity, user?.id);
        setCart(result.cart);
        success('Produk berhasil ditambahkan ke keranjang.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menambahkan produk ke keranjang.';
        error(msg);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, success, error]
  );

  // Update quantity with optimistic debounce to handle rapid clicks safely (Section 24)
  const updateQuantity = useCallback(
    async (cartItemId: string, targetQuantity: number) => {
      if (!cart) return;

      const item = cart.items.find((i) => i.id === cartItemId);
      if (!item) return;

      // Validate stock upper bound
      if (item.product && targetQuantity > item.product.stock) {
        error(`Jumlah melebihi stok yang tersedia (${item.product.stock} ${item.product.unit}).`);
        return;
      }

      // Optimistic update in UI immediately
      setCart((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((it) => {
          if (it.id === cartItemId) {
            return { ...it, quantity: targetQuantity };
          }
          return it;
        });

        const total_items = newItems.reduce((acc, curr) => acc + curr.quantity, 0);
        const subtotal = newItems.reduce(
          (acc, curr) => acc + (curr.product?.price || curr.unit_price) * curr.quantity,
          0
        );

        return {
          ...prev,
          items: newItems,
          total_items,
          subtotal,
        };
      });

      // Clear existing debounce timer for this item
      const existingTimer = debounceTimerRef.current.get(cartItemId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Track latest desired quantity
      pendingUpdatesRef.current.set(cartItemId, targetQuantity);

      // Debounce the server/DB call by 300ms
      const timer = setTimeout(async () => {
        const finalQuantity = pendingUpdatesRef.current.get(cartItemId);
        if (finalQuantity === undefined) return;

        setIsSyncing(true);
        try {
          const updated = await updateCartItemQuantity(cartItemId, finalQuantity, user?.id);
          setCart(updated);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal memperbarui jumlah produk.';
          error(msg);
          // Rollback to server state
          loadCartData(user?.id);
        } finally {
          setIsSyncing(false);
          pendingUpdatesRef.current.delete(cartItemId);
          debounceTimerRef.current.delete(cartItemId);
        }
      }, 300);

      debounceTimerRef.current.set(cartItemId, timer);
    },
    [cart, user?.id, error, loadCartData]
  );

  // Remove from cart with Undo option
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      if (!cart) return;
      const itemToRemove = cart.items.find((i) => i.id === cartItemId);
      const originalQuantity = itemToRemove ? itemToRemove.quantity : 1;
      const originalProductId = itemToRemove ? itemToRemove.product_id : '';

      setIsSyncing(true);
      try {
        const updated = await removeCartItem(cartItemId, user?.id);
        setCart(updated);
        success('Produk dihapus dari keranjang.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus produk dari keranjang.';
        error(msg);
        loadCartData(user?.id);
      } finally {
        setIsSyncing(false);
      }
    },
    [cart, user?.id, success, error, loadCartData]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    setIsSyncing(true);
    try {
      const updated = await clearCartService(user?.id);
      setCart(updated);
      success('Keranjang berhasil dikosongkan.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengosongkan keranjang.';
      error(msg);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, success, error]);

  // Adjust quantity when product stock decreases (Section 25)
  const adjustToStock = useCallback(
    async (cartItemId: string, targetStock: number) => {
      setIsSyncing(true);
      try {
        const updated = await adjustItemToStock(cartItemId, targetStock, user?.id);
        setCart(updated);
        success(`Jumlah produk telah disesuaikan dengan stok tersedia (${targetStock} pcs).`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menyesuaikan stok produk.';
        error(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, success, error]
  );

  // Confirm price change acknowledgment (Section 15)
  const confirmPriceChange = useCallback(
    async (cartItemId: string, newPrice: number) => {
      setIsSyncing(true);
      try {
        const updated = await acceptPriceChange(cartItemId, newPrice, user?.id);
        setCart(updated);
        success('Harga produk telah diperbarui.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui harga.';
        error(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, success, error]
  );

  // Refresh cart
  const refreshCart = useCallback(async () => {
    await loadCartData(user?.id);
  }, [loadCartData, user?.id]);

  // Login handler with cart merging (TEST 6)
  const login = useCallback(
    async (email: string, name?: string) => {
      setIsSyncing(true);
      try {
        // Simple client user session or Supabase auth
        const loggedUser: CartUser = {
          id: 'user_' + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16),
          email,
          name: name || email.split('@')[0],
        };

        setUser(loggedUser);
        localStorage.setItem('fmcg_current_user', JSON.stringify(loggedUser));

        // Merge guest cart items into this user cart
        const merged = await mergeGuestCart(loggedUser.id);
        setCart(merged);
        success(`Selamat datang kembali, ${loggedUser.name}! Keranjang Anda telah disinkronkan.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal login.';
        error(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    [success, error]
  );

  // Logout handler
  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('fmcg_current_user');
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    success('Anda telah keluar dari akun.');
    loadCartData(null);
  }, [success, loadCartData]);

  // MiniCart Controls
  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);
  const toggleMiniCart = () => setIsMiniCartOpen((prev) => !prev);

  const totalCount = cart?.total_items || 0;
  const subtotal = cart?.subtotal || 0;
  const items = cart?.items || [];

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        totalCount,
        subtotal,
        isLoading,
        isSyncing,
        user,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        adjustToStock,
        confirmPriceChange,
        refreshCart,
        login,
        logout,
        isMiniCartOpen,
        openMiniCart,
        closeMiniCart,
        toggleMiniCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
