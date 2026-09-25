import React, { useState } from 'react';
import { ProductWithDetails } from '../../types';
import { subscribePriceDrop } from '../../services/alertService';
import { formatRupiah } from '../../utils/formatters';
import { useToast } from '../common/Toast';
import { TrendingDown, X, Check, Loader2 } from 'lucide-react';

interface PriceDropModalProps {
  product: ProductWithDetails;
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export const PriceDropModal: React.FC<PriceDropModalProps> = ({
  product,
  isOpen,
  onClose,
  userId,
}) => {
  const { success, error } = useToast();
  const defaultTarget = Math.round(product.price * 0.9); // 10% lower
  const [targetPrice, setTargetPrice] = useState<number | string>(defaultTarget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = Number(targetPrice);

    if (!numPrice || numPrice <= 0) {
      error('Mohon masukkan target harga yang valid.');
      return;
    }

    if (numPrice >= product.price) {
      error(`Target harga harus lebih rendah dari harga produk saat ini (${formatRupiah(product.price)}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await subscribePriceDrop({
        productId: product.id,
        targetPrice: numPrice,
        userId: userId || 'usr-guest-customer',
      });

      setIsSubscribed(true);
      success('Pengingat penurunan harga berhasil diaktifkan!');
    } catch (err: any) {
      error(err.message || 'Gagal mendaftarkan pengingat harga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Ingatkan Saat Harga Turun</h3>
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
            <h4 className="text-sm font-bold text-stone-900">Pengingat Harga Aktif!</h4>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
              Kami akan mengirimkan notifikasi ke akun Anda jika harga komoditas ini turun mencapai atau di bawah {formatRupiah(Number(targetPrice))}.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-600">Harga Sekarang:</span>
              <span className="font-bold text-stone-900">{formatRupiah(product.price)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Target Harga yang Diinginkan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                max={product.price - 1}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Contoh: 120000"
                className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Harus lebih rendah dari {formatRupiah(product.price)}.
              </p>
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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Pasang Pengingat</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
