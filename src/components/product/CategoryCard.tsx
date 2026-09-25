import React from 'react';
import { Category } from '../../types';
import { ArrowUpRight } from 'lucide-react';
import { ProductImageFallback } from '../common/ProductImageFallback';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
  onClick?: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  productCount,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick && onClick(category)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 hover:border-stone-400 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[170px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 shrink-0">
          <ProductImageFallback
            src={category.image_url}
            alt={category.name}
            aspectRatio="square"
            categorySlug={category.slug}
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-stone-900 group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-base font-semibold text-stone-900 group-hover:text-amber-950 transition-colors">
          {category.name}
        </h4>
        {category.description && (
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
            {category.description}
          </p>
        )}
        {productCount !== undefined && (
          <div className="mt-2 text-[11px] font-medium text-stone-400 tabular-nums">
            {productCount} produk
          </div>
        )}
      </div>
    </div>
  );
};
