import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | '4/3' | '16/9';
  categorySlug?: string;
}

export const ProductImageFallback: React.FC<ProductImageFallbackProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = '4/3',
  categorySlug,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pick subtle organic tone based on category
  const getCategoryTheme = (slug?: string) => {
    switch (slug) {
      case 'kurma':
        return 'from-amber-900/10 to-amber-700/5 text-amber-900 border-amber-900/10';
      case 'wijen':
        return 'from-stone-200 to-stone-100 text-stone-700 border-stone-200';
      case 'kacang-kacangan':
        return 'from-amber-100/60 to-yellow-50 text-amber-800 border-amber-200/50';
      case 'bawang':
        return 'from-purple-100/40 to-stone-100 text-purple-900 border-purple-200/50';
      case 'rempah':
        return 'from-orange-100/50 to-amber-50 text-orange-900 border-orange-200/50';
      default:
        return 'from-stone-100 to-stone-50 text-stone-600 border-stone-200';
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : 'aspect-[4/3]';

  if (!src || hasError) {
    return (
      <div
        className={`w-full ${aspectClass} bg-gradient-to-br ${getCategoryTheme(
          categorySlug
        )} flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden relative border ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-2xs border border-white/50">
          <Package className="w-5 h-5 opacity-80" />
        </div>
        <span className="text-[11px] font-medium tracking-tight px-2 line-clamp-1 opacity-75">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} overflow-hidden bg-stone-100 ${className}`}>
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getCategoryTheme(
            categorySlug
          )} animate-pulse`}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
