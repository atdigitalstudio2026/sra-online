import React, { useState, useEffect } from 'react';
import { CustomerMetric } from '../../types';
import { getCustomerMetrics, exportCustomersToCsv } from '../../services/customerService';
import { getCurrentAdminUser } from '../../services/adminUserService';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../components/common/Toast';
import {
  Users,
  Search,
  Filter,
  Download,
  ArrowRight,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';

interface AdminCustomersPageProps {
  onNavigate: (path: string) => void;
}

export const AdminCustomersPage: React.FC<AdminCustomersPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<CustomerMetric[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerMetrics({ search, status: statusFilter });
      setCustomers(data);
    } catch (e) {
      console.error('Failed loading customers', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const currentAdmin = getCurrentAdminUser();
      const csv = await exportCustomersToCsv(currentAdmin);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Data pelanggan berhasil diekspor ke CSV.');
    } catch (err: any) {
      error(err.message || 'Gagal mengekspor data pelanggan.');
    } finally {
      setIsExporting(false);
    }
  };

  const getSegmentationBadge = (seg: string) => {
    switch (seg) {
      case 'repeat':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Pelanggan Setia (2+ Order)</span>;
      case 'new':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">Baru (1 Order)</span>;
      case 'inactive':
        return <span className="bg-stone-200 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold">Tidak Aktif (&gt;90 hari)</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">Aktif</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Manajemen Pelanggan &amp; LTV</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar profil pembeli, segmentasi loyalitas, riwayat belanja, dan nilai total pembelian.
          </p>
        </div>

        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>Ekspor Data CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, nomor WhatsApp, atau email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-medium text-stone-700 focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center">
            <LoadingState message="Memuat data pelanggan..." />
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak (WhatsApp / Email)</th>
                  <th className="py-3 px-4 text-center">Total Order</th>
                  <th className="py-3 px-4 text-right">Total Belanja (LTV)</th>
                  <th className="py-3 px-4">Segmentasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{c.name}</div>
                      <div className="text-[10px] text-stone-400">
                        Terdaftar: {formatDateTime(c.registration_date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-700 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-stone-900 font-semibold">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {c.total_orders}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        ({c.completed_orders} sukses)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-950 tabular-nums">
                      {formatRupiah(c.total_spending)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getSegmentationBadge(c.segmentation)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/admin/customers/${c.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:text-stone-950 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        <span>Profil &amp; Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-stone-400 text-xs">
            Tidak ada pelanggan yang cocok dengan pencarian Anda.
          </div>
        )}
      </div>
    </div>
  );
};
