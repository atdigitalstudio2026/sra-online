import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight, Package, Tag, Building } from 'lucide-react';
import { ProductWithDetails, Category, Brand } from '../../types';
import { getProducts } from '../../services/productService';
import { formatRupiah } from '../../utils/formatters';
import { ProductImageFallback } from '../common/ProductImageFallback';

interface SearchBarProps {
  categories: Category[];
  brands?: Brand[];
  onNavigate: (path: string) => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  isMobile?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  categories,
  brands = [],
  onNavigate,
  onSearchSubmit,
  className = '',
  isMobile = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productResults, setProductResults] = useState<ProductWithDetails[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setProductResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await getProducts({ search: trimmed, limit: 5 });
        setProductResults(result.data);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      onNavigate(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setProductResults([]);
    setIsOpen(false);
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    onNavigate(`/products/${slug}`);
  };

  const handleSelectCategory = (slug: string) => {
    setIsOpen(false);
    onNavigate(`/category/${slug}`);
  };

  // Filter matching categories and brands client-side
  const trimmed = query.trim().toLowerCase();
  const matchedCategories = trimmed.length >= 2
    ? categories.filter((c) => c.name.toLowerCase().includes(trimmed) || (c.description && c.description.toLowerCase().includes(trimmed))).slice(0, 3)
    : [];

  const matchedBrands = trimmed.length >= 2
    ? brands.filter((b) => b.name.toLowerCase().includes(trimmed)).slice(0, 2)
    : [];

  const hasSuggestions = trimmed.length >= 2 && (productResults.length > 0 || matchedCategories.length > 0 || matchedBrands.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-emerald-800/60">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari produk, kategori komoditas, atau SKU..."
          aria-label="Cari produk"
          className="w-full pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm bg-stone-100/90 border border-stone-200/90 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-hidden transition-all shadow-inner"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Hapus kata kunci"
            className="absolute right-3 p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Suggestion Popover Dropdown */}
      {isOpen && trimmed.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 max-h-[80vh] overflow-y-auto">
          {/* Categories matches */}
          {matchedCategories.length > 0 && (
            <div className="px-4 py-2 border-b border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3 h-3 text-emerald-700" />
                <span>Kategori Terkait</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCategory(c.slug)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 transition-colors"
                  >
                    <span>{c.name}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brands matches */}
          {matchedBrands.length > 0 && (
            <div className="px-4 py-2 border-b border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mb-1.5">
                <Building className="w-3 h-3" />
                <span>Brand & Produsen</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedBrands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate(`/products?search=${encodeURIComponent(b.name)}`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 transition-colors"
                  >
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Results */}
          <div className="px-2 py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3 h-3" />
                <span>Produk Ditemukan</span>
              </span>
              {productResults.length > 0 && (
                <span className="text-emerald-700 font-medium">
                  {productResults.length} hasil
                </span>
              )}
            </div>

            {productResults.length === 0 && !isLoading ? (
              <div className="px-4 py-6 text-center text-xs text-stone-500">
                Tidak ada komoditas dengan kata kunci &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="space-y-0.5">
                {productResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product.slug)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors text-left group"
                  >
                    <div className="w-11 h-11 rounded-lg bg-stone-100 border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
                      <ProductImageFallback
                        src={product.primary_image}
                        alt={product.name}
                        aspectRatio="square"
                        categorySlug={product.category?.slug}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-0.5">
                        <span className="text-emerald-800 font-semibold">{product.category?.name || 'Komoditas'}</span>
                        <span>•</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-emerald-900 truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-stone-950 tabular-nums">
                          {formatRupiah(product.price)}
                        </span>
                        {product.stock <= 0 ? (
                          <span className="text-[10px] text-red-600 font-medium">Habis</span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Stok: {product.stock}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom All Results Button */}
          <div className="pt-2 px-3 border-t border-stone-100 mt-1">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900 text-xs font-semibold text-stone-700 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Lihat semua hasil untuk &ldquo;{query}&rdquo;</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
