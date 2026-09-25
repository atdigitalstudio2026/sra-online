import React, { useState, useEffect } from 'react';
import {
  CategoryAnalytics,
  BrandAnalytics,
  ProductPerformanceItem,
  DateFilterRange,
  DateRangePreset,
  Category,
  Brand,
} from '../../types';
import {
  getProductPerformance,
  getCategoryPerformance,
  getBrandPerformance,
} from '../../services/analyticsService';
import { getCategories } from '../../services/categoryService';
import { getBrands } from '../../services/brandService';
import { formatRupiah } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import {
  BarChart3,
  Layers,
  Award,
  Package,
  Calendar,
  Filter,
} from 'lucide-react';

interface AdminAnalyticsPageProps {
  initialTab?: 'products' | 'categories' | 'brands';
  onNavigate: (path: string) => void;
}

export const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({
  initialTab = 'products',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands'>(initialTab);
  const [dateRange, setDateRange] = useState<DateFilterRange>({ preset: '30d' });
  const [productsData, setProductsData] = useState<ProductPerformanceItem[]>([]);
  const [categoriesData, setCategoriesData] = useState<CategoryAnalytics[]>([]);
  const [brandsData, setBrandsData] = useState<BrandAnalytics[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cList, bList] = await Promise.all([getCategories(), getBrands()]);
        setCategories(cList);
        setBrands(bList);
      } catch (err) {
        console.warn('Failed loading categories/brands', err);
      }
    }
    loadMeta();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'products') {
        const data = await getProductPerformance(dateRange, selectedCategory, selectedBrand);
        setProductsData(data);
      } else if (activeTab === 'categories') {
        const data = await getCategoryPerformance(dateRange);
        setCategoriesData(data);
      } else if (activeTab === 'brands') {
        const data = await getBrandPerformance(dateRange);
        setBrandsData(data);
      }
    } catch (e) {
      console.error('Failed loading analytics data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange.preset, selectedCategory, selectedBrand]);

  const handleTabChange = (tab: 'products' | 'categories' | 'brands') => {
    setActiveTab(tab);
    onNavigate(`/admin/analytics/${tab}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter & Tabs */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Analitik Performa Katalog Komoditas
            </h2>
            <p className="text-xs text-stone-500">
              Analisis komprehensif performa penjualan berdasarkan produk, kategori, dan brand distributor.
            </p>
          </div>

          {/* Date range presets */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
            {[
              { id: '7d', label: '7 Hari' },
              { id: '30d', label: '30 Hari' },
              { id: '90d', label: '90 Hari' },
              { id: '12m', label: '12 Bulan' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'this_year', label: 'Tahun Ini' },
              { id: 'all', label: 'Semua' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDateRange({ preset: p.id as DateRangePreset })}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  dateRange.preset === p.id
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Selector (Section 11, 12, 13) */}
        <div className="flex items-center gap-2 border-b border-stone-100 pt-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('products')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Performa Produk ({productsData.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'categories'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kategori ({categoriesData.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('brands')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'brands'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Brand / Distributor ({brandsData.length})</span>
          </button>
        </div>

        {/* Secondary Category & Brand Filter for Products Tab (Section 11) */}
        {activeTab === 'products' && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
              Filter Tambahan:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-stone-600 font-medium">Kategori:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-stone-600 font-medium">Brand:</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-hidden"
              >
                <option value="all">Semua Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center">
            <LoadingState message="Menghitung performa analitik..." />
          </div>
        ) : (
          <>
            {/* Products Tab (Section 11) */}
            {activeTab === 'products' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Nama Produk &amp; SKU</th>
                      <th className="py-3 px-4">Kategori &amp; Brand</th>
                      <th className="py-3 px-4 text-center">Unit Terjual</th>
                      <th className="py-3 px-4 text-center">Frekuensi Pesanan</th>
                      <th className="py-3 px-4 text-right">Rata-Rata Harga (ASP)</th>
                      <th className="py-3 px-4 text-right">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {productsData.length > 0 ? (
                      productsData.map((p) => (
                        <tr key={p.product_id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{p.product_name}</div>
                            <div className="text-[10px] font-mono text-stone-400">{p.sku}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            <div>{p.category_name}</div>
                            <div className="text-[10px] text-stone-400">{p.brand_name}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                            {p.units_sold} pcs
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-stone-700">
                            {p.orders_count} pesanan
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-stone-600">
                            {formatRupiah(p.average_selling_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-stone-950 tabular-nums">
                            {formatRupiah(p.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400">
                          Tidak ada data penjualan produk pada kriteria ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Categories Tab (Section 12) */}
            {activeTab === 'categories' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-center">Produk Terjual</th>
                      <th className="py-3 px-4 text-center">Volume Pesanan</th>
                      <th className="py-3 px-4">Kontribusi Penjualan (%)</th>
                      <th className="py-3 px-4 text-right">Total Omset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {categoriesData.length > 0 ? (
                      categoriesData.map((c) => (
                        <tr key={c.category_id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {c.category_name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                            {c.products_sold} pcs
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                            {c.orders_count} pesanan
                          </td>
                          <td className="py-3.5 px-4 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-amber-800 h-full rounded-full"
                                  style={{ width: `${Math.min(100, c.percentage_of_sales)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-semibold text-stone-700">
                                {c.percentage_of_sales}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-stone-950 tabular-nums">
                            {formatRupiah(c.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-stone-400">
                          Tidak ada data penjualan kategori pada rentang ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Brands Tab (Section 13) */}
            {activeTab === 'brands' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Nama Brand / Distributor</th>
                      <th className="py-3 px-4 text-center">Unit Terjual</th>
                      <th className="py-3 px-4 text-center">Frekuensi Pesanan</th>
                      <th className="py-3 px-4 text-right">Total Omset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {brandsData.length > 0 ? (
                      brandsData.map((b) => (
                        <tr key={b.brand_id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {b.brand_name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                            {b.units_sold} pcs
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                            {b.orders_count} pesanan
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-stone-950 tabular-nums">
                            {formatRupiah(b.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-400">
                          Tidak ada data penjualan brand pada rentang ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
