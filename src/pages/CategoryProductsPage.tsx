import React from 'react';
import { Category, Brand, ProductWithDetails, ProductFilterParams } from '../types';
import { ProductsPage } from './ProductsPage';
import { ArrowLeft } from 'lucide-react';

interface CategoryProductsPageProps {
  category: Category;
  products: ProductWithDetails[];
  categories: Category[];
  brands: Brand[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  isLoading: boolean;
  filters: ProductFilterParams;
  onFilterChange: (filters: Partial<ProductFilterParams>) => void;
  onResetFilters: () => void;
  onSelectProduct: (product: ProductWithDetails) => void;
  onNavigate: (path: string) => void;
}

export const CategoryProductsPage: React.FC<CategoryProductsPageProps> = ({
  category,
  products,
  categories,
  brands,
  total,
  page,
  totalPages,
  limit,
  isLoading,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectProduct,
  onNavigate,
}) => {
  return (
    <div className="space-y-4">
      {/* Category Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          type="button"
          onClick={() => onNavigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Produk</span>
        </button>
      </div>

      <ProductsPage
        products={products}
        categories={categories}
        brands={brands}
        total={total}
        page={page}
        totalPages={totalPages}
        limit={limit}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        onSelectProduct={onSelectProduct}
        initialCategorySlug={category.slug}
      />
    </div>
  );
};
