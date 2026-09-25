import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 'sm',
  showCount = true,
  className = '',
}) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  const normalizedRating = Math.max(0, Math.min(5, rating || 5));

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center text-amber-500">
        <Star className={`${iconSizes[size]} fill-amber-400 stroke-amber-500`} />
      </div>

      <span className={`font-semibold text-stone-800 ${textSizes[size]}`}>
        {normalizedRating.toFixed(1)}
      </span>

      {showCount && typeof count === 'number' && (
        <span className={`text-stone-400 ${textSizes[size]}`}>
          ({count})
        </span>
      )}
    </div>
  );
};
