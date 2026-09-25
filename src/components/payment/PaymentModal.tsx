import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { verifyPayment, simulateWebhook } from '../../services/payment/paymentService';
import { useToast } from '../common/Toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderId: string;
  grandTotal: number;
  paymentToken?: string;
  paymentUrl?: string;
  paymentMethodCode?: string;
  expiresAt?: string;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  grandTotal,
  paymentToken,
  paymentUrl,
  paymentMethodCode = 'bank_transfer',
  expiresAt,
  onPaymentSuccess,
}) => {
  const { success, error, info } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(paymentMethodCode);

  // Default virtual account numbers for simulation
  const vaNumbers: Record<string, { bank: string; va: string }> = {
    bca: { bank: 'BCA Virtual Account', va: `827708${orderNumber.replace(/[^0-9]/g, '').slice(-8) || '91823746'}` },
    mandiri: { bank: 'Mandiri Bill Payment', va: `89308${orderNumber.replace(/[^0-9]/g, '').slice(-8) || '54637281'}` },
    bni: { bank: 'BNI Virtual Account', va: `988808${orderNumber.replace(/[^0-9]/g, '').slice(-8) || '73625140'}` },
    bri: { bank: 'BRI BRIVA', va: `12808${orderNumber.replace(/[^0-9]/g, '').slice(-8) || '82910394'}` },
  };

  const [activeBank, setActiveBank] = useState<string>('bca');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    success(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopied(null), 3000);
  };

  // Check payment status with server / provider
  const handleCheckStatus = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyPayment(orderNumber);
      if (res.status === 'paid') {
        success('Pembayaran terverifikasi LUNAS! Memperbarui pesanan...');
        onPaymentSuccess();
        onClose();
      } else {
        info('Pembayaran belum diterima. Silakan selesaikan pembayaran terlebih dahulu.');
      }
    } catch (err: any) {
      error(err.message || 'Gagal memeriksa status pembayaran.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Sandbox simulation action
  const handleSimulateStatus = async (status: 'settlement' | 'pending' | 'expire' | 'cancel') => {
    setIsSimulating(true);
    try {
      const res = await simulateWebhook(orderNumber, status);
      if (status === 'settlement') {
        success('Simulasi pembayaran BERHASIL (Settlement)! Pesanan otomatis berstatus LUNAS.');
        onPaymentSuccess();
        setTimeout(() => onClose(), 1200);
      } else if (status === 'expire') {
        info('Simulasi status: Pembayaran kedaluwarsa (Expired).');
        onPaymentSuccess();
      } else {
        info(`Simulasi status: ${status}.`);
      }
    } catch (err: any) {
      error(err.message || 'Gagal menjalankan simulasi.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Instruksi Pembayaran
              </div>
              <h2 className="text-base font-bold font-mono tracking-tight">{orderNumber}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Amount Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 p-4 px-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-900 font-medium">Total Tagihan Pembayaran</span>
            <div className="text-xl font-bold text-stone-900 tabular-nums">
              {formatRupiah(grandTotal)}
            </div>
          </div>
          {expiresAt && (
            <div className="text-right">
              <span className="text-[11px] text-amber-800 flex items-center gap-1 font-medium justify-end">
                <Clock className="w-3.5 h-3.5" />
                Batas Waktu
              </span>
              <span className="text-xs font-semibold text-stone-800">
                {formatDateTime(expiresAt)}
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Payment Method Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedMethod('bank_transfer')}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedMethod === 'bank_transfer'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Virtual Account</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('qris')}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedMethod === 'qris'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QRIS</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('manual_transfer')}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedMethod === 'manual_transfer'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transfer BCA</span>
            </button>
          </div>

          {/* Virtual Account Panel */}
          {selectedMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-600">
                Pilih bank penerbit Virtual Account untuk instruksi transfer otomatis:
              </div>

              {/* Bank selector pills */}
              <div className="grid grid-cols-4 gap-2">
                {(['bca', 'mandiri', 'bni', 'bri'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setActiveBank(b)}
                    className={`py-2 px-3 text-xs font-bold uppercase rounded-lg border text-center transition-all ${
                      activeBank === b
                        ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-xs'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Selected VA details card */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-stone-700">
                  {vaNumbers[activeBank].bank}
                </div>
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200 font-mono text-base font-bold text-stone-900">
                  <span>{vaNumbers[activeBank].va}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(vaNumbers[activeBank].va, 'Nomor VA')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                  >
                    {copied === 'Nomor VA' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <ul className="text-[11px] text-stone-500 list-disc list-inside space-y-1">
                  <li>Buka aplikasi m-Banking atau ATM bank pilihan Anda.</li>
                  <li>Pilih menu <strong>Transfer &gt; Virtual Account</strong>.</li>
                  <li>Masukkan nomor Virtual Account di atas dan pastikan nominal tepat <strong>{formatRupiah(grandTotal)}</strong>.</li>
                  <li>Transaksi akan otomatis terverifikasi dalam 1-2 menit.</li>
                </ul>
              </div>
            </div>
          )}

          {/* QRIS Panel */}
          {selectedMethod === 'qris' && (
            <div className="space-y-4 text-center">
              <div className="text-xs text-stone-600">
                Pindai kode QRIS menggunakan GoPay, ShopeePay, Dana, OVO, BCA Mobile, atau aplikasi QRIS apa pun:
              </div>

              <div className="inline-block p-4 bg-white border-2 border-stone-900 rounded-2xl shadow-sm mx-auto">
                {/* SVG mock QRIS code */}
                <div className="w-48 h-48 bg-stone-900 rounded-lg p-2.5 flex flex-col justify-between items-center text-white">
                  <div className="w-full flex justify-between items-center px-1">
                    <div className="w-10 h-10 border-4 border-white bg-stone-900" />
                    <div className="text-[10px] font-bold tracking-widest font-mono">QRIS</div>
                    <div className="w-10 h-10 border-4 border-white bg-stone-900" />
                  </div>
                  <div className="font-mono text-[9px] text-stone-300 font-semibold tracking-wider">
                    {orderNumber}
                  </div>
                  <div className="w-full flex justify-between items-center px-1">
                    <div className="w-10 h-10 border-4 border-white bg-stone-900" />
                    <div className="text-[10px] font-bold font-sans text-amber-400">NMI</div>
                    <div className="w-10 h-10 border-4 border-white bg-stone-900" />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-stone-500">
                Kode QR berlaku selama 15 menit. Verifikasi terjadi secara instan setelah pembayaran terkonfirmasi di aplikasi e-wallet Anda.
              </div>
            </div>
          )}

          {/* Manual Transfer Panel */}
          {selectedMethod === 'manual_transfer' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-stone-700">
                  Rekening Operasional Toko (BCA)
                </div>
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200">
                  <div>
                    <div className="text-[10px] text-stone-400 font-medium">Nomor Rekening BCA</div>
                    <div className="font-mono text-base font-bold text-stone-900">8273-0918-22</div>
                    <div className="text-xs text-stone-600 font-medium">a.n. PT FMCG AGRO NUSANTARA</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('8273091822', 'Nomor Rekening')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                  >
                    {copied === 'Nomor Rekening' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-stone-500">
                  Sertakan nomor pesanan <strong>{orderNumber}</strong> pada berita transfer. Tim admin akan memverifikasi dalam waktu kerja 15-30 menit.
                </div>
              </div>
            </div>
          )}

          {/* Sandbox Testing Bar (Section 22 Simulator) */}
          <div className="p-3.5 bg-stone-900 text-stone-300 rounded-xl space-y-2 border border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Simulator Sandbox Gateway
              </span>
              <span className="text-[10px] text-stone-400">Uji Alur Tanpa Akun Bank Asli</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleSimulateStatus('settlement')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Bayar Sukses</span>
              </button>
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleSimulateStatus('pending')}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Clock className="w-3 h-3" />
                <span>Set Pending</span>
              </button>
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleSimulateStatus('expire')}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Set Expired</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl hover:bg-white transition-colors"
          >
            Tutup &amp; Bayar Nanti
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={handleCheckStatus}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Memeriksa Gateway...' : 'Saya Sudah Bayar (Cek Status)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
