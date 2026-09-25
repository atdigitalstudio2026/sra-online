import React from 'react';
import { Category, Brand, ProductFilterParams, SortField, SortOrder } from '../../types';
import { RotateCcw, SlidersHorizontal, Check, Tag, Building, DollarSign } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface FilterPanelProps {
  categories: Category[];
  brands: Brand[];
  filters: ProductFilterParams;
  onFilterChange: (filters: Partial<ProductFilterParams>) => void;
  onReset: () => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  brands,
  filters,
  onFilterChange,
  onReset,
  className = '',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const stockStatuses: { value: ProductFilterParams['stock_status']; label: string }[] = [
    { value: 'all', label: 'Semua Status' },
    { value: 'in_stock', label: 'Tersedia Saja' },
    { value: 'low_stock', label: 'Stok Terbatas (≤10)' },
    { value: 'out_of_stock', label: 'Stok Habis' },
  ];

  const sortOptions: { field: SortField; order: SortOrder; label: string }[] = [
    { field: 'created_at', order: 'desc', label: 'Terbaru Ditambahkan' },
    { field: 'price', order: 'asc', label: 'Harga: Termurah ke Termahal' },
    { field: 'price', order: 'desc', label: 'Harga: Termahal ke Termurah' },
    { field: 'name', order: 'asc', label: 'Nama Produk A – Z' },
    { field: 'name', order: 'desc', label: 'Nama Produk Z – A' },
  ];

  const hasActiveFilters = Boolean(
    filters.category_id ||
      filters.brand_id ||
      filters.category_slug ||
      (filters.min_price && filters.min_price > 0) ||
      (filters.max_price && filters.max_price > 0) ||
      (filters.stock_status && filters.stock_status !== 'all') ||
      filters.is_featured ||
      filters.is_best_seller
  );

  return (
    <aside className={`flex flex-col gap-6 text-sm text-stone-700 ${className}`}>
      {/* Header filter & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2 font-bold text-stone-900">
          <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
          <span>Filter & Urutkan</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Sorting Control */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Urutan Tampilan
        </label>
        <select
          value={`${filters.sort_by || 'created_at'}-${filters.sort_order || 'desc'}`}
          onChange={(e) => {
            const [sort_by, sort_order] = e.target.value.split('-') as [SortField, SortOrder];
            onFilterChange({ sort_by, sort_order, page: 1 });
          }}
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-900 focus:outline-hidden focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors shadow-2xs"
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
        <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-800" />
            <span>Kategori Komoditas</span>
          </span>
        </label>
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onFilterChange({ category_id: undefined, category_slug: undefined, page: 1 })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
              !filters.category_id && !filters.category_slug
                ? 'bg-emerald-950 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-stone-100 font-medium'
            }`}
          >
            <span>Semua Kategori</span>
            {!filters.category_id && !filters.category_slug && <Check className="w-3.5 h-3.5" />}
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
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-emerald-950 text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100 font-medium'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand / Distributor Filter */}
      {brands.length > 0 && (
        <div>
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-800" />
              <span>Brand & Produsen</span>
            </span>
          </label>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onFilterChange({ brand_id: undefined, page: 1 })}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                !filters.brand_id
                  ? 'bg-emerald-950 text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 font-medium'
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-emerald-950 text-white font-bold shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100 font-medium'
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

      {/* Price Range */}
      <div>
        <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-800" />
            <span>Rentang Harga (Rp)</span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-stone-400 block mb-1">Min:</span>
            <input
              type="number"
              min={0}
              step={5000}
              placeholder="0"
              value={filters.min_price || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                onFilterChange({ min_price: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden focus:border-emerald-800"
            />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 block mb-1">Maks:</span>
            <input
              type="number"
              min={0}
              step={5000}
              placeholder="Tak Terbatas"
              value={filters.max_price || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                onFilterChange({ max_price: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden focus:border-emerald-800"
            />
          </div>
        </div>
      </div>

      {/* Stock Availability */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Ketersediaan Stok
        </label>
        <div className="space-y-1.5">
          {stockStatuses.map((st) => (
            <label
              key={st.value}
              className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer hover:text-stone-950 font-medium"
            >
              <input
                type="radio"
                name="stock_status"
                value={st.value}
                checked={(filters.stock_status || 'all') === st.value}
                onChange={() => onFilterChange({ stock_status: st.value, page: 1 })}
                className="w-3.5 h-3.5 text-emerald-800 focus:ring-emerald-700 border-stone-300"
              />
              <span>{st.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Action */}
      {isMobileDrawer && onCloseMobileDrawer && (
        <div className="pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            Terapkan Filter
          </button>
        </div>
      )}
    </aside>
  );
};
