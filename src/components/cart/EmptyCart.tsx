import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface EmptyCartProps {
  onStartShopping: () => void;
}

export const EmptyCart: React.FC<EmptyCartProps> = ({ onStartShopping }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-5 border border-stone-200">
        <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
      </div>

      <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mb-2">
        Keranjang Anda masih kosong
      </h2>

      <p className="text-sm text-stone-500 leading-relaxed mb-6">
        Yuk, temukan aneka produk pangan komoditas pilihan berkualitas untuk kebutuhan bisnis maupun keluarga Anda.
      </p>

      <button
        type="button"
        onClick={onStartShopping}
        className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:translate-y-[-1px]"
      >
        <span>Mulai Belanja</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
