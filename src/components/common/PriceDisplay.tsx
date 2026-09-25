import React from 'react';
import { formatRupiah } from '../../utils/formatters';

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  resellerPrice?: number | null;
  customerLevelName?: string | null;
  unit?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showResellerPrompt?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  comparePrice,
  resellerPrice,
  customerLevelName,
  unit,
  size = 'md',
  showResellerPrompt = true,
  className = '',
}) => {
  const hasDiscount = Boolean(comparePrice && comparePrice > price);
  const discountPercent = hasDiscount && comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  // Size variations
  const sizeClasses = {
    sm: {
      price: 'text-sm font-bold text-stone-900',
      compare: 'text-[11px] text-stone-400 line-through',
      unit: 'text-[10px] text-stone-500',
      badge: 'text-[9px] px-1.5 py-0.2',
      reseller: 'text-[10px]',
    },
    md: {
      price: 'text-base font-bold text-emerald-950',
      compare: 'text-xs text-stone-400 line-through',
      unit: 'text-xs text-stone-500',
      badge: 'text-[10px] px-1.5 py-0.5',
      reseller: 'text-xs',
    },
    lg: {
      price: 'text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight',
      compare: 'text-sm text-stone-400 line-through',
      unit: 'text-xs sm:text-sm text-stone-500',
      badge: 'text-xs px-2 py-0.5',
      reseller: 'text-xs sm:text-sm',
    },
    xl: {
      price: 'text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight',
      compare: 'text-base text-stone-400 line-through',
      unit: 'text-sm text-stone-500',
      badge: 'text-xs px-2.5 py-1',
      reseller: 'text-sm',
    },
  };

  const currentSize = sizeClasses[size];

  // Estimate a reseller tier price if not explicitly provided (e.g. 8-12% lower for wholesale)
  const effectiveResellerPrice = resellerPrice || (price > 10000 ? Math.round(price * 0.92) : null);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {/* Price row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`${currentSize.price} tabular-nums`}>
          {formatRupiah(price)}
        </span>

        {hasDiscount && comparePrice && (
          <span className={`${currentSize.compare} tabular-nums`}>
            {formatRupiah(comparePrice)}
          </span>
        )}

        {hasDiscount && discountPercent > 0 && (
          <span className={`bg-orange-50 text-orange-700 font-semibold rounded ${currentSize.badge} uppercase tracking-wider`}>
            -{discountPercent}%
          </span>
        )}

        {unit && (
          <span className={currentSize.unit}>
            /{unit}
          </span>
        )}
      </div>

      {/* Customer level badge if active */}
      {customerLevelName && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {customerLevelName}
          </span>
        </div>
      )}

      {/* Reseller wholesale hint if retail */}
      {showResellerPrompt && !customerLevelName && effectiveResellerPrice && effectiveResellerPrice < price && (
        <div className={`text-stone-500 mt-0.5 flex items-center gap-1.5 ${currentSize.reseller}`}>
          <span className="text-amber-800 font-medium">Mulai {formatRupiah(effectiveResellerPrice)}</span>
          <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded font-medium">
            Reseller
          </span>
        </div>
      )}
    </div>
  );
};
