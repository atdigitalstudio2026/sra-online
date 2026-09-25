import React, { useState, useEffect } from 'react';
import { getAllPaymentsAdmin } from '../../services/payment/paymentService';
import { PaymentRecord } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import {
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface AdminPaymentsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPaymentsPage: React.FC<AdminPaymentsPageProps> = ({ onNavigate }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPaymentsAdmin({
        status: statusFilter,
        search: searchQuery,
      });
      setPayments(data);
    } catch (e) {
      console.error('Failed loading admin payments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Filters and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, order ID, atau metode pembayaran..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-medium text-stone-700 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="paid">Lunas (Paid)</option>
                <option value="pending">Menunggu (Pending)</option>
                <option value="failed">Gagal (Failed)</option>
                <option value="expired">Kedaluwarsa (Expired)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center">
            <LoadingState message="Memuat daftar transaksi pembayaran..." />
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Order ID / ID Transaksi</th>
                  <th className="py-3 px-4">Provider &amp; Metode</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900">
                        {p.order_id}
                      </div>
                      <div className="font-mono text-[10px] text-stone-400 truncate max-w-xs">
                        Tx: {p.provider_transaction_id || p.id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-800 capitalize">
                        {p.payment_method || 'Virtual Account'}
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
                        {p.provider}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-950 tabular-nums">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'expired'
                            ? 'bg-stone-100 text-stone-600'
                            : p.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status === 'paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : p.status === 'pending' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/admin/orders/${p.order_id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:text-stone-950 border border-stone-200 hover:bg-stone-100 rounded-md transition-colors"
                      >
                        <span>Rincian Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-stone-500 text-xs">
            Tidak ada transaksi pembayaran yang cocok dengan filter.
          </div>
        )}
      </div>
    </div>
  );
};
