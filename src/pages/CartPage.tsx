import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { CartItemCard } from '../components/cart/CartItemCard';
import { EmptyCart } from '../components/cart/EmptyCart';
import { QuantitySelector } from '../components/cart/QuantitySelector';
import { ProductImageFallback } from '../components/common/ProductImageFallback';
import { formatRupiah, formatWeight } from '../utils/formatters';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface CartPageProps {
  onNavigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    items,
    totalCount,
    subtotal,
    isLoading,
    isSyncing,
    updateQuantity,
    removeFromCart,
    clearCart,
    adjustToStock,
    confirmPriceChange,
  } = useCart();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // SEO noindex requirement (#32)
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    const previousContent = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      if (meta) {
        if (created) {
          meta.remove();
        } else {
          meta.content = previousContent;
        }
      }
    };
  }, []);

  // Check if any items have notices/warnings
  const hasInactiveItems = items.some((i) => i.isUnavailable);
  const hasStockWarnings = items.some((i) => i.hasStockChanged);
  const hasPriceChanges = items.some((i) => i.hasPriceChanged);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-6">
        <div className="h-8 bg-stone-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 bg-white border border-stone-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="lg:col-span-4 h-64 bg-white border border-stone-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <EmptyCart onStartShopping={() => onNavigate('/products')} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb & Page Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lanjutkan Belanja</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Keranjang Belanja
            </h1>
            <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full tabular-nums">
              {totalCount} total pcs
            </span>
          </div>
        </div>

        {/* Clear Cart Trigger */}
        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Kosongkan Keranjang</span>
        </button>
      </div>

      {/* Global Warnings Bar if any */}
      {(hasInactiveItems || hasStockWarnings || hasPriceChanges) && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block mb-0.5">
              Pembaruan Inventaris & Harga Terdeteksi
            </span>
            Beberapa produk di keranjang Anda mengalami perubahan ketersediaan stok atau harga terkini. Silakan periksa tanda di bawah sebelum melanjutkan ke checkout.
          </div>
        </div>
      )}

      {/* 2-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Harga Satuan</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => {
                  const { product } = item;
                  const effectivePrice = product?.is_active ? product.price : item.unit_price;
                  const itemSubtotal = effectivePrice * item.quantity;
                  const maxStock = product?.stock ?? 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-stone-50/50 transition-colors ${
                        item.isUnavailable
                          ? 'bg-rose-50/20'
                          : item.hasStockChanged || item.hasPriceChanged
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            onClick={() => onNavigate(`/products/${product.slug}`)}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-50 cursor-pointer"
                          >
                            <ProductImageFallback
                              src={product.primary_image || product.images?.[0]?.image_url}
                              alt={product.name}
                              aspectRatio="square"
                              categorySlug={product.category?.slug}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                              {product.sku}
                            </span>
                            <span
                              onClick={() => onNavigate(`/products/${product.slug}`)}
                              className="font-semibold text-stone-900 hover:text-amber-950 transition-colors cursor-pointer block line-clamp-1 max-w-xs"
                            >
                              {product.name}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {formatWeight(product.weight, product.unit)}
                            </span>

                            {/* Row warnings */}
                            {item.isUnavailable && (
                              <div className="mt-1 text-[11px] text-rose-600 font-semibold">
                                * Produk tidak lagi tersedia
                              </div>
                            )}
                            {item.hasStockChanged && (
                              <div className="mt-1 text-[11px] text-amber-700 flex items-center gap-1.5">
                                <span>Stok berubah (sisa {item.maxAvailableStock} pcs).</span>
                                <button
                                  type="button"
                                  onClick={() => adjustToStock(item.id, item.maxAvailableStock!)}
                                  className="underline font-bold hover:text-amber-900"
                                >
                                  Sesuaikan
                                </button>
                              </div>
                            )}
                            {item.hasPriceChanged && (
                              <div className="mt-1 text-[11px] text-stone-600 flex items-center gap-1.5">
                                <span>
                                  Harga baru: {formatRupiah(item.currentPrice)}.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => confirmPriceChange(item.id, item.currentPrice!)}
                                  className="underline font-bold text-stone-900"
                                >
                                  Terapkan
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Harga Satuan */}
                      <td className="py-4 px-4 font-medium text-stone-700 tabular-nums">
                        {formatRupiah(effectivePrice)}
                      </td>

                      {/* Quantity Selector */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex justify-center">
                          <QuantitySelector
                            quantity={item.quantity}
                            maxStock={maxStock}
                            onChange={(q) => updateQuantity(item.id, q)}
                            disabled={item.isUnavailable || maxStock <= 0}
                            size="sm"
                          />
                        </div>
                      </td>

                      {/* Subtotal Item */}
                      <td className="py-4 px-4 text-right font-bold text-stone-950 tabular-nums">
                        {formatRupiah(itemSubtotal)}
                      </td>

                      {/* Remove Button */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Hapus ${product.name}`}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={(q) => updateQuantity(item.id, q)}
                onRemove={() => removeFromCart(item.id)}
                onAdjustStock={(stock) => adjustToStock(item.id, stock)}
                onConfirmPriceChange={(price) => confirmPriceChange(item.id, price)}
                onSelectProduct={(slug) => onNavigate(`/products/${slug}`)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout CTA (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
              Ringkasan Belanja
            </h2>

            {/* Free Shipping Progress in Cart Page */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-950">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Gratis Ongkir (Min. Rp250.000)</span>
                </span>
                <span className="text-[11px] text-emerald-800">
                  {subtotal >= 250000 ? 'Tercapai!' : `${Math.round((subtotal / 250000) * 100)}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-800 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((subtotal / 250000) * 100))}%` }}
                />
              </div>
              {subtotal < 250000 && (
                <p className="text-[10px] text-stone-500">
                  Tambah <strong>{formatRupiah(250000 - subtotal)}</strong> lagi untuk klaim Bebas Ongkir.
                </p>
              )}
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>Total Kuantitas Komoditas</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {totalCount} pcs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimasi Biaya Muatan</span>
                <span className="text-emerald-800 font-medium">Dihitung saat checkout</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-stone-900">Subtotal Belanja</span>
              <span className="text-2xl font-extrabold text-emerald-950 tabular-nums">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {/* Checkout Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/checkout')}
                disabled={hasInactiveItems || isSyncing}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:translate-y-[-1px] active:scale-95"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/products')}
                className="w-full py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-semibold rounded-xl transition-colors text-center"
              >
                Lanjutkan Belanja Komoditas
              </button>
            </div>

            {/* Trust guarantees */}
            <div className="pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kualitas Komoditas Pangan Terjamin</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-500 shrink-0" />
                <span>Pengiriman ke Gudang & Bisnis Seluruh Indonesia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Kosongkan Keranjang?</h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Apakah Anda yakin ingin mengosongkan seluruh isi keranjang belanja Anda? Seluruh produk yang telah dipilih akan dihapus.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearCart();
                  setIsClearModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
