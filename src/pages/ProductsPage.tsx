import React, { useState } from 'react';
import { Category, Brand, ProductWithDetails, ProductFilterParams } from '../types';
import { ProductGrid } from '../components/product/ProductGrid';
import { SearchBar } from '../components/product/SearchBar';
import { FilterPanel } from '../components/product/FilterPanel';
import { Pagination } from '../components/common/Pagination';
import { SlidersHorizontal, X } from 'lucide-react';

interface ProductsPageProps {
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
  initialCategorySlug?: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
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
  initialCategorySlug,
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active category display name if filtered
  const activeCategory = categories.find(
    (c) => c.id === filters.category_id || c.slug === filters.category_slug
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {activeCategory ? activeCategory.name : 'Katalog Seluruh Produk'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
              {activeCategory?.description ||
                'Pilihan komoditas pangan terbaik siap kirim: kurma, biji wijen, aneka kacang curah, bawang segar, dan rempah bumbu alami.'}
            </p>
          </div>

          <div className="text-xs text-stone-400 tabular-nums">
            Total <span className="font-semibold text-stone-700">{total}</span> produk tersedia
          </div>
        </div>
      </div>

      {/* Search Bar & Mobile Filter Trigger */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1">
          <SearchBar
            value={filters.search || ''}
            onChange={(val) => onFilterChange({ search: val, page: 1 })}
            placeholder="Cari berdasarkan nama produk, SKU, atau brand..."
          />
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50"
        >
          <SlidersHorizontal className="w-4 h-4 text-stone-600" />
          <span>Filter</span>
        </button>
      </div>

      {/* Main Grid & Desktop Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Desktop Sidebar Filter */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
            <FilterPanel
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={onResetFilters}
            />
          </div>
        </div>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            emptyTitle={
              filters.search
                ? 'Produk yang Anda cari tidak ditemukan.'
                : activeCategory
                ? 'Belum ada produk pada kategori ini.'
                : 'Tidak ada produk ditemukan.'
            }
            emptyDescription="Silakan coba gunakan kata kunci lain atau bersihkan filter untuk menampilkan seluruh pilihan produk kami."
            onResetFilter={onResetFilters}
            onSelectProduct={onSelectProduct}
          />

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            limit={limit}
            onPageChange={(newPage) => onFilterChange({ page: newPage })}
          />
        </div>
      </div>

      {/* Mobile Drawer Filter */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white p-5 shadow-2xl flex flex-col z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <span className="font-semibold text-stone-900 text-sm">Filter & Urutkan</span>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterPanel
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={(f) => {
                onFilterChange(f);
              }}
              onReset={() => {
                onResetFilters();
                setMobileFilterOpen(false);
              }}
            />

            <div className="mt-8 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg text-center"
              >
                Terapkan Filter ({total} Produk)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
