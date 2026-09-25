import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartBadgeProps {
  onClick?: () => void;
  className?: string;
}

export const CartBadge: React.FC<CartBadgeProps> = ({ onClick, className = '' }) => {
  const { totalCount, isSyncing } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Keranjang Belanja (${totalCount} item)`}
      className={`relative p-2 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-center ${className}`}
    >
      <ShoppingBag className={`w-5 h-5 ${isSyncing ? 'animate-pulse' : ''}`} />

      {totalCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-amber-900 text-white text-[11px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs animate-in zoom-in-50 duration-150">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}
    </button>
  );
};
