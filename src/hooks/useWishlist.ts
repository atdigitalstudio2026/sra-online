import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import {
  getGuestWishlistIds,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../services/wishlistService';
import { ProductWithDetails } from '../types';

export function useWishlist() {
  const { user } = useCart();
  const { success, info } = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadIds = useCallback(async () => {
    if (!user) {
      setWishlistIds(getGuestWishlistIds());
    } else {
      const items = await getWishlist(user.id);
      setWishlistIds(items.map((i) => i.product_id));
    }
  }, [user]);

  useEffect(() => {
    loadIds();

    const handleUpdate = () => {
      loadIds();
    };

    window.addEventListener('fmcg_wishlist_updated', handleUpdate);
    return () => window.removeEventListener('fmcg_wishlist_updated', handleUpdate);
  }, [loadIds]);

  const toggleWishlist = async (product: ProductWithDetails): Promise<boolean> => {
    setLoading(true);
    const isSaved = wishlistIds.includes(product.id);

    try {
      if (isSaved) {
        await removeFromWishlist(product.id, user?.id);
        setWishlistIds((prev) => prev.filter((id) => id !== product.id));
        info(`${product.name} telah dikeluarkan dari daftar favorit.`);
        return false;
      } else {
        await addToWishlist(product.id, user?.id, product.price);
        setWishlistIds((prev) => [...prev, product.id]);
        success(`${product.name} berhasil ditambahkan ke daftar favorit.`);
        return true;
      }
    } finally {
      setLoading(false);
    }
  };

  const isFavorited = (productId: string) => wishlistIds.includes(productId);

  return {
    wishlistIds,
    count: wishlistIds.length,
    toggleWishlist,
    isFavorited,
    loading,
    refresh: loadIds,
  };
}
