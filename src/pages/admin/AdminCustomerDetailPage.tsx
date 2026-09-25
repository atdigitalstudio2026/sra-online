import React, { useState, useEffect } from 'react';
import { CustomerDetailWithOrders } from '../../types';
import { getCustomerDetail } from '../../services/customerService';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface AdminCustomerDetailPageProps {
  customerId: string;
  onNavigate: (path: string) => void;
}

export const AdminCustomerDetailPage: React.FC<AdminCustomerDetailPageProps> = ({
  customerId,
  onNavigate,
}) => {
  const [customer, setCustomer] = useState<CustomerDetailWithOrders | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getCustomerDetail(customerId);
        setCustomer(data);
      } catch (err) {
        console.error('Failed loading customer details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [customerId]);

  if (isLoading) {
    return <LoadingState message="Memuat profil dan riwayat pelanggan..." fullHeight />;
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => onNavigate('/admin/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pelanggan</span>
        </button>
        <EmptyState
          title="Pelanggan Tidak Ditemukan"
          description="Data pelanggan dengan identifikasi ini tidak ditemukan di database."
          actionLabel="Kembali"
          onAction={() => onNavigate('/admin/customers')}
        />
      </div>
    );
  }

  const getSegmentationBadge = (seg: string) => {
    switch (seg) {
      case 'repeat':
        return (
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Pelanggan Setia (Repeat Customer)</span>
          </span>
        );
      case 'new':
        return (
          <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Pelanggan Baru (New Customer)</span>
          </span>
        );
      case 'inactive':
        return (
          <span className="bg-stone-200 text-stone-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            <span>Tidak Aktif (&gt;90 hari)</span>
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            <span>Pelanggan Aktif</span>
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">Selesai</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-semibold">Diproses</span>;
      case 'shipped':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-semibold">Dikirim</span>;
      case 'pending_payment':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold">Menunggu Bayar</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px] font-semibold">Dibatalkan</span>;
      default:
        return <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[11px] font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('/admin/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Data Pelanggan</span>
        </button>

        <div>{getSegmentationBadge(customer.segmentation)}</div>
      </div>

      {/* Profile & KPI Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card (Section 15) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">{customer.name}</h2>
              <span className="text-[11px] text-stone-500 font-mono">
                Status: {customer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 text-stone-700">
              <Phone className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="font-mono font-medium">{customer.phone}</span>
            </div>

            <div className="flex items-center gap-3 text-stone-700">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="font-medium">{customer.email || 'Email belum terisi'}</span>
            </div>

            <div className="flex items-center gap-3 text-stone-700">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Terdaftar Sejak: {formatDateTime(customer.registration_date)}</span>
            </div>
          </div>
        </div>

        {/* Order Summary & Customer LTV (Section 16) */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Nilai Sepanjang Waktu Pelanggan (Customer LTV)
            </h3>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-stone-950 tabular-nums">
                {formatRupiah(customer.total_spending)}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Total Belanja Lunas/Valid
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-stone-100">
            <div className="p-3 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Pesanan</span>
              <span className="text-lg font-bold font-mono text-stone-900">{customer.total_orders}</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Pesanan Selesai</span>
              <span className="text-lg font-bold font-mono text-emerald-700">{customer.completed_orders}</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Pesanan Batal</span>
              <span className="text-lg font-bold font-mono text-rose-700">{customer.cancelled_orders}</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Rata-Rata Order (AOV)</span>
              <span className="text-sm font-bold font-mono text-stone-900 truncate block">
                {formatRupiah(customer.average_order_value)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History (Section 15) */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Riwayat Pembelian &amp; Transaksi</h3>
            <p className="text-xs text-stone-500">
              Daftar seluruh pesanan yang dibuat oleh {customer.name}.
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
            {customer.orders.length} Transaksi
          </span>
        </div>

        {customer.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">No. Pesanan</th>
                  <th className="py-2.5 px-4">Tanggal Transaksi</th>
                  <th className="py-2.5 px-4">Item Komoditas</th>
                  <th className="py-2.5 px-4 text-right">Total Transaksi</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customer.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {o.order_number}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      {o.items && o.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {o.items.slice(0, 2).map((it) => (
                            <div key={it.id} className="text-stone-800">
                              {it.product_name} <span className="text-stone-400 font-mono">x{it.quantity}</span>
                            </div>
                          ))}
                          {o.items.length > 2 && (
                            <span className="text-[10px] text-stone-400">
                              +{o.items.length - 2} produk lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-stone-950 tabular-nums">
                      {formatRupiah(o.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getOrderStatusBadge(o.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/admin/orders/${o.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-400">
            Pelanggan ini belum memiliki riwayat pesanan.
          </div>
        )}
      </div>
    </div>
  );
};
