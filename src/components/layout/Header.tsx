import React, { useState } from 'react';
import { siteConfig } from '../../config/site';
import { Search, Menu, X, ShieldCheck, ChevronDown, Package, User } from 'lucide-react';
import { Category } from '../../types';
import { CartBadge } from '../cart/CartBadge';
import { useCart } from '../../context/CartContext';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  currentPath: string;
  categories: Category[];
  onNavigate: (path: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  categories,
  onNavigate,
  onSearchSubmit,
}) => {
  const { openMiniCart, user } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    } else {
      onNavigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Beranda', path: '/' },
    { label: 'Katalog Produk', path: '/products' },
    { label: 'Pesanan Saya', path: '/orders' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 transition-all">
      {/* Main Top Bar Contract: 3 Zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-left font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900 hover:text-amber-950 transition-colors whitespace-nowrap"
          >
            {siteConfig.name}
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
          {navLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => onNavigate(link.path)}
              className={`hover:text-stone-950 transition-colors whitespace-nowrap ${
                currentPath === link.path ? 'text-stone-950 font-semibold' : ''
              }`}
            >
              {link.label}
            </button>
          ))}

          {/* Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-1 hover:text-stone-950 transition-colors whitespace-nowrap"
            >
              <span>Kategori</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {categoryDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('/products');
                    setCategoryDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Semua Kategori
                </button>
                <div className="h-px bg-stone-100 my-1" />
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onNavigate(`/category/${c.slug}`);
                      setCategoryDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Actions (Search + Shopping Cart + Login/User + Admin button) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search on Desktop */}
          <form onSubmit={handleSearch} className="hidden sm:flex relative items-center w-40 md:w-56">
            <Search className="absolute left-3 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari komoditas pangan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100 border border-transparent rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:outline-hidden transition-all"
            />
          </form>

          {/* User Account / Auth Modal Trigger */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            aria-label="Akun Pengguna"
            title={user ? `Login sebagai ${user.email}` : 'Masuk / Hubungkan Akun'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <User className={`w-4 h-4 ${user ? 'text-amber-900' : 'text-stone-500'}`} />
            <span className="hidden md:inline max-w-[90px] truncate">
              {user ? (user.name || user.email.split('@')[0]) : 'Masuk'}
            </span>
          </button>

          {/* Cart Badge with Total Quantity */}
          <CartBadge onClick={openMiniCart} />

          {/* Admin Dashboard Button */}
          <button
            type="button"
            onClick={() => onNavigate('/admin')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
            <span>Admin</span>
          </button>

          {/* Mobile hamburger menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka Menu"
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          {/* Mobile search bar */}
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kurma, wijen, kacang, bawang..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden focus:border-stone-400"
            />
          </form>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onNavigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-md"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/products');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-md"
            >
              Semua Produk
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/orders');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-md"
            >
              Pesanan Saya
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/cart');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-amber-950 font-semibold hover:bg-stone-50 rounded-md flex items-center justify-between"
            >
              <span>Keranjang Belanja</span>
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Buka
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-md"
            >
              {user ? `Akun: ${user.email}` : 'Masuk / Akun'}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 rounded-md"
            >
              Panel Admin
            </button>
          </div>

          <div>
            <div className="px-3 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Kategori Produk
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onNavigate(`/category/${c.slug}`);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-md truncate text-left"
                >
                  <Package className="w-3.5 h-3.5 text-stone-400 shrink-0" />
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
