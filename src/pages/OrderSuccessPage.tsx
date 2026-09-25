import React, { useEffect, useState } from 'react';
import { getOrderByNumber } from '../services/orderService';
import { createPayment, verifyPayment } from '../services/payment/paymentService';
import { OrderWithDetails, CreatePaymentResult } from '../types';
import { formatRupiah } from '../utils/formatters';
import { siteConfig } from '../config/site';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { PaymentModal } from '../components/payment/PaymentModal';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  MessageSquare,
  FileText,
  CreditCard,
  RotateCw,
  AlertTriangle,
  QrCode,
  Building2,
  Lock,
} from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';

interface OrderSuccessPageProps {
  orderNumber: string;
  onNavigate: (path: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  orderNumber,
  onNavigate,
}) => {
  const { user } = useCart();
  const { success, error, info } = useToast();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<CreatePaymentResult | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

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

  const loadOrder = async () => {
    try {
      const data = await getOrderByNumber(orderNumber, null, user?.id, false);
      setOrder(data);
    } catch (e) {
      console.error('Failed loading order:', e);
    }
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await loadOrder();
      setIsLoading(false);
    }
    load();
  }, [orderNumber, user?.id]);

  // Handle "Bayar Sekarang" click (Section 8 & 12)
  const handlePayNow = async () => {
    if (!order) return;
    setIsProcessingPayment(true);
    try {
      // Calls create-payment
      const res = await createPayment(order.order_number, 'bank_transfer', order.guest_token);
      setPaymentResult(res);
      setShowPaymentModal(true);
    } catch (err: any) {
      error(err.message || 'Gagal memulai sesi pembayaran.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Re-verify payment status on demand
  const handleCheckStatus = async () => {
    if (!order) return;
    setIsVerifying(true);
    try {
      const res = await verifyPayment(order.order_number);
      await loadOrder();
      if (res.status === 'paid') {
        success('Pembayaran terverifikasi LUNAS! Status pesanan kini diproses.');
      } else {
        info('Status pembayaran saat ini: ' + res.status);
      }
    } catch (err: any) {
      error(err.message || 'Gagal memeriksa status pembayaran.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Memuat informasi pesanan & pembayaran..." fullHeight />;
  }

  const isPaid = order?.payment_status === 'paid';
  const isCancelled = order?.status === 'cancelled';

  const whatsappMessage = encodeURIComponent(
    `Halo ${siteConfig.name}, saya telah membuat pesanan dengan nomor ${orderNumber}. Mohon bantuan terkait status pesanan dan pembayaran.`
  );
  const whatsappUrl = `https://wa.me/${siteConfig.contact.whatsapp}?text=${whatsappMessage}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        {/* Status Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
            isPaid
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}
        >
          {isPaid ? <CheckCircle2 className="w-9 h-9" /> : <Clock className="w-9 h-9" />}
        </div>

        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm ${
              isPaid
                ? 'text-emerald-800 bg-emerald-100/70'
                : 'text-amber-800 bg-amber-100/70'
            }`}
          >
            {isPaid ? 'Pembayaran Berhasil — Lunas' : 'Pesanan Berhasil Dibuat — Menunggu Pembayaran'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
            {isPaid ? 'Pembayaran Anda Telah Terverifikasi!' : 'Selesaikan Pembayaran Pesanan Anda'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isPaid
              ? 'Terima kasih! Pesanan komoditas Anda sedang disiapkan oleh tim gudang kami.'
              : 'Silakan lakukan pembayaran agar pesanan dapat segera diproses ke tahap pengemasan & pengiriman.'}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">Nomor Pesanan</span>
            <span className="font-mono font-bold text-stone-900">{orderNumber}</span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">Status Pesanan</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                isPaid
                  ? 'text-emerald-800 bg-emerald-100'
                  : 'text-amber-800 bg-amber-100'
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isPaid ? 'Diproses (Processing)' : 'Menunggu Pembayaran'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">Status Pembayaran</span>
            <span
              className={`font-semibold capitalize ${
                isPaid ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isPaid ? 'Lunas (Paid)' : 'Belum Dibayar (Unpaid)'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs font-bold text-stone-800">Total Tagihan</span>
            <span className="text-xl font-bold text-stone-950 tabular-nums font-mono">
              {order ? formatRupiah(order.grand_total) : '-'}
            </span>
          </div>
        </div>

        {/* Payment Action Banner (Section 8: "Bayar Sekarang") */}
        {!isPaid && !isCancelled && (
          <div className="p-5 bg-amber-500/10 border border-amber-300/80 rounded-2xl text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-xs text-amber-950 leading-relaxed">
                <span className="font-bold block text-sm mb-1 text-stone-900">
                  Pembayaran Terintegrasi (Tahap 4 Aktif)
                </span>
                Tersedia metode pembayaran otomatis via Virtual Account (BCA, Mandiri, BNI, BRI), QRIS Instan, dan Transfer Bank.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handlePayNow}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isProcessingPayment ? 'Membuka Gateway...' : 'Bayar Sekarang'}</span>
              </button>

              <button
                type="button"
                disabled={isVerifying}
                onClick={handleCheckStatus}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Memeriksa...' : 'Cek Status'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate(`/orders/${orderNumber}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Lihat Detail &amp; Riwayat Pesanan</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Konfirmasi via WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Belanja Lagi</span>
          </button>
        </div>
      </div>

      {/* Interactive Payment Instructions Modal */}
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
            loadOrder();
          }}
        />
      )}
    </div>
  );
};
