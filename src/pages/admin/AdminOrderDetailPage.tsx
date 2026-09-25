import React, { useState, useEffect } from 'react';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import { verifyPayment, manualAdminConfirmPayment } from '../../services/payment/paymentService';
import { OrderWithDetails, OrderStatus, PaymentRecord } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { ProductImageFallback } from '../../components/common/ProductImageFallback';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../components/common/Toast';
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  History,
  Send,
  Loader2,
  CreditCard,
  RotateCw,
  Code,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AdminOrderDetailPageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const AdminOrderDetailPage: React.FC<AdminOrderDetailPageProps> = ({
  orderId,
  onNavigate,
}) => {
  const { success, error, info } = useToast();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('pending_payment');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);

  // Manual payment modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualNote, setManualNote] = useState('Transfer diverifikasi via mutasi rekening BCA');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Raw JSON Inspector Modal
  const [selectedRawResponse, setSelectedRawResponse] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const data = await getOrderById(orderId);
      if (data) {
        setOrder(data);
        setTargetStatus(data.status);
      }
    } catch (e) {
      console.error('Failed loading admin order detail', e);
    }
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    }
    load();
  }, [orderId]);

  if (isLoading) {
    return <LoadingState message="Memuat detail pesanan & pembayaran..." fullHeight />;
  }

  if (!order) {
    return (
      <ErrorState
        title="Pesanan Tidak Ditemukan"
        message="Data pesanan yang diminta tidak ditemukan di sistem."
        onRetry={() => onNavigate('/admin/orders')}
      />
    );
  }

  // Allowed transitions
  const allowedTransitions: Record<OrderStatus, { value: OrderStatus; label: string }[]> = {
    pending_payment: [
      { value: 'processing', label: 'Proses Pesanan' },
      { value: 'cancelled', label: 'Batalkan Pesanan' },
    ],
    processing: [
      { value: 'shipped', label: 'Kirim Pesanan' },
      { value: 'cancelled', label: 'Batalkan Pesanan' },
    ],
    shipped: [
      { value: 'completed', label: 'Selesaikan Pesanan' },
      { value: 'cancelled', label: 'Batalkan Pesanan' },
    ],
    completed: [],
    cancelled: [],
  };

  const nextOptions = allowedTransitions[order.status] || [];

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === order.status) {
      error('Pilih status baru yang berbeda untuk memperbarui.');
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(
        order.id,
        targetStatus,
        'Admin Toko',
        statusNote.trim() || undefined
      );
      setOrder(updated);
      setStatusNote('');
      success(`Status pesanan berhasil diperbarui menjadi "${targetStatus}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.';
      error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Sync with payment gateway
  const handleSyncPaymentGateway = async () => {
    setIsSyncingPayment(true);
    try {
      const res = await verifyPayment(order.order_number);
      await loadData();
      if (res.status === 'paid') {
        success('Status pembayaran terverifikasi LUNAS dari gateway!');
      } else {
        info(`Hasil sinkronisasi gateway: ${res.status}`);
      }
    } catch (err: any) {
      error(err.message || 'Gagal sinkronisasi dengan gateway pembayaran.');
    } finally {
      setIsSyncingPayment(false);
    }
  };

  // Manual payment confirmation
  const handleConfirmManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const updated = await manualAdminConfirmPayment(
        order.id,
        'Admin Toko',
        manualNote.trim() || 'Verifikasi mutasi rekening manual'
      );
      setOrder(updated);
      setShowManualModal(false);
      success('Pesanan berhasil dikonfirmasi LUNAS secara manual!');
    } catch (err: any) {
      error(err.message || 'Gagal konfirmasi pembayaran manual.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('/admin/orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Pesanan</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-stone-900 font-mono">{order.order_number}</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-sm bg-stone-900 text-white">
              {order.status}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm ${
                order.payment_status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR'}
            </span>
          </div>

          <span className="text-xs text-stone-500">
            Dibuat: {formatDateTime(order.created_at)}
          </span>
        </div>
      </div>

      {/* Visual Timeline (Section 21: Order Created, Payment, Processing, Shipped, Delivered, Completed) */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 mb-4">
          Timeline Progres Pesanan
        </h3>
        <div className="flex items-center justify-between relative overflow-x-auto pb-2">
          {[
            { id: 'created', label: 'Order Created', done: true },
            {
              id: 'payment',
              label: 'Payment',
              done: order.payment_status === 'paid' || order.status !== 'pending_payment',
            },
            {
              id: 'processing',
              label: 'Processing',
              done: order.status === 'processing' || order.status === 'shipped' || order.status === 'completed',
            },
            {
              id: 'shipped',
              label: 'Shipped',
              done: order.status === 'shipped' || order.status === 'completed',
            },
            {
              id: 'delivered',
              label: 'Delivered',
              done: order.status === 'completed',
            },
            {
              id: 'completed',
              label: 'Completed',
              done: order.status === 'completed',
            },
          ].map((step, idx, arr) => (
            <div key={step.id} className="flex-1 flex flex-col items-center relative min-w-[90px]">
              {idx > 0 && (
                <div
                  className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-1 transition-colors ${
                    step.done ? 'bg-emerald-600' : 'bg-stone-200'
                  }`}
                />
              )}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step.done
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                }`}
              >
                {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-semibold mt-2 text-center whitespace-nowrap ${
                  step.done ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Order Items & Financials (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-stone-100 font-bold text-xs uppercase tracking-wider text-stone-900">
              Item Komoditas yang Dipesan ({order.items.length})
            </div>

            <div className="divide-y divide-stone-100">
              {order.items.map((it) => (
                <div key={it.id} className="p-4 flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 shrink-0">
                    <ProductImageFallback
                      src={it.product_image}
                      alt={it.product_name}
                      aspectRatio="square"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                      {it.product_sku}
                    </span>
                    <h4 className="text-xs font-semibold text-stone-900 truncate">
                      {it.product_name}
                    </h4>
                    <span className="text-[11px] text-stone-500 tabular-nums">
                      {it.quantity} pcs × {formatRupiah(it.unit_price)}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-stone-900 tabular-nums">
                    {formatRupiah(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-stone-50/60 border-t border-stone-100 space-y-2 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatRupiah(order.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ongkos Kirim ({order.shipping_method_name})</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatRupiah(order.shipping_cost)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Diskon</span>
                  <span className="tabular-nums">- {formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex items-baseline justify-between text-sm font-bold text-stone-900">
                <span>Grand Total Pesanan</span>
                <span className="text-base text-stone-950 tabular-nums">
                  {formatRupiah(order.grand_total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Attempts History (Tahap 4) */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-stone-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                  Riwayat Transaksi &amp; Pembayaran ({order.payments?.length || 0})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncingPayment}
                  onClick={handleSyncPaymentGateway}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${isSyncingPayment ? 'animate-spin' : ''}`} />
                  <span>Sinkron Gateway</span>
                </button>

                {order.payment_status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => setShowManualModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Konfirmasi Manual</span>
                  </button>
                )}
              </div>
            </div>

            {order.payments && order.payments.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {order.payments.map((p, idx) => (
                  <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 capitalize">
                          {p.payment_method || p.provider}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'expired'
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        ID Tx: {p.provider_transaction_id || p.id}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Dibuat: {formatDateTime(p.created_at)}
                        {p.paid_at && ` • Lunas: ${formatDateTime(p.paid_at)}`}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-bold text-stone-900 tabular-nums block">
                        {formatRupiah(p.amount || order.grand_total)}
                      </span>
                      {p.raw_response && (
                        <button
                          type="button"
                          onClick={() => setSelectedRawResponse(p.raw_response)}
                          className="inline-flex items-center gap-1 text-[10px] text-stone-500 hover:text-stone-900 underline"
                        >
                          <Code className="w-3 h-3" />
                          <span>Lihat Raw JSON</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-stone-50 rounded-lg text-center text-xs text-stone-500">
                Belum ada transaksi pembayaran yang tercatat untuk pesanan ini.
              </div>
            )}
          </div>

          {/* Status Audit History Trail */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              <History className="w-4 h-4 text-stone-600" />
              <span>Riwayat Perubahan Status (Audit Trail)</span>
            </div>

            {order.history && order.history.length > 0 ? (
              <div className="space-y-3 pt-1">
                {order.history.map((h) => (
                  <div key={h.id} className="text-xs border-l-2 border-stone-300 pl-3 py-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">
                        {h.old_status ? `${h.old_status} → ` : ''}
                        {h.new_status}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        oleh {h.changed_by} ({formatDateTime(h.created_at)})
                      </span>
                    </div>
                    {h.note && <p className="text-[11px] text-stone-500 italic">"{h.note}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400">Belum ada catatan riwayat status.</p>
            )}
          </div>
        </div>

        {/* Right Side: Customer Details & Status Control (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Update Control */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              Kelola Progres Status Pesanan
            </h3>

            {nextOptions.length > 0 ? (
              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ubah Status Ke:
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
                  >
                    <option value={order.status}>Status Sekarang ({order.status})</option>
                    {nextOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Catatan Perubahan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Contoh: Paket telah diserahkan ke kurir JNE/Kargo"
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating || targetStatus === order.status}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Terapkan Status Baru</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-600">
                Pesanan ini sudah berstatus terminal (<strong>{order.status}</strong>) dan tidak dapat diubah lagi.
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              <User className="w-4 h-4 text-stone-600" />
              <span>Informasi Pelanggan</span>
            </div>

            <div>
              <span className="font-semibold text-stone-900 text-sm block">
                {order.customer_name}
              </span>
              <span className="font-mono text-stone-600 block mt-0.5">
                {order.customer_phone}
              </span>
              {order.customer_email && (
                <span className="text-stone-400 block mt-0.5">{order.customer_email}</span>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              <MapPin className="w-4 h-4 text-stone-600" />
              <span>Alamat Tujuan Pengiriman</span>
            </div>

            <div className="text-stone-700 leading-relaxed space-y-1">
              <p>{order.shipping_address}</p>
              <p>
                Kec. {order.shipping_district}, {order.shipping_city}, {order.shipping_province}{' '}
                {order.shipping_postal_code}
              </p>
            </div>

            {order.delivery_note && (
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600">
                <span className="font-semibold text-stone-700 block">Catatan pengiriman:</span>
                "{order.delivery_note}"
              </div>
            )}
          </div>

          {/* Shipping Method Details */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2.5">
              <Truck className="w-4 h-4 text-stone-600" />
              <span>Metode Pengiriman</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900 block">{order.shipping_method_name}</span>
                <span className="text-[11px] text-stone-400">
                  {order.shipping_method?.estimated_days || 'Estimasi 2-4 hari'}
                </span>
              </div>
              <span className="font-semibold text-stone-900 tabular-nums">
                {formatRupiah(order.shipping_cost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Payment Confirmation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Konfirmasi Pembayaran Manual</span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Tindakan ini akan menandai pesanan <strong>{order.order_number}</strong> sebagai{' '}
              <strong>LUNAS (PAID)</strong> dan secara otomatis mengubah status ke <strong>Diproses</strong>.
            </p>

            <form onSubmit={handleConfirmManualPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan Audit Admin:
                </label>
                <textarea
                  rows={3}
                  required
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Masukkan bukti verifikasi (misal: Bukti transfer BCA atas nama Andi tgl 25/09)"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5"
                >
                  {isSubmittingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Konfirmasi Lunas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raw JSON Inspector Modal */}
      {selectedRawResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-900">
                Raw Provider Gateway Response
              </span>
              <button
                type="button"
                onClick={() => setSelectedRawResponse(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl text-[11px] font-mono overflow-auto max-h-80">
              {JSON.stringify(selectedRawResponse, null, 2)}
            </pre>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedRawResponse(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
