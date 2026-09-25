import React from 'react';
import { Home, Grid, Search, Heart, User, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../context/CartContext';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch?: () => void;
  onOpenCategories?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenCategories,
}) => {
  const { count: wishlistCount } = useWishlist();
  const { totalCount: cartCount, openMiniCart, user } = useCart();

  const navItems = [
    {
      id: 'home',
      label: 'Beranda',
      icon: Home,
      isActive: currentPath === '/',
      action: () => onNavigate('/'),
    },
    {
      id: 'catalog',
      label: 'Kategori',
      icon: Grid,
      isActive: currentPath === '/products' || currentPath.startsWith('/category'),
      action: () => {
        if (onOpenCategories) onOpenCategories();
        else onNavigate('/products');
      },
    },
    {
      id: 'search',
      label: 'Cari',
      icon: Search,
      isActive: false,
      action: () => {
        if (onOpenSearch) onOpenSearch();
        else onNavigate('/products');
      },
    },
    {
      id: 'wishlist',
      label: 'Favorit',
      icon: Heart,
      isActive: currentPath === '/account/wishlist',
      badge: wishlistCount > 0 ? wishlistCount : null,
      action: () => onNavigate('/account/wishlist'),
    },
    {
      id: 'account',
      label: user ? 'Akun' : 'Masuk',
      icon: User,
      isActive: currentPath.startsWith('/account') || currentPath === '/orders',
      action: () => onNavigate('/account'),
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Seluler"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-2 py-1.5 pb-safe"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                item.isActive
                  ? 'text-emerald-900 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    item.isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold px-1 min-w-[15px] h-[15px] flex items-center justify-center rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight">
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 bg-emerald-900 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
