import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  maxStock: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxStock,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const isMin = quantity <= 1;
  const isMax = maxStock > 0 && quantity >= maxStock;

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMin && !disabled) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMax && !disabled) {
      onChange(quantity + 1);
    }
  };

  const heightClass = size === 'sm' ? 'h-7 text-xs' : 'h-9 text-xs sm:text-sm';
  const buttonWidth = size === 'sm' ? 'w-7' : 'w-9';

  return (
    <div
      className={`inline-flex items-center border border-stone-200 bg-white rounded-lg overflow-hidden shadow-2xs ${heightClass} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isMin || disabled}
        aria-label="Kurangi jumlah"
        className={`${buttonWidth} h-full flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 disabled:text-stone-300 disabled:hover:bg-transparent transition-colors select-none`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="min-w-8 px-2 text-center font-semibold text-stone-900 tabular-nums select-none">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={isMax || disabled}
        aria-label="Tambah jumlah"
        className={`${buttonWidth} h-full flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 disabled:text-stone-300 disabled:hover:bg-transparent transition-colors select-none`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
