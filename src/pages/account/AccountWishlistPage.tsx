import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { WishlistItem } from '../../types';
import { getWishlist } from '../../services/wishlistService';
import { ProductCard } from '../../components/product/ProductCard';
import { Heart, ArrowRight } from 'lucide-react';

interface AccountWishlistPageProps {
  onNavigate: (path: string) => void;
}

export const AccountWishlistPage: React.FC<AccountWishlistPageProps> = ({ onNavigate }) => {
  const { user } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    setLoading(true);
    try {
      const list = await getWishlist(user?.id);
      setItems(list);
    } catch (e) {
      console.warn('Failed loading wishlist', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const handleUpdate = () => loadItems();
    window.addEventListener('fmcg_wishlist_updated', handleUpdate);
    return () => window.removeEventListener('fmcg_wishlist_updated', handleUpdate);
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            Wishlist & Produk Favorit
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Daftar komoditas pangan yang Anda simpan untuk dibeli nanti.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full font-mono border border-emerald-200">
          {items.length} item
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-72 bg-stone-200 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center max-w-md mx-auto my-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div>
            <h4 className="text-base font-bold text-stone-900">Wishlist Masih Kosong</h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Belum ada komoditas yang Anda simpan. Temukan produk favorit Anda dan klik tanda hati untuk menyimpannya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Mulai Jelajahi Produk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => {
            if (!item.product) return null;
            return (
              <ProductCard
                key={item.id}
                product={item.product}
                onSelect={(p) => onNavigate(`/products/${p.slug}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
