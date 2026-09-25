import React, { useState } from 'react';
import { siteConfig } from '../../config/site';
import {
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Package,
  User,
  Heart,
  ShoppingBag,
  Building2,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { Category, Brand } from '../../types';
import { CartBadge } from '../cart/CartBadge';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../hooks/useWishlist';
import { AuthModal } from '../auth/AuthModal';
import { TopPromoBar } from './TopPromoBar';
import { MegaMenu } from './MegaMenu';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  currentPath: string;
  categories: Category[];
  brands?: Brand[];
  onNavigate: (path: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  categories,
  brands = [],
  onNavigate,
  onSearchSubmit,
}) => {
  const { openMiniCart, user } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const navLinks = [
    { label: 'Beranda', path: '/' },
    { label: 'Katalog Produk', path: '/products' },
    { label: 'Pesanan Saya', path: '/orders' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs transition-all">
      {/* 1. TOP PROMO & ANNOUNCEMENT BAR */}
      <TopPromoBar onNavigate={onNavigate} />

      {/* 2. MAIN NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo & Kategori Button */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-left group flex items-center gap-2.5 focus:outline-hidden"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:bg-emerald-900 transition-colors">
                NP
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-emerald-950 transition-colors whitespace-nowrap">
                  {siteConfig.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold hidden sm:inline">
                  Distributor Pangan Premium
                </span>
              </div>
            </button>

            {/* Desktop Mega Menu Trigger */}
            <div className="hidden lg:block relative">
              <button
                type="button"
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                onMouseEnter={() => setMegaMenuOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  megaMenuOpen
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-800 hover:bg-stone-200/80'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Kategori</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    megaMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Large Centered Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <SearchBar
              categories={categories}
              brands={brands}
              onNavigate={onNavigate}
              onSearchSubmit={onSearchSubmit}
            />
          </div>

          {/* Right Action Icons (Account, Wishlist, Cart, Admin) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Account Button */}
            <button
              type="button"
              onClick={() => {
                if (user) {
                  onNavigate('/account');
                } else {
                  setAuthModalOpen(true);
                }
              }}
              aria-label="Akun Pengguna"
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-xl transition-colors whitespace-nowrap"
            >
              <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
                <User className={`w-4 h-4 ${user ? 'text-emerald-900' : 'text-stone-600'}`} />
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[10px] text-stone-400 font-medium">Selamat datang</span>
                <span className="text-xs font-bold text-stone-800 max-w-[90px] truncate">
                  {user ? (user.name || user.email.split('@')[0]) : 'Masuk / Daftar'}
                </span>
              </div>
            </button>

            {/* Wishlist Icon */}
            <button
              type="button"
              onClick={() => onNavigate('/account/wishlist')}
              aria-label="Daftar Favorit"
              className="relative p-2 text-stone-700 hover:text-emerald-950 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <Heart className="w-5 h-5 stroke-[1.8]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full shadow-xs">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <CartBadge onClick={openMiniCart} />

            {/* Admin Direct Button (Desktop) */}
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
              <span>Admin</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka Menu Navigasi"
              className="md:hidden p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar in 2nd row for quick access */}
        <div className="md:hidden pb-3 pt-1">
          <SearchBar
            categories={categories}
            brands={brands}
            onNavigate={onNavigate}
            onSearchSubmit={onSearchSubmit}
            isMobile
          />
        </div>
      </div>

      {/* Mega Menu Component */}
      <MegaMenu
        categories={categories}
        isOpen={megaMenuOpen}
        onClose={() => setMegaMenuOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-4 pb-8 space-y-5 shadow-2xl animate-in slide-in-from-top-2">
          {/* Quick User Banner in Mobile Drawer */}
          <div className="p-3.5 rounded-2xl bg-emerald-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center font-bold text-amber-300">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-200">
                  {user ? 'Terhubung sebagai' : 'Selamat Datang'}
                </p>
                <p className="text-sm font-bold text-white truncate max-w-[180px]">
                  {user ? (user.name || user.email) : 'Tamu / Pembeli'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) onNavigate('/account');
                else setAuthModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-400 text-stone-950 text-xs font-bold rounded-lg shadow-sm"
            >
              {user ? 'Akun' : 'Masuk'}
            </button>
          </div>

          {/* Primary Navigation Links */}
          <div className="space-y-1 text-sm font-semibold text-stone-800">
            <button
              type="button"
              onClick={() => {
                onNavigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-50"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/products');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-50"
            >
              Semua Katalog Produk
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/orders');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-50"
            >
              Pesanan Saya
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/account/wishlist');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-50 flex items-center justify-between"
            >
              <span>Favorit Saya</span>
              {wishlistCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/#b2b');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-50 text-emerald-900 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Pendaftaran B2B & Reseller</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-50 text-stone-600 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-stone-500" />
              <span>Panel Manajemen Admin</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
              Kategori Komoditas Pangan
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onNavigate(`/category/${c.slug}`);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl truncate text-left"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
