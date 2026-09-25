import React from 'react';
import { ProductWithDetails } from '../../types';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../common/EmptyState';

interface ProductGridProps {
  products: ProductWithDetails[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilter?: () => void;
  onSelectProduct?: (product: ProductWithDetails) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  emptyTitle = 'Tidak ada produk ditemukan.',
  emptyDescription = 'Coba ubah kata kunci pencarian atau sesuaikan filter untuk menemukan produk yang Anda cari.',
  onResetFilter,
  onSelectProduct,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-white border border-stone-200/60 rounded-xl overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] bg-stone-200/70" />
            <div className="p-4 space-y-2.5">
              <div className="h-3 bg-stone-200 rounded w-1/3" />
              <div className="h-4 bg-stone-200 rounded w-4/5" />
              <div className="h-3 bg-stone-200 rounded w-2/3" />
              <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                <div className="h-5 bg-stone-200 rounded w-1/2" />
                <div className="h-3 bg-stone-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onResetFilter ? 'Reset Filter' : undefined}
        onAction={onResetFilter}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
};
