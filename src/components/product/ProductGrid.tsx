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
  customerLevelName?: string | null;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  emptyTitle = 'Tidak ada produk ditemukan.',
  emptyDescription = 'Coba ubah kata kunci pencarian atau sesuaikan filter untuk menemukan produk yang Anda cari.',
  onResetFilter,
  onSelectProduct,
  customerLevelName,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-white border border-stone-200/70 rounded-2xl overflow-hidden animate-pulse shadow-xs"
          >
            <div className="aspect-square bg-stone-200/60" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-stone-200 rounded w-1/3" />
              <div className="h-4 bg-stone-200 rounded w-4/5" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
              <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                <div className="h-5 bg-stone-200 rounded w-2/3" />
                <div className="h-4 bg-stone-200 rounded w-1/4" />
              </div>
              <div className="h-8 bg-stone-100 rounded-lg w-full" />
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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          customerLevelName={customerLevelName}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
};
