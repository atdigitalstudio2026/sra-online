import React, { useEffect, useState } from 'react';
import { getOrderByNumber } from '../services/orderService';
import { createPayment, verifyPayment } from '../services/payment/paymentService';
import { OrderWithDetails, OrderStatus, CreatePaymentResult } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { ProductImageFallback } from '../components/common/ProductImageFallback';
import { PaymentModal } from '../components/payment/PaymentModal';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  MessageSquare,
  AlertCircle,
  FileText,
  CreditCard,
  RotateCw,
} from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { siteConfig } from '../config/site';

interface OrderDetailPageProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderNumber,
  onNavigate,
}) => {
  const { user } = useCart();
  const { success, error, info } = useToast();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Payment integration state
  const [isStartingPayment, setIsStartingPayment] = useState<boolean>(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<CreatePaymentResult | null>(null);

  const loadOrderDetail = async () => {
    try {
      const data = await getOrderByNumber(orderNumber, null, user?.id, false);
      if (!data) {
        setLoadError(
          'Pesanan tidak ditemukan atau Anda tidak memiliki akses untuk melihat rincian pesanan ini.'
        );
      } else {
        setOrder(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail pesanan.';
      setLoadError(msg);
    }
  };

  const handleStartPayment = async () => {
    if (!order) return;
    setIsStartingPayment(true);
    try {
      const res = await createPayment(order.order_number, 'bank_transfer', order.guest_token);
      setPaymentResult(res);
      setShowPaymentModal(true);
    } catch (err: any) {
      error(err.message || 'Gagal memulai sesi pembayaran.');
    } finally {
      setIsStartingPayment(false);
    }
  };

  const handleVerifyStatus = async () => {
    if (!order) return;
    setIsVerifyingPayment(true);
    try {
      const res = await verifyPayment(order.order_number);
      await loadOrderDetail();
      if (res.status === 'paid') {
        success('Pembayaran terverifikasi LUNAS! Status pesanan kini diproses.');
      } else {
        info('Status pembayaran gateway saat ini: ' + res.status);
      }
    } catch (err: any) {
      error(err.message || 'Gagal memeriksa status pembayaran.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

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
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getOrderByNumber(orderNumber, null, user?.id, false);
        if (!data) {
          setLoadError(
            'Pesanan tidak ditemukan atau Anda tidak memiliki akses untuk melihat rincian pesanan ini.'
          );
        } else {
          setOrder(data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat detail pesanan.';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [orderNumber, user?.id]);

  if (isLoading) {
    return <LoadingState message="Memuat rincian pesanan..." fullHeight />;
  }

  if (loadError || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ErrorState
          title="Pesanan Tidak Ditemukan"
          message={loadError || 'Data pesanan tidak dapat diakses.'}
          onRetry={() => onNavigate('/')}
        />
      </div>
    );
  }

  // Order timeline steps (Section 30)
  const timelineSteps: { key: OrderStatus; label: string }[] = [
    { key: 'pending_payment', label: 'Menunggu Pembayaran' },
    { key: 'processing', label: 'Diproses' },
    { key: 'shipped', label: 'Dikirim' },
    { key: 'completed', label: 'Selesai' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'completed':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => (user ? onNavigate('/orders') : onNavigate('/products'))}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{user ? 'Kembali ke Pesanan Saya' : 'Lanjutkan Belanja'}</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-stone-900">
                {order.order_number}
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                {order.status === 'pending_payment'
                  ? 'Menunggu Pembayaran'
                  : order.status === 'processing'
                  ? 'Sedang Diproses'
                  : order.status === 'shipped'
                  ? 'Dalam Pengiriman'
                  : order.status === 'completed'
                  ? 'Pesanan Selesai'
                  : 'Dibatalkan'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Dipesan pada {formatDateTime(order.created_at)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-400 block">Total Pesanan</span>
            <span className="text-lg sm:text-xl font-bold text-stone-950 tabular-nums">
              {formatRupiah(order.grand_total)}
            </span>
          </div>
        </div>

        {/* Order Status Timeline (Section 30) */}
        {!isCancelled ? (
          <div className="pt-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
              Status Perjalanan Pesanan
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {timelineSteps.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-colors ${
                        isCurrent
                          ? 'bg-amber-900 text-white ring-4 ring-amber-100'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 text-stone-400 border border-stone-200'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-tight ${
                        isCurrent
                          ? 'font-bold text-amber-950'
                          : isPassed
                          ? 'font-semibold text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Pesanan ini telah dibatalkan.</span>
          </div>
        )}
      </div>

      {/* Grid: Left Items + Right Delivery & Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Items Snapshot */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
            Daftar Produk Pesanan ({order.items.length} jenis)
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-start gap-3.5 first:pt-0 last:pb-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 shrink-0">
                  <ProductImageFallback
                    src={item.product_image}
                    alt={item.product_name}
                    aspectRatio="square"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {item.product_sku}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                    {item.product_name}
                  </h3>
                  <div className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
                    {item.quantity} pcs × {formatRupiah(item.unit_price)}
                  </div>
                </div>

                <span className="text-xs font-bold text-stone-950 tabular-nums shrink-0">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing summary */}
          <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
            <div className="flex items-center justify-between">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-stone-800 tabular-nums">
                {formatRupiah(order.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Pengiriman ({order.shipping_method_name})</span>
              <span className="font-semibold text-stone-800 tabular-nums">
                {formatRupiah(order.shipping_cost)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Diskon</span>
                <span className="tabular-nums">- {formatRupiah(order.discount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-100 flex items-baseline justify-between font-bold text-sm text-stone-900">
              <span>Total Akhir</span>
              <span className="text-base text-stone-950 tabular-nums">
                {formatRupiah(order.grand_total)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Shipping & Customer Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              <MapPin className="w-4 h-4 text-stone-600" />
              <span>Tujuan Pengiriman</span>
            </div>

            <div>
              <div className="font-semibold text-stone-900 text-sm">{order.customer_name}</div>
              <div className="font-mono text-stone-500 mt-0.5">{order.customer_phone}</div>
              {order.customer_email && (
                <div className="text-stone-400 mt-0.5">{order.customer_email}</div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 text-stone-600 leading-relaxed">
              <p>{order.shipping_address}</p>
              <p>
                Kec. {order.shipping_district}, {order.shipping_city}, {order.shipping_province}{' '}
                {order.shipping_postal_code}
              </p>
            </div>

            {order.delivery_note && (
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600">
                <span className="font-semibold text-stone-700 block">Catatan untuk kurir:</span>
                "{order.delivery_note}"
              </div>
            )}
          </div>

          {/* Shipping Service */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              <Truck className="w-4 h-4 text-stone-600" />
              <span>Layanan Pengiriman</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900 block">{order.shipping_method_name}</span>
                <span className="text-[11px] text-stone-400">
                  {order.shipping_method?.estimated_days || 'Estimasi 2-4 hari kerja'}
                </span>
              </div>
              <span className="font-semibold text-stone-800 tabular-nums">
                {formatRupiah(order.shipping_cost)}
              </span>
            </div>
          </div>

          {/* Payment Status Info & Actions (Tahap 4) */}
          <div
            className={`border rounded-2xl p-5 space-y-3 text-xs ${
              order.payment_status === 'paid'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                {order.payment_status === 'paid' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pembayaran: Lunas (Paid)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pembayaran: Menunggu Pembayaran</span>
                  </>
                )}
              </span>

              <button
                type="button"
                disabled={isVerifyingPayment}
                onClick={handleVerifyStatus}
                className="text-[11px] font-semibold text-stone-700 hover:text-stone-950 underline flex items-center gap-1 disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isVerifyingPayment ? 'animate-spin' : ''}`} />
                <span>Cek Gateway</span>
              </button>
            </div>

            {order.payment_status === 'paid' ? (
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Pembayaran Anda telah sukses diverifikasi otomatis dan pesanan telah masuk ke antrean pengemasan.
              </p>
            ) : (
              <>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Lakukan pembayaran via Virtual Account, QRIS, atau Transfer Bank untuk memproses pesanan Anda.
                </p>

                {order.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={isStartingPayment}
                    onClick={handleStartPayment}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isStartingPayment ? 'Membuka...' : 'Bayar Sekarang'}</span>
                  </button>
                )}
              </>
            )}

            {/* Payment attempts count indicator */}
            {order.payments && order.payments.length > 0 && (
              <div className="pt-2 border-t border-stone-200/60 text-[11px] text-stone-600 space-y-1.5">
                <span className="font-semibold block text-stone-700">Percobaan Pembayaran ({order.payments.length}):</span>
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1 border-b border-stone-100 last:border-0">
                    <div>
                      <span className="font-medium text-stone-800 block capitalize">{p.payment_method || p.provider}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{formatDateTime(p.created_at)}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        p.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'expired'
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {order && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderNumber={order.order_number}
          orderId={order.id}
          grandTotal={order.grand_total}
          paymentToken={paymentResult?.payment_token}
          paymentUrl={paymentResult?.payment_url}
          expiresAt={paymentResult?.expires_at}
          onPaymentSuccess={() => {
            loadOrderDetail();
          }}
        />
      )}
    </div>
  );
};

