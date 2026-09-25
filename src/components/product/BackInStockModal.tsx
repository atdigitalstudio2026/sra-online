import React, { useState } from 'react';
import { ProductWithDetails } from '../../types';
import { subscribeBackInStock } from '../../services/alertService';
import { useToast } from '../common/Toast';
import { Bell, X, Check, Mail, Phone, Loader2 } from 'lucide-react';

interface BackInStockModalProps {
  product: ProductWithDetails;
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  defaultEmail?: string | null;
}

export const BackInStockModal: React.FC<BackInStockModalProps> = ({
  product,
  isOpen,
  onClose,
  userId,
  defaultEmail,
}) => {
  const { success, error } = useToast();
  const [email, setEmail] = useState(defaultEmail || '');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      error('Mohon masukkan alamat email yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await subscribeBackInStock({
        productId: product.id,
        email,
        phone,
        userId: userId || null,
      });

      setIsSubscribed(true);
      success('Pengingat stok berhasil didaftarkan! Kami akan memberi tahu Anda begitu produk tersedia kembali.');
    } catch (err: any) {
      error(err.message || 'Gagal mendaftarkan pengingat stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-900">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Ingatkan Saat Stok Tersedia</h3>
              <p className="text-[11px] text-stone-500">{product.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubscribed ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Pengingat Berhasil Didaftarkan!</h4>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
              Kami akan mengirimkan notifikasi via email/WhatsApp segera setelah batch stok komoditas ini tiba di gudang.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              Stok produk ini sedang habis sementara. Daftarkan kontak Anda untuk mendapatkan pemberitahuan instan saat barang siap dipesan kembali:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alamat Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nomor WhatsApp (Opsional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <span>Beritahu Saya</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
