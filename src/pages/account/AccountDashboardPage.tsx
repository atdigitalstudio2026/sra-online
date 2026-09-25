import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Heart,
  MapPin,
  Star,
  Award,
  ArrowRight,
  RotateCcw,
  Clock,
  Sparkles,
  Package,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { AccountDashboardData } from '../../types';
import { getAccountDashboardData } from '../../services/customerProfileService';
import { reorderPastOrder } from '../../services/reorderService';
import { formatRupiah } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';

interface AccountDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AccountDashboardPage: React.FC<AccountDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useCart();
  const [data, setData] = useState<AccountDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    async function load() {
      if (user?.id) {
        setLoading(true);
        try {
          const dashboardData = await getAccountDashboardData(user.id);
          setData(dashboardData);
        } catch (e) {
          console.warn('Failed loading account dashboard:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleReorder = async (order: any) => {
    setReorderingId(order.id);
    try {
      const result = await reorderPastOrder(order, user?.id);
      if (result.success) {
        success(result.message);
        onNavigate('/cart');
      } else {
        error(result.message);
      }
    } catch {
      error('Gagal memproses pembelian ulang.');
    } finally {
      setReorderingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-stone-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const customerName = profile?.full_name || user?.name || user?.email?.split('@')[0] || 'Pelanggan';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-widest">
            Portal Pelanggan Komoditas
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
            Selamat Datang, {customerName}!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Pantau status pengiriman komoditas pangan, perolehan poin loyalitas, dan transaksi belanja Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/products')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <span>Mulai Belanja</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Main Metrics Grid (Rules 3, 38) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Orders */}
        <button
          type="button"
          onClick={() => onNavigate('/account/orders')}
          className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 text-left shadow-xs hover:border-amber-700/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Pesanan</span>
            <ShoppingBag className="w-4 h-4 group-hover:text-amber-800 transition-colors" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
            {data?.total_orders || 0}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Transaksi tercatat</span>
        </button>

        {/* Total Spending */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Belanja</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 font-mono">
            {formatRupiah(data?.total_spending || 0)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Akumulasi sukses</span>
        </div>

        {/* Wishlist Items */}
        <button
          type="button"
          onClick={() => onNavigate('/account/wishlist')}
          className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 text-left shadow-xs hover:border-amber-700/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Wishlist</span>
            <Heart className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
            {data?.wishlist_count || 0}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Produk disimpan</span>
        </button>

        {/* Loyalty Points */}
        <button
          type="button"
          onClick={() => onNavigate('/account/loyalty')}
          className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 text-left shadow-xs hover:border-amber-700/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Poin Loyalitas</span>
            <Award className="w-4 h-4 text-amber-600 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
            {data?.loyalty_points || 0}
          </div>
          <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Siap ditukar reward &rarr;</span>
        </button>
      </div>

      {/* Quick Action Navigation Grid (Rule 3) */}
      <div>
        <h3 className="text-sm font-bold text-stone-900 mb-3">Aksi Cepat</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/account/orders')}
            className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-2xl text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center mb-2">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900 group-hover:text-amber-900">Pesanan Saya</p>
            <p className="text-[11px] text-stone-400">Lacak pengiriman</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/account/wishlist')}
            className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-2xl text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Heart className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900 group-hover:text-red-700">Wishlist</p>
            <p className="text-[11px] text-stone-400">Produk favorit</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/account/addresses')}
            className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-2xl text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
              <MapPin className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900 group-hover:text-blue-900">Buku Alamat</p>
            <p className="text-[11px] text-stone-400">Lokasi tujuan</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/account/reviews')}
            className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-2xl text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Star className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900 group-hover:text-amber-800">Ulasan Produk</p>
            <p className="text-[11px] text-stone-400">{data?.pending_reviews_count || 0} belum diisi</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/account/loyalty')}
            className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-2xl text-left transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900 group-hover:text-purple-900">Katalog Reward</p>
            <p className="text-[11px] text-stone-400">Tukar voucher</p>
          </button>
        </div>
      </div>

      {/* Recent Orders Section with Reorder ("Beli Lagi") Button (Rule 14 & 15) */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Pesanan Terakhir</h3>
            <p className="text-xs text-stone-500">5 transaksi pembelian pangan terbaru Anda.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/account/orders')}
            className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
          >
            <span>Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!data?.recent_orders || data.recent_orders.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Package className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-600">Belum Ada Transaksi</p>
            <p className="text-[11px] text-stone-400">Mulailah memesan komoditas pangan pilihan.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {data.recent_orders.map((order) => (
              <div key={order.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {order.order_number}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      &bull; {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 truncate">
                    {order.items?.map((i) => `${i.product_name} (${i.quantity}x)`).join(', ') || 'Item komoditas'}
                  </p>
                  <p className="text-xs font-bold text-stone-900 mt-1">
                    {formatRupiah(order.grand_total)}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                  {/* Reorder Button (Rule 14 & 15) */}
                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    disabled={reorderingId === order.id}
                    title="Beli produk dalam pesanan ini dengan harga terkini"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${reorderingId === order.id ? 'animate-spin' : ''}`} />
                    <span>Beli Lagi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate(`/account/orders/${order.order_number}`)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-medium transition-colors"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
