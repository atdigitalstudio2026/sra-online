import React, { useState, useEffect } from 'react';
import {
  SalesSummary,
  SalesOverTimePoint,
  TopSellingProduct,
  DateFilterRange,
  DateRangePreset,
} from '../../types';
import {
  getSalesSummary,
  getSalesTrend,
  getTopProducts,
} from '../../services/analyticsService';
import { formatRupiah } from '../../utils/formatters';
import { SalesTrendChart } from '../../components/admin/charts/SalesTrendChart';
import { LoadingState } from '../../components/common/LoadingState';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Clock,
  Truck,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CreditCard,
  Calendar,
  ArrowRight,
  Boxes,
  Award,
  Layers,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [dateRange, setDateRange] = useState<DateFilterRange>({ preset: '30d' });
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [trendData, setTrendData] = useState<SalesOverTimePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [topSortBy, setTopSortBy] = useState<'units' | 'revenue'>('units');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sum, trend, top] = await Promise.all([
        getSalesSummary(dateRange),
        getSalesTrend(dateRange),
        getTopProducts(dateRange, 10, topSortBy),
      ]);
      setSummary(sum);
      setTrendData(trend);
      setTopProducts(top);
    } catch (err) {
      console.error('Failed loading dashboard analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange.preset, topSortBy]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Filter & Date Range Selector */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            Pusat Informasi Bisnis &amp; Penjualan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Ringkasan data real-time transaksi, inventaris, dan kinerja katalog komoditas pangan.
          </p>
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: '7d', label: '7 Hari' },
            { id: '30d', label: '30 Hari' },
            { id: '90d', label: '90 Hari' },
            { id: '12m', label: '12 Bulan' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'this_year', label: 'Tahun Ini' },
            { id: 'all', label: 'Semua' },
            { id: 'custom', label: 'Kustom' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                if (preset.id === 'custom') {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  setDateRange({ preset: 'custom', startDate: todayStr, endDate: todayStr });
                } else {
                  setDateRange({ preset: preset.id as DateRangePreset });
                }
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                dateRange.preset === preset.id
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {dateRange.preset === 'custom' && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-stone-700">Rentang Tanggal Kustom:</span>
          <div className="flex items-center gap-2">
            <label className="text-stone-500">Mulai:</label>
            <input
              type="date"
              value={dateRange.startDate || ''}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-2.5 py-1 bg-white border border-stone-200 rounded-md font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-stone-500">Sampai:</label>
            <input
              type="date"
              value={dateRange.endDate || ''}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-2.5 py-1 bg-white border border-stone-200 rounded-md font-mono"
            />
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1 bg-stone-900 text-white rounded-md font-semibold hover:bg-stone-800 transition-colors"
          >
            Terapkan
          </button>
        </div>
      )}

      {isLoading || !summary ? (
        <LoadingState message="Menghitung analitik bisnis..." fullHeight />
      ) : (
        <>
          {/* Main Financial & Operational KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Sales */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
                  Total Penjualan Bersih
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                  {formatRupiah(summary.net_sales)}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                  <span>Hari Ini: <strong>{formatRupiah(summary.today_sales)}</strong></span>
                  <span>Bulan Ini: <strong>{formatRupiah(summary.this_month_sales)}</strong></span>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
                  Total Pesanan Masuk
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                  {summary.total_orders}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                  <span className="text-emerald-700 font-semibold">
                    {summary.valid_orders} Valid/Lunas
                  </span>
                  <span className="text-rose-700 font-medium">
                    {summary.cancelled_orders} Batal
                  </span>
                </div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
                  Total Pelanggan
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-800">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                  {summary.total_customers_count}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                  <span>AOV: <strong>{formatRupiah(summary.average_order_value)}</strong></span>
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/customers')}
                    className="text-amber-800 font-semibold hover:underline"
                  >
                    Lihat &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Overview */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
                  Katalog &amp; Stok Menipis
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                  {summary.total_products_count} <span className="text-xs font-normal text-stone-500">item</span>
                </div>
                <div className="text-[11px] mt-1 flex items-center justify-between">
                  <span className="text-amber-700 font-bold">
                    {summary.low_stock_count} Stok Menipis
                  </span>
                  <span className="text-rose-700 font-bold">
                    {summary.out_of_stock_count} Habis
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Action Cards (Pending payment, to process, to ship) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigate('/admin/orders')}
              className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-amber-900 font-semibold block">Menunggu Pembayaran</span>
                  <span className="text-lg font-bold font-mono text-stone-900">{summary.pending_payments_count} pesanan</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-800" />
            </div>

            <div
              onClick={() => onNavigate('/admin/orders')}
              className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-200/60 text-blue-900 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-blue-900 font-semibold block">Perlu Diproses Gudang</span>
                  <span className="text-lg font-bold font-mono text-stone-900">{summary.orders_to_process_count} pesanan</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-800" />
            </div>

            <div
              onClick={() => onNavigate('/admin/orders')}
              className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-200/60 text-emerald-900 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-emerald-900 font-semibold block">Dalam Pengiriman</span>
                  <span className="text-lg font-bold font-mono text-stone-900">{summary.orders_to_ship_count} pesanan</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-800" />
            </div>
          </div>

          {/* Sales Trend Chart (Section 4 & 5) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <SalesTrendChart
              data={trendData}
              title={`Grafik Tren Penjualan & Pesanan (${dateRange.preset.toUpperCase()})`}
            />
          </div>

          {/* Status Breakdown Grid (Sections 6, 7 & 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Status Distribution */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2.5">
                Distribusi Status Pesanan
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'pending_payment', label: 'Menunggu Bayar' },
                  { key: 'processing', label: 'Diproses' },
                  { key: 'shipped', label: 'Dikirim' },
                  { key: 'completed', label: 'Selesai' },
                  { key: 'cancelled', label: 'Dibatalkan' },
                ].map((s) => (
                  <div key={s.key} className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase block truncate">
                      {s.label}
                    </span>
                    <span className="text-base font-bold font-mono text-stone-900">
                      {summary.order_status_counts[s.key as keyof typeof summary.order_status_counts] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Status Distribution */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2.5">
                Status Pembayaran (Payments)
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'paid', label: 'Lunas (Paid)' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'failed', label: 'Gagal' },
                  { key: 'expired', label: 'Kedaluwarsa' },
                  { key: 'refunded', label: 'Refunded' },
                ].map((p) => (
                  <div key={p.key} className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase block truncate">
                      {p.label}
                    </span>
                    <span className="text-base font-bold font-mono text-stone-900">
                      {summary.payment_status_counts[p.key as keyof typeof summary.payment_status_counts] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Status Distribution (Section 8) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2.5">
                Status Pengiriman (Shipments)
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'pending_shipment', label: 'Pending Shipment' },
                  { key: 'processing', label: 'Processing' },
                  { key: 'shipped', label: 'Shipped' },
                  { key: 'in_transit', label: 'In Transit' },
                  { key: 'out_for_delivery', label: 'Out for Delivery' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'returned', label: 'Returned' },
                ].map((sh) => (
                  <div key={sh.key} className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase block truncate">
                      {sh.label}
                    </span>
                    <span className="text-base font-bold font-mono text-stone-900">
                      {summary.shipping_status_counts?.[sh.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 10 Selling Products Table (Section 9 & 10) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                  Top 10 Produk Terlaris ({topSortBy === 'units' ? 'Berdasarkan Kuantitas' : 'Berdasarkan Omset'})
                </h3>
                <p className="text-[11px] text-stone-500">
                  Dihitung secara akurat dari order_items historis pesanan valid.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTopSortBy('units')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    topSortBy === 'units' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Urut Kuantitas
                </button>
                <button
                  type="button"
                  onClick={() => setTopSortBy('revenue')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    topSortBy === 'revenue' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Urut Omset (IDR)
                </button>
              </div>
            </div>

            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">Rank</th>
                      <th className="py-2.5 px-4">Nama Produk &amp; SKU</th>
                      <th className="py-2.5 px-4 text-center">Kuantitas Terjual</th>
                      <th className="py-2.5 px-4 text-right">Total Omset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {topProducts.map((tp) => (
                      <tr key={tp.product_id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                              tp.rank === 1
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : tp.rank === 2
                                ? 'bg-stone-200 text-stone-800'
                                : tp.rank === 3
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-stone-500'
                            }`}
                          >
                            {tp.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">{tp.product_name}</div>
                          <div className="text-[10px] font-mono text-stone-400">{tp.product_sku}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                          {tp.units_sold} pcs
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-950 tabular-nums">
                          {formatRupiah(tp.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                Belum ada transaksi penjualan pada rentang waktu ini.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
