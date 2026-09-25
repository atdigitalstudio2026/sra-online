import React from 'react';
import { Category } from '../../types';
import { ArrowUpRight, Package } from 'lucide-react';
import { ProductImageFallback } from '../common/ProductImageFallback';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
  onClick?: (category: Category) => void;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  productCount,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={() => onClick && onClick(category)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 hover:border-emerald-800/40 hover:shadow-lg hover:shadow-emerald-950/5 transition-all duration-300 cursor-pointer min-h-[180px] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200/80 bg-[#FAF9F6] p-1 shrink-0 flex items-center justify-center">
          <ProductImageFallback
            src={category.image_url}
            alt={category.name}
            aspectRatio="square"
            categorySlug={category.slug}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-emerald-900 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-base font-bold text-stone-900 group-hover:text-emerald-950 transition-colors">
          {category.name}
        </h4>
        {category.description && (
          <p className="text-xs text-stone-500 line-clamp-1 mt-1 leading-relaxed">
            {category.description}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            {productCount !== undefined ? `${productCount} Komoditas` : 'Jelajahi Produk'}
          </span>
        </div>
      </div>
    </div>
  );
};
