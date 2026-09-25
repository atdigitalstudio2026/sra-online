import React from 'react';
import { ProductWithDetails } from '../../types';
import { formatRupiah, formatWeight, calculateDiscount } from '../../utils/formatters';
import { ProductImageFallback } from '../common/ProductImageFallback';

interface ProductCardProps {
  product: ProductWithDetails;
  onSelect?: (product: ProductWithDetails) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const discount = calculateDiscount(product.price, product.compare_price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;

  return (
    <article
      onClick={() => onSelect && onSelect(product)}
      className="group relative flex flex-col bg-white border border-stone-200/80 rounded-xl overflow-hidden hover:border-stone-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Visual Image Slot */}
      <div className="relative overflow-hidden bg-stone-50">
        <ProductImageFallback
          src={product.primary_image}
          alt={product.name}
          aspectRatio="4/3"
          categorySlug={product.category?.slug}
          className="group-hover:scale-[1.02] transition-transform duration-300"
        />

        {/* Promo tag (quiet text indicator, anti-slop) */}
        {discount && discount > 0 && !isOutOfStock && (
          <div className="absolute top-2.5 left-2.5 bg-amber-900 text-amber-50 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-sm shadow-xs">
            Hemat {discount}%
          </div>
        )}

        {/* Stock tag if out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white text-xs font-semibold tracking-wide uppercase px-3 py-1 bg-stone-950/80 rounded-sm">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-4">
        {/* Quiet Metadata kicker: Category · SKU */}
        <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5 truncate">
          <span className="font-medium text-stone-600 truncate">
            {product.category?.name || 'Komoditas'}
          </span>
          <span aria-hidden="true" className="text-stone-300">
            ·
          </span>
          <span className="font-mono text-[11px] text-stone-400 shrink-0">
            {product.sku}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors mb-2">
          {product.name}
        </h3>

        {/* Short description preview if present */}
        {product.short_description && (
          <p className="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed">
            {product.short_description}
          </p>
        )}

        {/* Spacer to push price and stock to bottom */}
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-bold text-stone-900 tabular-nums">
                {formatRupiah(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  {formatRupiah(product.compare_price)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              per {formatWeight(product.weight, product.unit)}
            </div>
          </div>

          {/* Stock indication */}
          <div className="text-right shrink-0">
            {isOutOfStock ? (
              <span className="text-[11px] font-medium text-stone-400">Habis</span>
            ) : isLowStock ? (
              <span className="text-[11px] font-medium text-amber-700">
                Sisa {product.stock}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-stone-500">
                Stok {product.stock}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
