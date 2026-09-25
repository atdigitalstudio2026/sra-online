import React, { useState, useEffect } from 'react';
import {
  SalesSummary,
  DailySalesRow,
  MonthlySalesRow,
  YearlySalesRow,
  DateFilterRange,
  DateRangePreset,
} from '../../types';
import {
  getSalesSummary,
  getDailySalesTable,
  getMonthlySalesTable,
  getYearlySalesTable,
  exportSalesReportCsv,
  exportSalesReportExcel,
} from '../../services/analyticsService';
import { getCurrentAdminUser } from '../../services/adminUserService';
import { formatRupiah } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../components/common/Toast';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  Percent,
  Truck,
  TrendingUp,
  Boxes,
  Loader2,
  FileText,
} from 'lucide-react';

interface AdminSalesReportPageProps {
  onNavigate: (path: string) => void;
}

export const AdminSalesReportPage: React.FC<AdminSalesReportPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [dateRange, setDateRange] = useState<DateFilterRange>({ preset: '30d' });
  const [reportView, setReportView] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailySalesRow[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySalesRow[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlySalesRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const [sum, daily, monthly, yearly] = await Promise.all([
        getSalesSummary(dateRange),
        getDailySalesTable(dateRange),
        getMonthlySalesTable(dateRange),
        getYearlySalesTable(dateRange),
      ]);
      setSummary(sum);
      setDailyData(daily);
      setMonthlyData(monthly);
      setYearlyData(yearly);
    } catch (err) {
      console.error('Failed loading sales report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dateRange.preset, dateRange.startDate, dateRange.endDate]);

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const actor = getCurrentAdminUser();
      const csv = await exportSalesReportCsv(dateRange, actor);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan_penjualan_${dateRange.preset}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Laporan penjualan (CSV) berhasil diunduh.');
    } catch (err: any) {
      error(err.message || 'Gagal mengekspor laporan penjualan.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const actor = getCurrentAdminUser();
      const excelHtml = await exportSalesReportExcel(dateRange, actor);
      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan_penjualan_${dateRange.preset}_${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Laporan penjualan (Excel) berhasil diunduh.');
    } catch (err: any) {
      error(err.message || 'Gagal mengekspor laporan Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Date Range Controls */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Laporan Keuangan &amp; Penjualan
            </h2>
            <p className="text-xs text-stone-500">
              Audit transaksi komoditas, omset kotor, potongan diskon, dan pendapatan bersih.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExportingCsv}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isExportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              disabled={isExportingExcel}
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
              <span>Ekspor Excel (.xls)</span>
            </button>
          </div>
        </div>

        {/* Date presets (Section 20 & 28) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: '7d', label: '7 Hari' },
            { id: '30d', label: '30 Hari' },
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

        {dateRange.preset === 'custom' && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-stone-700 font-semibold">Filter Rentang Kustom:</span>
            <div className="flex items-center gap-2">
              <label className="text-stone-500">Mulai:</label>
              <input
                type="date"
                value={dateRange.startDate || ''}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-stone-500">Sampai:</label>
              <input
                type="date"
                value={dateRange.endDate || ''}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md font-mono"
              />
            </div>
            <button
              type="button"
              onClick={loadReport}
              className="px-3 py-1 bg-stone-900 text-white rounded-md font-semibold hover:bg-stone-800 transition-colors"
            >
              Terapkan
            </button>
          </div>
        )}
      </div>

      {isLoading || !summary ? (
        <LoadingState message="Menghitung laporan penjualan..." fullHeight />
      ) : (
        <>
          {/* Key Financial Formulas Summary Cards (Section 23, 24) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Sales */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">Penjualan Kotor (Gross Sales)</span>
                <DollarSign className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {formatRupiah(summary.gross_sales)}
              </div>
              <div className="text-[11px] text-stone-400">
                Total akumulasi subtotal produk
              </div>
            </div>

            {/* Discount */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">Total Diskon Promo</span>
                <Percent className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
                -{formatRupiah(summary.discounts)}
              </div>
              <div className="text-[11px] text-stone-400">
                Potongan kupon &amp; promosi
              </div>
            </div>

            {/* Shipping Charges */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">Pendapatan Ongkir</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {formatRupiah(summary.shipping_revenue)}
              </div>
              <div className="text-[11px] text-stone-400">
                Tagihan kurir &amp; kargo
              </div>
            </div>

            {/* Net Sales */}
            <div className="bg-white border-2 border-amber-800/40 rounded-2xl p-5 shadow-2xs space-y-2 bg-amber-50/20">
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span className="font-bold uppercase tracking-wider text-[10px]">Penjualan Bersih (Net Sales)</span>
                <TrendingUp className="w-4 h-4 text-amber-800" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-stone-950 tabular-nums">
                {formatRupiah(summary.net_sales)}
              </div>
              <div className="text-[11px] text-stone-500">
                Gross Sales - Total Diskon
              </div>
            </div>
          </div>

          {/* Secondary Metrics (Orders, Items Sold, AOV) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-stone-500 font-semibold block">Total Pesanan Valid</span>
                <span className="text-xl font-bold font-mono text-stone-900">{summary.valid_orders}</span>
              </div>
              <ShoppingBag className="w-6 h-6 text-stone-300" />
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-stone-500 font-semibold block">Kuantitas Item Terjual</span>
                <span className="text-xl font-bold font-mono text-stone-900">{summary.items_sold} pcs</span>
              </div>
              <Boxes className="w-6 h-6 text-stone-300" />
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs text-stone-500 font-semibold block">Rata-Rata Order (AOV)</span>
                <span className="text-xl font-bold font-mono text-stone-900">{formatRupiah(summary.average_order_value)}</span>
              </div>
              <TrendingUp className="w-6 h-6 text-stone-300" />
            </div>
          </div>

          {/* Breakdown Tables (Section 25, 26, 27) */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Tabel Rincian Penjualan Komoditas</h3>
                <p className="text-xs text-stone-500">
                  Pilih tampilan periode harian, bulanan, atau tahunan sesuai kebutuhan audit.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setReportView('daily')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    reportView === 'daily'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Harian (Daily)
                </button>
                <button
                  type="button"
                  onClick={() => setReportView('monthly')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    reportView === 'monthly'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Bulanan (Monthly)
                </button>
                <button
                  type="button"
                  onClick={() => setReportView('yearly')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    reportView === 'yearly'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Tahunan (Yearly)
                </button>
              </div>
            </div>

            {/* Daily Table (Section 25) */}
            {reportView === 'daily' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4 text-center">Pesanan</th>
                      <th className="py-3 px-4 text-center">Item Terjual</th>
                      <th className="py-3 px-4 text-right">Penjualan Kotor</th>
                      <th className="py-3 px-4 text-right">Diskon</th>
                      <th className="py-3 px-4 text-right">Ongkos Kirim</th>
                      <th className="py-3 px-4 text-right">Penjualan Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {dailyData.length > 0 ? (
                      dailyData.map((d) => (
                        <tr key={d.date} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-bold text-stone-900">
                            {new Date(d.date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-stone-800">{d.orders}</td>
                          <td className="py-3.5 px-4 text-center text-stone-700">{d.items_sold}</td>
                          <td className="py-3.5 px-4 text-right text-stone-700">{formatRupiah(d.gross_sales)}</td>
                          <td className="py-3.5 px-4 text-right text-rose-600">
                            {d.discount > 0 ? `-${formatRupiah(d.discount)}` : 'Rp0'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-stone-600">{formatRupiah(d.shipping)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-stone-950">
                            {formatRupiah(d.net_sales)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-400 font-sans">
                          Tidak ada transaksi harian pada rentang waktu ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Monthly Table (Section 26) */}
            {reportView === 'monthly' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Bulan / Tahun</th>
                      <th className="py-3 px-4 text-center">Total Pesanan</th>
                      <th className="py-3 px-4 text-center">Item Terjual</th>
                      <th className="py-3 px-4 text-right">Penjualan Kotor</th>
                      <th className="py-3 px-4 text-right">Diskon Promosi</th>
                      <th className="py-3 px-4 text-right">Penjualan Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {monthlyData.length > 0 ? (
                      monthlyData.map((m) => (
                        <tr key={m.month} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-bold text-stone-900">{m.month}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-stone-800">{m.orders}</td>
                          <td className="py-3.5 px-4 text-center text-stone-700">{m.items_sold}</td>
                          <td className="py-3.5 px-4 text-right text-stone-700">{formatRupiah(m.gross_sales)}</td>
                          <td className="py-3.5 px-4 text-right text-rose-600">
                            {m.discount > 0 ? `-${formatRupiah(m.discount)}` : 'Rp0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-stone-950">
                            {formatRupiah(m.net_sales)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400 font-sans">
                          Tidak ada data transaksi bulanan pada rentang waktu ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Yearly Table (Section 27) */}
            {reportView === 'yearly' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tahun Kalender</th>
                      <th className="py-3 px-4 text-center">Total Pesanan</th>
                      <th className="py-3 px-4 text-center">Item Terjual</th>
                      <th className="py-3 px-4 text-right">Penjualan Kotor</th>
                      <th className="py-3 px-4 text-right">Diskon Promosi</th>
                      <th className="py-3 px-4 text-right">Penjualan Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {yearlyData.length > 0 ? (
                      yearlyData.map((y) => (
                        <tr key={y.year} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-bold text-stone-900">{y.year}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-stone-800">{y.orders}</td>
                          <td className="py-3.5 px-4 text-center text-stone-700">{y.items_sold}</td>
                          <td className="py-3.5 px-4 text-right text-stone-700">{formatRupiah(y.gross_sales)}</td>
                          <td className="py-3.5 px-4 text-right text-rose-600">
                            {y.discount > 0 ? `-${formatRupiah(y.discount)}` : 'Rp0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-stone-950">
                            {formatRupiah(y.net_sales)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400 font-sans">
                          Tidak ada data transaksi tahunan pada rentang waktu ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
