import React, { useEffect, useState } from 'react';
import { verifyPayment } from '../services/payment/paymentService';
import { getOrderByNumber } from '../services/orderService';
import { OrderWithDetails } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  RefreshCw,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';

interface PaymentResultPageProps {
  onNavigate: (path: string) => void;
}

export const PaymentResultPage: React.FC<PaymentResultPageProps> = ({ onNavigate }) => {
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [status, setStatus] = useState<'paid' | 'pending' | 'failed' | 'expired'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ord = urlParams.get('order_id') || urlParams.get('orderNumber') || '';
    setOrderNumber(ord);

    async function checkFinalStatus() {
      if (!ord) {
        setIsVerifying(false);
        setErrorMessage('Nomor pesanan tidak ditemukan pada parameter redirect.');
        return;
      }

      setIsVerifying(true);
      try {
        // Strict Security Rule (Section 14): Server-side verification
        const verifyRes = await verifyPayment(ord);
        const orderData = await getOrderByNumber(ord, null, null, false);
        setOrder(orderData);

        if (verifyRes.status === 'paid' || orderData?.payment_status === 'paid') {
          setStatus('paid');
        } else if (verifyRes.status === 'expired') {
          setStatus('expired');
        } else if (verifyRes.status === 'failed') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      } catch (e: any) {
        console.error('Payment verification failed:', e);
        // Fallback fetch order state
        try {
          const ordFallback = await getOrderByNumber(ord, null, null, false);
          setOrder(ordFallback);
          if (ordFallback?.payment_status === 'paid') {
            setStatus('paid');
          } else {
            setStatus('pending');
          }
        } catch {}
      } finally {
        setIsVerifying(false);
      }
    }

    checkFinalStatus();
  }, []);

  const handleManualRecheck = async () => {
    if (!orderNumber) return;
    setIsVerifying(true);
    try {
      const res = await verifyPayment(orderNumber);
      const o = await getOrderByNumber(orderNumber, null, null, false);
      setOrder(o);
      if (res.status === 'paid' || o?.payment_status === 'paid') {
        setStatus('paid');
      }
    } catch (e) {
      console.warn('Recheck error:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return <LoadingState message="Memverifikasi status pembayaran dengan gateway..." fullHeight />;
  }

  if (errorMessage && !orderNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Parameter Tidak Valid</h1>
        <p className="text-xs text-stone-600">{errorMessage}</p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        {/* Status Icon */}
        {status === 'paid' && (
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        )}

        {status === 'pending' && (
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-9 h-9" />
          </div>
        )}

        {(status === 'expired' || status === 'failed') && (
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-9 h-9" />
          </div>
        )}

        {/* Heading */}
        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm ${
              status === 'paid'
                ? 'text-emerald-800 bg-emerald-100/80'
                : status === 'pending'
                ? 'text-amber-800 bg-amber-100/80'
                : 'text-red-800 bg-red-100/80'
            }`}
          >
            {status === 'paid'
              ? 'Pembayaran Berhasil'
              : status === 'pending'
              ? 'Menunggu Pembayaran'
              : 'Pembayaran Belum Berhasil'}
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
            {status === 'paid'
              ? 'Terima Kasih! Pembayaran Telah Diterima'
              : status === 'pending'
              ? 'Pembayaran Sedang Dalam Proses'
              : 'Transaksi Pembayaran Kedaluwarsa'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {status === 'paid'
              ? 'Pesanan Anda telah otomatis beralih ke status diproses dan siap disiapkan oleh tim gudang.'
              : status === 'pending'
              ? 'Silakan selesaikan pembayaran Anda sesuai instruksi pada Virtual Account atau QRIS.'
              : 'Waktu pembayaran telah habis atau transaksi dibatalkan. Anda dapat mengulang pembayaran.'}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">Nomor Pesanan</span>
            <span className="font-mono font-bold text-stone-900">{orderNumber}</span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">Status Pembayaran Terverifikasi</span>
            <span
              className={`font-semibold capitalize ${
                status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {status === 'paid' ? 'Lunas (Paid)' : status}
            </span>
          </div>

          {order && (
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs font-bold text-stone-800">Total Nominal</span>
              <span className="text-lg font-bold text-stone-950 tabular-nums">
                {formatRupiah(order.grand_total)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {status === 'pending' && (
            <button
              type="button"
              onClick={handleManualRecheck}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Periksa Ulang Status</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate(`/orders/${orderNumber}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <span>Lihat Detail Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Lanjut Belanja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
