import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatRupiah, formatWeight } from '../../utils/formatters';
import { ProductImageFallback } from '../common/ProductImageFallback';
import { X, ShoppingBag, ArrowRight, Trash2, Truck, Plus, Minus, CheckCircle } from 'lucide-react';

interface MiniCartProps {
  onNavigate: (path: string) => void;
}

export const MiniCart: React.FC<MiniCartProps> = ({ onNavigate }) => {
  const {
    items,
    totalCount,
    subtotal,
    isMiniCartOpen,
    closeMiniCart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  if (!isMiniCartOpen) return null;

  // Free shipping threshold (e.g., Rp 250.000)
  const FREE_SHIPPING_THRESHOLD = 250000;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleGoToCart = () => {
    closeMiniCart();
    onNavigate('/cart');
  };

  const handleGoToCheckout = () => {
    closeMiniCart();
    onNavigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeMiniCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  Keranjang Belanja
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  {totalCount} item dalam keranjang
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeMiniCart}
              aria-label="Tutup keranjang"
              className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="p-3.5 bg-emerald-50/70 border-b border-emerald-100 px-5">
            <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
              <Truck className={`w-4 h-4 ${isFreeShipping ? 'text-emerald-700' : 'text-emerald-800'}`} />
              {isFreeShipping ? (
                <span className="text-emerald-900 flex items-center gap-1">
                  <span>Selamat! Pesanan Anda berhak atas</span>
                  <strong className="text-emerald-800 font-bold">Gratis Ongkir</strong>
                </span>
              ) : (
                <span className="text-stone-700">
                  Belanja <strong className="text-emerald-900 font-bold">{formatRupiah(amountToFreeShipping)}</strong> lagi untuk Gratis Ongkir!
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-800 rounded-full transition-all duration-400 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-20 text-center text-stone-400">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-stone-400 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  Keranjang Anda masih kosong
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Pilih komoditas pilihan dari katalog dan nikmati harga grosir terbaik.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeMiniCart();
                    onNavigate('/products');
                  }}
                  className="mt-6 px-5 py-2.5 bg-emerald-950 text-white text-xs font-semibold rounded-xl hover:bg-emerald-900 transition-colors shadow-sm"
                >
                  Mulai Belanja Sekarang
                </button>
              </div>
            ) : (
              items.map((item) => {
                const effectivePrice = item.product?.is_active
                  ? item.product.price
                  : item.unit_price;
                const maxStock = item.product?.stock ?? 999;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3.5 pb-4 border-b border-stone-100 last:border-0 group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-[#FAF9F6] p-1 flex items-center justify-center">
                      <ProductImageFallback
                        src={
                          item.product.primary_image ||
                          item.product.images?.[0]?.image_url
                        }
                        alt={item.product.name}
                        aspectRatio="square"
                        categorySlug={item.product.category?.slug}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {formatWeight(item.product.weight, item.product.unit)}
                      </p>

                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xs sm:text-sm font-bold text-emerald-950 tabular-nums">
                          {formatRupiah(effectivePrice * item.quantity)}
                        </span>

                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-stone-800 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.min(maxStock, item.quantity + 1))}
                            disabled={item.quantity >= maxStock}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Item Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Hapus produk"
                      className="p-1 text-stone-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/70 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600 font-medium">Subtotal Belanja</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-950 tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Ongkos kirim dan diskon voucher akan dihitung saat proses checkout.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="w-full py-2.5 px-3 border border-emerald-900 text-emerald-950 font-semibold text-xs rounded-xl hover:bg-emerald-50 transition-colors text-center"
                >
                  Lihat Keranjang
                </button>
                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-2.5 px-3 bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
