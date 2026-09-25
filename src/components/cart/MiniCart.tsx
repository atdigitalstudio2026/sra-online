import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatRupiah, formatWeight } from '../../utils/formatters';
import { ProductImageFallback } from '../common/ProductImageFallback';
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';

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
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={closeMiniCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-700" />
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Keranjang Belanja
              </h2>
              <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full tabular-nums">
                {totalCount} item
              </span>
            </div>

            <button
              type="button"
              onClick={closeMiniCart}
              aria-label="Tutup keranjang"
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] mx-auto mb-3 opacity-60" />
                <p className="text-sm font-medium text-stone-600">Keranjang masih kosong</p>
                <p className="text-xs text-stone-400 mt-1">
                  Pilih produk dari katalog untuk mulai belanja.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeMiniCart();
                    onNavigate('/products');
                  }}
                  className="mt-5 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Jelajahi Produk
                </button>
              </div>
            ) : (
              items.map((item) => {
                const effectivePrice = item.product?.is_active
                  ? item.product.price
                  : item.unit_price;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 pb-4 border-b border-stone-100 last:border-0"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-50">
                      <ProductImageFallback
                        src={
                          item.product.primary_image ||
                          item.product.images?.[0]?.image_url
                        }
                        alt={item.product.name}
                        aspectRatio="square"
                        categorySlug={item.product.category?.slug}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => {
                          closeMiniCart();
                          onNavigate(`/products/${item.product.slug}`);
                        }}
                        className="text-xs font-semibold text-stone-900 line-clamp-1 hover:text-amber-950 cursor-pointer"
                      >
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
                        {formatRupiah(effectivePrice)} / {item.product.unit}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center border border-stone-200 rounded-md bg-stone-50 text-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="px-2 py-0.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-2 font-semibold tabular-nums text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                            disabled={item.quantity >= (item.product?.stock || 0)}
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-bold text-stone-900 tabular-nums">
                          {formatRupiah(effectivePrice * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Hapus item"
                          className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Subtotal & Action Buttons */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 font-medium">Subtotal</span>
                <span className="text-base font-bold text-stone-950 tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="w-full py-2.5 px-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-lg transition-colors text-center"
                >
                  Lihat Keranjang
                </button>
                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors text-center inline-flex items-center justify-center gap-1.5"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-stone-400 text-center leading-tight">
                Pajak & ongkos kirim akan dihitung pada tahap checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
