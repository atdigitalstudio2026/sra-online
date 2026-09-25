import React, { useEffect, useState } from 'react';
import { recoverCartByToken } from '../services/abandonedCartService';
import { addCartItem } from '../services/cartService';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { LoadingState } from '../components/common/LoadingState';
import { ShoppingCart, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface CartRecoveryPageProps {
  token: string;
  onNavigate: (path: string) => void;
}

export const CartRecoveryPage: React.FC<CartRecoveryPageProps> = ({ token, onNavigate }) => {
  const { refreshCart } = useCart();
  const { success, error } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function processRecovery() {
      try {
        const result = await recoverCartByToken(token);
        if (result.success) {
          if (result.items && result.items.length > 0) {
            for (const item of result.items) {
              try {
                await addCartItem(item.product_id, item.quantity);
              } catch {}
            }
          }
          await refreshCart();
          setStatus('success');
          success(result.message);
        } else {
          setStatus('error');
          setErrorMessage(result.message);
          error(result.message);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Gagal memulihkan keranjang belanja.');
      }
    }

    if (token) {
      processRecovery();
    } else {
      setStatus('error');
      setErrorMessage('Token pemulihan tidak ditemukan.');
    }
  }, [token, refreshCart, success, error]);

  if (status === 'verifying') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <LoadingState message="Memvalidasi token & memulihkan keranjang belanja Anda..." />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-800 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900">
          Tautan Pemulihan Tidak Valid
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          {errorMessage || 'Tautan pemulihan keranjang Anda sudah kedaluwarsa atau tidak terdaftar.'}
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800"
          >
            Mulai Belanja Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5 animate-in zoom-in-95 duration-200">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-xs">
        <CheckCircle className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Keranjang Berhasil Dipulihkan!
        </h2>
        <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
          Semua produk komoditas pangan yang sebelumnya Anda pilih telah dimasukkan kembali ke keranjang belanja Anda.
        </p>
      </div>
      <div className="pt-3">
        <button
          type="button"
          onClick={() => onNavigate('/cart')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Lihat Keranjang & Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
