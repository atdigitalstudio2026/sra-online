import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { OrderWithDetails } from '../../types';
import { getOrderByNumber } from '../../services/orderService';
import { reorderPastOrder } from '../../services/reorderService';
import { formatRupiah } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import {
  ArrowLeft,
  RotateCcw,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
} from 'lucide-react';

interface AccountOrderDetailPageProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
}

export const AccountOrderDetailPage: React.FC<AccountOrderDetailPageProps> = ({
  orderNumber,
  onNavigate,
}) => {
  const { user } = useCart();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const o = await getOrderByNumber(orderNumber);
        setOrder(o);
      } catch (e) {
        console.warn('Failed loading order detail', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderNumber]);

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
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
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded-xl w-1/3" />
        <div className="h-40 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
        <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
        <h3 className="text-base font-bold text-stone-800">Pesanan Tidak Ditemukan</h3>
        <p className="text-xs text-stone-500 mt-1 mb-6">
          Nomor pesanan "{orderNumber}" tidak ditemukan dalam riwayat akun Anda.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/account/orders')}
          className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Riwayat Pesanan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/account/orders')}
            className="p-2 border border-stone-200 hover:bg-stone-100 rounded-xl text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-mono">
                {order.order_number}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-stone-100 text-stone-700">
                {order.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Dibuat pada {new Date(order.created_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Reorder Button (Rule 14 & 15) */}
        <button
          type="button"
          onClick={handleReorder}
          disabled={reordering}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${reordering ? 'animate-spin' : ''}`} />
          <span>{reordering ? 'Memvalidasi Harga...' : 'Beli Lagi Pesanan Ini'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Products List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
              Rincian Produk Dipesan
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        SKU: {item.sku} &bull; {item.quantity} x {formatRupiah(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-stone-900 block">
                      {formatRupiah(item.subtotal)}
                    </span>
                    {order.payment_status === 'paid' && (
                      <button
                        type="button"
                        onClick={() => onNavigate('/account/reviews')}
                        className="mt-1 text-[11px] text-amber-800 hover:underline flex items-center gap-1 justify-end"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>Beri Ulasan</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Courier Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-3">
                <CreditCard className="w-4 h-4 text-stone-500" />
                <span>Status Pembayaran</span>
              </div>
              <p className="text-xs text-stone-600 mb-1">
                Metode: <span className="font-semibold text-stone-800 uppercase">{order.payment_method || 'Transfer Bank / VA'}</span>
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                {order.payment_status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pembayaran Berhasil (Lunas)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm">
                    <Clock className="w-3.5 h-3.5" /> Menunggu Pembayaran
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-3">
                <Truck className="w-4 h-4 text-stone-500" />
                <span>Pengiriman & Logistik</span>
              </div>
              <p className="text-xs text-stone-600 mb-1">
                Kurir: <span className="font-semibold text-stone-800">{order.shipping_method_name || 'JNE / J&T Reguler'}</span>
              </p>
              <p className="text-[11px] text-stone-500 font-mono">
                No. Resi: {order.tracking_number || 'Belum Diterbitkan'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Address */}
        <div className="space-y-6">
          {/* Summary Breakdown */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
              Ringkasan Pembayaran
            </h3>

            <div className="space-y-2 text-xs divide-y divide-stone-100">
              <div className="flex justify-between text-stone-600 pb-2">
                <span>Subtotal Produk</span>
                <span className="font-mono text-stone-900 font-medium">
                  {formatRupiah(order.subtotal)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 py-2">
                  <span>Diskon Promo / Voucher</span>
                  <span className="font-mono font-medium">-{formatRupiah(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600 py-2">
                <span>Ongkos Kirim</span>
                <span className="font-mono text-stone-900 font-medium">
                  {formatRupiah(order.shipping_cost)}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3 font-bold text-sm text-stone-900">
                <span>Total Belanja</span>
                <span className="font-mono text-base text-amber-900">
                  {formatRupiah(order.grand_total)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-3">
              <MapPin className="w-4 h-4 text-stone-500" />
              <span>Alamat Pengiriman</span>
            </div>
            <p className="text-xs font-bold text-stone-800">{order.customer_name}</p>
            <p className="text-xs text-stone-500 mb-2">{order.customer_phone}</p>
            <p className="text-xs text-stone-600 leading-relaxed">{order.shipping_address}</p>
            <p className="text-[11px] text-stone-400 mt-1">
              {order.shipping_subdistrict}, {order.shipping_district}, {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
