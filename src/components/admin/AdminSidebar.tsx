import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ArrowLeft,
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Truck,
  CreditCard,
  Sliders,
  Users,
  BarChart3,
  FileSpreadsheet,
  Boxes,
  ShieldAlert,
} from 'lucide-react';
import { siteConfig } from '../../config/site';
import { isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabase';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  onNavigate,
  onCloseMobile,
}) => {
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
  }>({
    tested: false,
    connected: false,
    message: 'Memeriksa koneksi...',
  });

  useEffect(() => {
    async function check() {
      if (!isSupabaseConfigured()) {
        setSupabaseStatus({
          tested: true,
          connected: false,
          message: 'Local Offline Preview (Konfigurasi .env tersedia)',
        });
        return;
      }

      const res = await testSupabaseConnection();
      setSupabaseStatus({
        tested: true,
        connected: res.connected,
        message: res.connected ? 'Terhubung ke PostgreSQL' : 'Gagal terhubung ke Cloud',
      });
    }
    check();
  }, []);

  const navItems = [
    { label: 'Dashboard Utama', path: '/admin', icon: LayoutDashboard },
    { label: 'Analitik Penjualan', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Kelola Pesanan', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Data Pelanggan', path: '/admin/customers', icon: Users },
    { label: 'Inventaris & Stok', path: '/admin/inventory', icon: Boxes },
    { label: 'Laporan Penjualan', path: '/admin/reports/sales', icon: FileSpreadsheet },
    { label: 'Katalog Produk', path: '/admin/products', icon: Package },
    { label: 'Transaksi Pembayaran', path: '/admin/payments', icon: CreditCard },
    { label: 'Metode Pengiriman', path: '/admin/shipping-methods', icon: Truck },
    { label: 'Pengguna & Peran', path: '/admin/users', icon: ShieldAlert },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col h-full border-r border-stone-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800">
        <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-1">
          Panel Manajemen
        </div>
        <div className="font-serif text-lg font-bold text-white tracking-tight">
          {siteConfig.name}
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-amber-800/90 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Database Connection Indicator */}
      <div className="p-4 border-t border-stone-800 bg-stone-950/40">
        <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-stone-300">
          <Database className="w-3.5 h-3.5 text-stone-400" />
          <span>Status Database</span>
        </div>
        <div className="flex items-start gap-2 text-[11px] leading-snug">
          {supabaseStatus.connected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-emerald-300 font-medium">
                {supabaseStatus.message}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-stone-400">
                <span className="text-stone-300 font-medium block">
                  {isSupabaseConfigured() ? 'Koneksi Supabase Error' : 'Database: Local Active'}
                </span>
                <span className="text-[10px] text-stone-500">
                  {isSupabaseConfigured()
                    ? 'Periksa konfigurasi .env & schema SQL'
                    : 'Data tersimpan di browser & siap sinkron cloud'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Return to Storefront */}
      <div className="p-3 border-t border-stone-800">
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-white bg-stone-800/40 hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Toko</span>
        </button>
      </div>
    </aside>
  );
};
