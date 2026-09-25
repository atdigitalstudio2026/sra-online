import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  Award,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CustomerProfile, LoyaltyAccount } from '../../types';
import { getCustomerProfile } from '../../services/customerProfileService';
import { getLoyaltyAccount } from '../../services/loyaltyService';

interface AccountLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  title?: string;
  subtitle?: string;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  children,
  currentPath,
  onNavigate,
  title,
  subtitle,
}) => {
  const { user, logout } = useCart();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (user?.id) {
        const [p, l] = await Promise.all([
          getCustomerProfile(user.id),
          getLoyaltyAccount(user.id),
        ]);
        setProfile(p);
        setLoyalty(l);
      }
    }
    load();

    const handleLoyaltyUpdate = () => {
      if (user?.id) {
        getLoyaltyAccount(user.id).then(setLoyalty);
      }
    };
    window.addEventListener('fmcg_loyalty_updated', handleLoyaltyUpdate);
    return () => window.removeEventListener('fmcg_loyalty_updated', handleLoyaltyUpdate);
  }, [user]);

  const navItems = [
    { label: 'Ringkasan Akun', path: '/account', icon: User },
    { label: 'Profil Saya', path: '/account/profile', icon: User },
    { label: 'Pesanan Saya', path: '/account/orders', icon: ShoppingBag },
    { label: 'Buku Alamat', path: '/account/addresses', icon: MapPin },
    { label: 'Wishlist Favorit', path: '/account/wishlist', icon: Heart },
    { label: 'Ulasan Produk', path: '/account/reviews', icon: Star },
    { label: 'Program Loyalitas', path: '/account/loyalty', icon: Award },
    { label: 'Pusat Notifikasi', path: '/notifications', icon: Bell },
  ];

  const handleLogout = async () => {
    await logout();
    onNavigate('/');
  };

  const displayName = profile?.full_name || user?.name || user?.email?.split('@')[0] || 'Pelanggan';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Return Link */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Toko</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 shadow-2xs"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menu Portal</span>
          </button>
        </div>

        {/* Mobile Horizontal Fast Tabs */}
        <div className="md:hidden mb-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-950 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 items-start">
          {/* Sidebar Area */}
          <aside
            className={`md:col-span-1 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs transition-all ${
              mobileMenuOpen ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Customer Identity Card */}
            <div className="flex items-center gap-3 pb-5 border-b border-stone-100">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-12 h-12 rounded-2xl object-cover border border-stone-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-amber-300 font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-stone-900 truncate">{displayName}</h3>
                <p className="text-xs text-stone-400 truncate">{user?.email || profile?.phone || 'Akun Aktif'}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{loyalty?.current_points || 0} Poin</span>
                </div>
              </div>
            </div>

            {/* Account Navigation */}
            <nav className="py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      onNavigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-emerald-950 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  </button>
                );
              })}
            </nav>

            {/* Logout button */}
            <div className="pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className="md:col-span-3 min-w-0">
            {/* Header Title Bar */}
            {(title || subtitle) && (
              <div className="mb-6">
                {title && <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">{title}</h1>}
                {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-1">{subtitle}</p>}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
