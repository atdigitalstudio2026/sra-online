import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { OrderWithDetails, OrderStatus } from '../../types';
import { getAdminOrders } from '../../services/orderService';
import { getCustomerProfile } from '../../services/customerProfileService';
import { reorderPastOrder } from '../../services/reorderService';
import { formatRupiah } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import {
  ShoppingBag,
  RotateCcw,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Package,
  Search,
  ExternalLink,
} from 'lucide-react';

interface AccountOrdersPageProps {
  onNavigate: (path: string) => void;
}

export const AccountOrdersPage: React.FC<AccountOrdersPageProps> = ({ onNavigate }) => {
  const { user } = useCart();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    async function load() {
      if (user?.id) {
        setLoading(true);
        try {
          const [profile, ordersRes] = await Promise.all([
            getCustomerProfile(user.id),
            getAdminOrders({ limit: 100 }),
          ]);

          const list = (ordersRes.orders || []).filter(
            (o) =>
              o.user_id === user.id ||
              (profile?.email && o.customer_email?.toLowerCase() === profile.email.toLowerCase()) ||
              (profile?.phone && o.customer_phone === profile.phone)
          );

          setOrders(list);
        } catch (e) {
          console.warn('Failed loading user orders', e);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [user]);

  const handleReorder = async (order: OrderWithDetails) => {
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

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_payment') return o.payment_status === 'pending' || o.status === 'pending_payment';
    return o.status === statusFilter;
  });

  const getStatusBadge = (order: OrderWithDetails) => {
    if (order.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-sm">
          <XCircle className="w-3 h-3" /> Dibatalkan
        </span>
      );
    }
    if (order.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
          <CheckCircle className="w-3 h-3" /> Selesai
        </span>
      );
    }
    if (order.status === 'shipped') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-sm">
          <Truck className="w-3 h-3" /> Dikirim
        </span>
      );
    }
    if (order.status === 'processing') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-sm">
          <Package className="w-3 h-3" /> Diproses
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-sm">
        <Clock className="w-3 h-3" /> Menunggu Pembayaran
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">Riwayat Pesanan</h2>
          <p className="text-xs text-stone-500">Daftar transaksi pembelian komoditas pangan Anda.</p>
        </div>

        {/* Filter Bar (Buttons with interactive states per frontend-design skill) */}
        <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending_payment', label: 'Menunggu Bayar' },
            { id: 'processing', label: 'Diproses' },
            { id: 'shipped', label: 'Dikirim' },
            { id: 'completed', label: 'Selesai' },
            { id: 'cancelled', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-stone-200 rounded-2xl" />
          <div className="h-32 bg-stone-200 rounded-2xl" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <h4 className="text-xs font-bold text-stone-800">Tidak Ada Pesanan</h4>
          <p className="text-xs text-stone-400 mt-1 mb-4">
            Tidak ada transaksi yang cocok dengan filter status terpilih.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold"
          >
            Jelajahi Katalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-stone-300 transition-colors"
            >
              {/* Top Order Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-stone-900">
                    {order.order_number}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order)}
                  <span className="text-xs text-stone-400">&bull;</span>
                  <span className="text-xs font-mono font-bold text-stone-900">
                    {formatRupiah(order.grand_total)}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="py-4 space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-9 h-9 rounded-lg object-cover border border-stone-100 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 truncate">{item.product_name}</p>
                        <p className="text-[11px] text-stone-400">
                          {item.quantity}x &bull; {formatRupiah(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-stone-900 shrink-0">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] text-stone-500">
                  <span>Metode: </span>
                  <span className="font-semibold uppercase text-stone-700">
                    {order.shipping_method_name || 'Kurir Reguler'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Reorder ("Beli Lagi") Button (Rule 14 & 15) */}
                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    disabled={reorderingId === order.id}
                    title="Beli kembali produk dalam pesanan ini dengan harga terkini"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${reorderingId === order.id ? 'animate-spin' : ''}`} />
                    <span>Beli Lagi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate(`/account/orders/${order.order_number}`)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium transition-colors"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
