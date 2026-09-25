import React from 'react';
import { CartItemWithProduct } from '../../types';
import { formatRupiah, formatWeight } from '../../utils/formatters';
import { ProductImageFallback } from '../common/ProductImageFallback';
import { QuantitySelector } from './QuantitySelector';
import { Trash2, AlertTriangle, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface CartItemCardProps {
  item: CartItemWithProduct;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onAdjustStock?: (targetStock: number) => void;
  onConfirmPriceChange?: (newPrice: number) => void;
  onSelectProduct?: (slug: string) => void;
  layout?: 'table-row' | 'card';
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onAdjustStock,
  onConfirmPriceChange,
  onSelectProduct,
  layout = 'card',
}) => {
  const { product } = item;
  const effectivePrice = product?.is_active ? product.price : item.unit_price;
  const itemSubtotal = effectivePrice * item.quantity;
  const maxStock = product?.stock ?? 0;

  // 1. Mobile Card / Drawer Card View
  return (
    <div
      className={`p-4 bg-white border rounded-xl transition-all ${
        item.isUnavailable
          ? 'border-rose-300 bg-rose-50/20'
          : item.hasStockChanged || item.hasPriceChanged
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-stone-200/80 shadow-2xs'
      }`}
    >
      {/* Product Information & Thumbnail */}
      <div className="flex items-start gap-3.5">
        <div
          onClick={() => product?.slug && onSelectProduct && onSelectProduct(product.slug)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <ProductImageFallback
            src={product.primary_image || (product.images && product.images[0]?.image_url)}
            alt={product.name}
            aspectRatio="square"
            categorySlug={product.category?.slug}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                {product.sku}
              </div>
              <h4
                onClick={() => product?.slug && onSelectProduct && onSelectProduct(product.slug)}
                className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-amber-950 transition-colors line-clamp-2 cursor-pointer"
              >
                {product.name}
              </h4>
            </div>

            <button
              type="button"
              onClick={onRemove}
              aria-label={`Hapus ${product.name}`}
              className="p-1 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
              title="Hapus dari keranjang"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-stone-500 mt-1">
            <span className="font-semibold text-stone-800 tabular-nums">
              {formatRupiah(effectivePrice)}
            </span>
            <span className="text-[11px] text-stone-400 ml-1">
              / {formatWeight(product.weight, product.unit)}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings & Notices (Section 15, 25, 26) */}
      {item.isUnavailable && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Produk ini sudah tidak tersedia.</span>
            <span className="text-[11px] text-rose-600">
              Produk telah dinonaktifkan dari katalog. Silakan hapus item ini untuk melanjutkan.
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900"
          >
            Hapus
          </button>
        </div>
      )}

      {!item.isUnavailable && item.hasStockChanged && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Stok produk berubah.</span>
            <span className="text-[11px] text-amber-800">
              Maksimal stok tersedia saat ini: {item.maxAvailableStock} {product.unit}.
            </span>
          </div>
          {onAdjustStock && item.maxAvailableStock !== undefined && (
            <button
              type="button"
              onClick={() => onAdjustStock(item.maxAvailableStock!)}
              className="px-2 py-1 text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded transition-colors"
            >
              Sesuaikan
            </button>
          )}
        </div>
      )}

      {!item.isUnavailable && item.hasPriceChanged && (
        <div className="mt-3 p-2.5 rounded-lg bg-stone-100 border border-stone-300 text-xs text-stone-800 flex items-start gap-2">
          <RefreshCw className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Harga produk telah berubah.</span>
            <span className="text-[11px] text-stone-600">
              Sebelumnya {formatRupiah(item.previousPrice)} → sekarang{' '}
              <strong className="text-stone-900">{formatRupiah(item.currentPrice)}</strong>.
            </span>
          </div>
          {onConfirmPriceChange && item.currentPrice !== undefined && (
            <button
              type="button"
              onClick={() => onConfirmPriceChange(item.currentPrice!)}
              className="px-2 py-1 text-[10px] font-bold bg-stone-900 hover:bg-stone-800 text-white rounded transition-colors"
            >
              Terapkan
            </button>
          )}
        </div>
      )}

      {/* Quantity & Subtotal Row */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-4">
        <div>
          <QuantitySelector
            quantity={item.quantity}
            maxStock={maxStock}
            onChange={onUpdateQuantity}
            disabled={item.isUnavailable || maxStock <= 0}
            size="sm"
          />
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
            Subtotal
          </span>
          <span className="text-sm sm:text-base font-bold text-stone-950 tabular-nums">
            {formatRupiah(itemSubtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
