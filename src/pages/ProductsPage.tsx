import React, { useState } from 'react';
import { Category, Brand, ProductWithDetails, ProductFilterParams } from '../types';
import { ProductGrid } from '../components/product/ProductGrid';
import { FilterPanel } from '../components/product/FilterPanel';
import { Pagination } from '../components/common/Pagination';
import { SlidersHorizontal, X, ArrowLeft, Tag, Building, DollarSign } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

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
  customerLevelName?: string | null;
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
  customerLevelName,
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active category display name if filtered
  const activeCategory = categories.find(
    (c) => c.id === filters.category_id || c.slug === filters.category_slug
  );

  const activeBrand = brands.find((b) => b.id === filters.brand_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header & Context */}
      <div className="mb-8 border-b border-stone-200/90 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1 uppercase tracking-wider">
              <span>Katalog Komoditas Pangan</span>
              {activeCategory && (
                <>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-800">{activeCategory.name}</span>
                </>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-stone-900">
              {activeCategory ? activeCategory.name : 'Seluruh Komoditas Pilihan'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-2xl leading-relaxed">
              {activeCategory?.description ||
                'Koleksi komoditas pangan murni kurma, wijen, kacang pangan, bawang segar, dan rempah bumbu dengan jaminan kualitas terbaik dan harga grosir transparan.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs tabular-nums">
              Total <strong className="text-emerald-950 font-bold">{total}</strong> komoditas tersedia
            </span>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(activeCategory || activeBrand || filters.search || (filters.min_price && filters.min_price > 0) || filters.stock_status !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap pt-4 mt-4 border-t border-stone-100 text-xs">
            <span className="text-stone-400 font-medium">Filter Aktif:</span>

            {filters.search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                <span>Cari: &ldquo;{filters.search}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ search: undefined, page: 1 })}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                <Tag className="w-3 h-3 text-emerald-700" />
                <span>Kategori: {activeCategory.name}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ category_id: undefined, category_slug: undefined, page: 1 })}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeBrand && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                <Building className="w-3 h-3 text-emerald-700" />
                <span>Brand: {activeBrand.name}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ brand_id: undefined, page: 1 })}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.stock_status && filters.stock_status !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                <span>Stok: {filters.stock_status === 'in_stock' ? 'Tersedia' : filters.stock_status}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ stock_status: 'all', page: 1 })}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="text-stone-400 hover:text-orange-600 underline font-medium text-[11px]"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {/* Main Grid & Desktop Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Desktop Sidebar Filter */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
            <FilterPanel
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={onResetFilters}
            />
          </div>
        </div>

        {/* Right Product Grid & Pagination */}
        <div className="lg:col-span-3 space-y-8">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onResetFilter={onResetFilters}
            onSelectProduct={onSelectProduct}
            customerLevelName={customerLevelName}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-stone-200 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                limit={limit}
                onPageChange={(p) => onFilterChange({ page: p })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white p-5 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-250">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Filter Produk
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterPanel
                categories={categories}
                brands={brands}
                filters={filters}
                onFilterChange={onFilterChange}
                onReset={onResetFilters}
                isMobileDrawer
                onCloseMobileDrawer={() => setMobileFilterOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
