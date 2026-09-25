import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getUserOrders } from '../services/orderService';
import { OrderWithDetails, OrderStatus } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { ProductImageFallback } from '../components/common/ProductImageFallback';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { AuthModal } from '../components/auth/AuthModal';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  Search,
  LogIn,
  AlertCircle,
} from 'lucide-react';

interface MyOrdersPageProps {
  onNavigate: (path: string) => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onNavigate }) => {
  const { user } = useCart();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Manual lookup input for guest users
  const [guestOrderQuery, setGuestOrderQuery] = useState('');

  // SEO noindex
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    const previousContent = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      if (meta) {
        if (created) meta.remove();
        else meta.content = previousContent;
      }
    };
  }, []);

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getUserOrders(user.id, statusFilter);
        setOrders(data);
      } catch (err) {
        console.error('Failed loading user orders', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.id, statusFilter]);

  const filterTabs: { key: OrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Semua Pesanan' },
    { key: 'pending_payment', label: 'Menunggu Pembayaran' },
    { key: 'processing', label: 'Diproses' },
    { key: 'shipped', label: 'Dikirim' },
    { key: 'completed', label: 'Selesai' },
    { key: 'cancelled', label: 'Dibatalkan' },
  ];

  const handleGuestLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestOrderQuery.trim()) return;
    onNavigate(`/orders/${guestOrderQuery.trim().toUpperCase()}`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            Menunggu Pembayaran
          </span>
        );
      case 'processing':
        return (
          <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
            Sedang Diproses
          </span>
        );
      case 'shipped':
        return (
          <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
            Dalam Pengiriman
          </span>
        );
      case 'completed':
        return (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
            Dibatalkan
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Pesanan Saya
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Riwayat transaksi komoditas pangan dan status logistik terkini.
          </p>
        </div>

        {/* Guest lookup form */}
        <form onSubmit={handleGuestLookup} className="flex items-center gap-2">
          <input
            type="text"
            value={guestOrderQuery}
            onChange={(e) => setGuestOrderQuery(e.target.value)}
            placeholder="Cari No. Order (ORD-...)"
            className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-400 font-mono uppercase"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Lacak
          </button>
        </form>
      </div>

      {/* If Not Logged In, Prompt to Log in or Search */}
      {!user && (
        <div className="p-6 bg-white border border-stone-200 rounded-2xl text-center space-y-3">
          <LogIn className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif text-base font-bold text-stone-900">
            Masuk untuk Melihat Riwayat Pesanan Anda
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Hubungkan akun Anda untuk melihat seluruh daftar pesanan yang pernah Anda lakukan, atau masukkan nomor pesanan di atas untuk melacak pesanan tamu.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors shadow-xs"
          >
            Masuk / Hubungkan Akun
          </button>
        </div>
      )}

      {/* Filter Tabs for Logged-In User */}
      {user && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-100 text-xs">
          {filterTabs.map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Orders List */}
      {user && (
        <>
          {isLoading ? (
            <LoadingState message="Memuat riwayat pesanan..." />
          ) : orders.length === 0 ? (
            <EmptyState
              title="Belum Ada Pesanan"
              description="Anda belum memiliki pesanan dengan filter status yang dipilih."
              actionLabel="Mulai Belanja"
              onAction={() => onNavigate('/products')}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => onNavigate(`/orders/${o.order_number}`)}
                  className="bg-white border border-stone-200/90 rounded-2xl p-5 hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer space-y-4"
                >
                  {/* Order header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {o.order_number}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-stone-400">{formatDateTime(o.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(o.status)}
                      <span className="text-[11px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded">
                        {o.payment_status === 'paid' ? 'Lunas' : 'Belum Dibayar'}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {o.items.slice(0, 3).map((it) => (
                        <div
                          key={it.id}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 shrink-0"
                        >
                          <ProductImageFallback
                            src={it.product_image}
                            alt={it.product_name}
                            aspectRatio="square"
                          />
                        </div>
                      ))}
                      {o.items.length > 3 && (
                        <span className="text-xs text-stone-400 font-medium">
                          +{o.items.length - 3} lainnya
                        </span>
                      )}
                      <div className="text-xs text-stone-600 line-clamp-1">
                        {o.items.map((i) => i.product_name).join(', ')}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-stone-400 block">Total Pesanan</span>
                      <span className="text-base font-bold text-stone-950 tabular-nums">
                        {formatRupiah(o.grand_total)}
                      </span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span className="text-[11px]">
                      Kurir: <strong>{o.shipping_method_name}</strong>
                    </span>
                    <span className="font-semibold text-stone-900 flex items-center gap-1 group">
                      <span>Rincian Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
