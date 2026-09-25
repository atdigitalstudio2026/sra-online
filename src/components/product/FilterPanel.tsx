import React from 'react';
import { Category, Brand, ProductFilterParams, SortField, SortOrder } from '../../types';
import { RotateCcw, SlidersHorizontal, Check } from 'lucide-react';

interface FilterPanelProps {
  categories: Category[];
  brands: Brand[];
  filters: ProductFilterParams;
  onFilterChange: (filters: Partial<ProductFilterParams>) => void;
  onReset: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  brands,
  filters,
  onFilterChange,
  onReset,
  className = '',
}) => {
  const stockStatuses: { value: ProductFilterParams['stock_status']; label: string }[] = [
    { value: 'all', label: 'Semua Status' },
    { value: 'in_stock', label: 'Tersedia' },
    { value: 'low_stock', label: 'Stok Menipis (≤10)' },
    { value: 'out_of_stock', label: 'Stok Habis' },
  ];

  const sortOptions: { field: SortField; order: SortOrder; label: string }[] = [
    { field: 'created_at', order: 'desc', label: 'Terbaru' },
    { field: 'name', order: 'asc', label: 'Nama A - Z' },
    { field: 'name', order: 'desc', label: 'Nama Z - A' },
    { field: 'price', order: 'asc', label: 'Harga Termurah' },
    { field: 'price', order: 'desc', label: 'Harga Termahal' },
  ];

  const hasActiveFilters = Boolean(
    filters.category_id ||
      filters.brand_id ||
      filters.category_slug ||
      (filters.min_price && filters.min_price > 0) ||
      (filters.max_price && filters.max_price > 0) ||
      (filters.stock_status && filters.stock_status !== 'all')
  );

  return (
    <aside className={`flex flex-col gap-6 text-sm text-stone-700 ${className}`}>
      {/* Header filter & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2 font-semibold text-stone-900">
          <SlidersHorizontal className="w-4 h-4 text-stone-600" />
          <span>Filter & Urutkan</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-amber-900 hover:text-amber-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sorting Control */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
          Urutan Tampilan
        </label>
        <select
          value={`${filters.sort_by || 'created_at'}-${filters.sort_order || 'desc'}`}
          onChange={(e) => {
            const [sort_by, sort_order] = e.target.value.split('-') as [SortField, SortOrder];
            onFilterChange({ sort_by, sort_order, page: 1 });
          }}
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
        >
          {sortOptions.map((opt, idx) => (
            <option key={idx} value={`${opt.field}-${opt.order}`}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories Filter */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5">
          Kategori
        </label>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onFilterChange({ category_id: undefined, category_slug: undefined, page: 1 })}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
              !filters.category_id && !filters.category_slug
                ? 'bg-stone-900 text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span>Semua Kategori</span>
            {(!filters.category_id && !filters.category_slug) && <Check className="w-3.5 h-3.5" />}
          </button>
          {categories.map((cat) => {
            const isSelected =
              filters.category_id === cat.id || filters.category_slug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    category_id: isSelected ? undefined : cat.id,
                    category_slug: isSelected ? undefined : cat.slug,
                    page: 1,
                  })
                }
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-stone-900 text-white font-medium'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5">
            Brand / Produsen
          </label>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onFilterChange({ brand_id: undefined, page: 1 })}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                !filters.brand_id
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>Semua Brand</span>
              {!filters.brand_id && <Check className="w-3.5 h-3.5" />}
            </button>
            {brands.map((b) => {
              const isSelected = filters.brand_id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      brand_id: isSelected ? undefined : b.id,
                      page: 1,
                    })
                  }
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-stone-900 text-white font-medium'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Status Filter */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
          Ketersediaan Stok
        </label>
        <div className="grid grid-cols-1 gap-1">
          {stockStatuses.map((item) => {
            const isSelected =
              filters.stock_status === item.value ||
              (!filters.stock_status && item.value === 'all');
            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  onFilterChange({
                    stock_status: item.value,
                    page: 1,
                  })
                }
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-stone-900 text-white font-medium'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
          Rentang Harga (Rp)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-stone-400 block mb-1">Min</span>
            <input
              type="number"
              min="0"
              step="5000"
              placeholder="0"
              value={filters.min_price || ''}
              onChange={(e) =>
                onFilterChange({
                  min_price: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-hidden focus:border-stone-400 tabular-nums"
            />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 block mb-1">Maks</span>
            <input
              type="number"
              min="0"
              step="5000"
              placeholder="Tak terbatas"
              value={filters.max_price || ''}
              onChange={(e) =>
                onFilterChange({
                  max_price: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-hidden focus:border-stone-400 tabular-nums"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
