import React, { useState, useEffect } from 'react';
import {
  getAllPaymentMethodsAdmin,
  updatePaymentMethod,
} from '../../services/payment/paymentService';
import { PaymentMethodConfig } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../components/common/Toast';
import {
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Plus,
  Loader2,
} from 'lucide-react';

interface AdminPaymentMethodsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPaymentMethodsPage: React.FC<AdminPaymentMethodsPageProps> = ({
  onNavigate,
}) => {
  const { success, error } = useToast();
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const loadMethods = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPaymentMethodsAdmin();
      setMethods(data);
    } catch (e) {
      console.error('Failed loading payment methods:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleToggle = async (method: PaymentMethodConfig) => {
    setIsToggling(method.id);
    try {
      const updated = await updatePaymentMethod(method.id, {
        is_active: !method.is_active,
      });
      setMethods((prev) => prev.map((m) => (m.id === method.id ? updated : m)));
      success(
        `Metode "${method.name}" berhasil ${
          updated.is_active ? 'diaktifkan' : 'dinonaktifkan'
        }.`
      );
    } catch (err: any) {
      error(err.message || 'Gagal mengubah status metode pembayaran.');
    } finally {
      setIsToggling(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Konfigurasi Metode Pembayaran Toko
          </h2>
          <p className="text-xs text-stone-500">
            Kelola ketersediaan opsi gateway (Virtual Account, QRIS, Kartu Kredit, Transfer Bank) pada halaman checkout.
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center">
            <LoadingState message="Memuat metode pembayaran..." />
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {methods.map((m) => (
              <div
                key={m.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    {m.code.includes('qris') ? (
                      <QrCode className="w-5 h-5" />
                    ) : m.code.includes('card') ? (
                      <CreditCard className="w-5 h-5" />
                    ) : m.code.includes('manual') ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-stone-900">{m.name}</h3>
                      <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        {m.code}
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                        {m.provider}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-xs text-stone-500 max-w-xl">{m.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                      m.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {m.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>

                  <button
                    type="button"
                    disabled={isToggling === m.id}
                    onClick={() => handleToggle(m)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      m.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                    }`}
                    title={m.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                  >
                    {isToggling === m.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : m.is_active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-stone-400" />
                    )}
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
