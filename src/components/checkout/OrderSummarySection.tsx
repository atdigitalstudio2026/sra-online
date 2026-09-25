import React from 'react';
import { CartItemWithProduct, ShippingMethod } from '../../types';
import { formatRupiah, formatWeight } from '../../utils/formatters';
import { ProductImageFallback } from '../common/ProductImageFallback';
import { ShieldCheck, ArrowRight, Loader2, Lock } from 'lucide-react';

interface OrderSummarySectionProps {
  items: CartItemWithProduct[];
  totalCount: number;
  subtotal: number;
  selectedShippingMethod?: ShippingMethod | null;
  onConfirmOrder: () => void;
  onBackToCart: () => void;
  isSubmitting?: boolean;
  hasErrors?: boolean;
}

export const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  items,
  totalCount,
  subtotal,
  selectedShippingMethod,
  onConfirmOrder,
  onBackToCart,
  isSubmitting = false,
  hasErrors = false,
}) => {
  const shippingCost = selectedShippingMethod ? selectedShippingMethod.price : 0;
  const discount = 0;
  const grandTotal = subtotal + shippingCost - discount;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
          Ringkasan Pesanan
        </h2>
        <span className="text-xs text-stone-500 tabular-nums font-medium">
          {totalCount} total pcs
        </span>
      </div>

      {/* Cart Items List */}
      <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => {
          const effectivePrice = item.product?.is_active
            ? item.product.price
            : item.unit_price;
          return (
            <div key={item.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 shrink-0">
                <ProductImageFallback
                  src={item.product.primary_image || item.product.images?.[0]?.image_url}
                  alt={item.product.name}
                  aspectRatio="square"
                  categorySlug={item.product.category?.slug}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-stone-900 truncate">
                  {item.product.name}
                </h4>
                <div className="text-[11px] text-stone-500 tabular-nums">
                  {item.quantity} × {formatRupiah(effectivePrice)}
                </div>
              </div>

              <span className="text-xs font-bold text-stone-900 tabular-nums shrink-0">
                {formatRupiah(effectivePrice * item.quantity)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Financial Calculations */}
      <div className="pt-3 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
        <div className="flex items-center justify-between">
          <span>Subtotal Produk</span>
          <span className="font-semibold text-stone-800 tabular-nums">
            {formatRupiah(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Ongkos Kirim ({selectedShippingMethod?.name || 'Pilih Kurir'})</span>
          <span className="font-semibold text-stone-800 tabular-nums">
            {selectedShippingMethod ? formatRupiah(shippingCost) : '-'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Diskon</span>
          <span className="text-stone-400 tabular-nums">Rp 0</span>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between text-stone-900">
          <div>
            <span className="text-sm font-bold block">Total Pembayaran</span>
            <span className="text-[10px] text-stone-400 font-normal">Sudah termasuk PPN</span>
          </div>
          <span className="text-xl font-bold text-stone-950 tabular-nums">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </div>

      {/* Action Buttons (Section 21: Prevent double click) */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onConfirmOrder}
          disabled={isSubmitting || hasErrors}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:translate-y-[-1px] active:scale-95"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses pesanan...</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Konfirmasi Pesanan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToCart}
          disabled={isSubmitting}
          className="w-full py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors text-center"
        >
          Kembali ke Keranjang
        </button>
      </div>

      <div className="pt-2 text-center text-[10px] text-stone-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Data transaksi tersimpan aman dan terenkripsi.</span>
      </div>
    </div>
  );
};
