import React, { useState, useEffect, useCallback } from 'react';
import { OrderWithDetails, OrderStatus } from '../../types';
import { getAdminOrders } from '../../services/orderService';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import {
  Search,
  Eye,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Package,
  Calendar,
  CreditCard,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface AdminOrdersPageProps {
  onNavigate: (path: string) => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20); // 20, 50, 100
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [shippingFilter, setShippingFilter] = useState<'all' | 'pending_shipment' | 'processing' | 'shipped' | 'delivered'>('all');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'grand_total' | 'order_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminOrders({
        status: statusFilter,
        payment_status: paymentFilter,
        shipping_status: shippingFilter,
        datePreset,
        startDate: datePreset === 'custom' ? startDate : undefined,
        endDate: datePreset === 'custom' ? endDate : undefined,
        sortBy,
        sortOrder,
        search,
        page,
        limit,
      });
      setOrders(res.orders);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.error('Failed loading admin orders', e);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, paymentFilter, shippingFilter, datePreset, startDate, endDate, sortBy, sortOrder, search, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            Menunggu Pembayaran
          </span>
        );
      case 'processing':
        return (
          <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
            Diproses
          </span>
        );
      case 'shipped':
        return (
          <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
            Dikirim
          </span>
        );
      case 'completed':
        return (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
            Dibatalkan
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === 'paid') {
      return (
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          Lunas
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
        Belum Lunas
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Manajemen Pesanan Pelanggan</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar seluruh pesanan komoditas pangan, status pembayaran, dan progres pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Tampilkan per halaman:</span>
          {[20, 50, 100].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                setLimit(size);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                limit === size
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter Presets (Section 20) */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="text-stone-400 mr-1 text-[11px] uppercase tracking-wider">Periode:</span>
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: '7d', label: '7 Hari Terakhir' },
            { id: '30d', label: '30 Hari Terakhir' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'this_year', label: 'Tahun Ini' },
            { id: 'custom', label: 'Kustom' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setDatePreset(preset.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                datePreset === preset.id
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {datePreset === 'custom' && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-stone-600 font-medium">Rentang Tanggal:</span>
            <div className="flex items-center gap-1.5">
              <label className="text-stone-500">Mulai:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-md font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-stone-500">Sampai:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-md font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar (Section 19 & 22) */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari no. order, nama customer, no. telepon..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-400 font-mono"
          />
        </div>

        {/* Order Status */}
        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
          >
            <option value="all">Semua Status Pesanan</option>
            <option value="pending_payment">Menunggu Pembayaran</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Payment Status */}
        <div className="w-full sm:w-40">
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
          >
            <option value="all">Semua Pembayaran</option>
            <option value="paid">Lunas (Paid)</option>
            <option value="unpaid">Belum Lunas (Unpaid)</option>
          </select>
        </div>

        {/* Shipping Status */}
        <div className="w-full sm:w-40">
          <select
            value={shippingFilter}
            onChange={(e) => {
              setShippingFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
          >
            <option value="all">Semua Pengiriman</option>
            <option value="pending_shipment">Pending Shipment</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="w-full sm:w-44">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb as any);
              setSortOrder(so as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
          >
            <option value="created_at-desc">Tanggal: Terbaru</option>
            <option value="created_at-asc">Tanggal: Terlama</option>
            <option value="grand_total-desc">Nominal: Terbesar</option>
            <option value="grand_total-asc">Nominal: Terkecil</option>
            <option value="order_number-asc">Nomor Order: A-Z</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <LoadingState message="Memuat daftar pesanan..." />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Tidak Ada Pesanan"
            description="Tidak ada data pesanan yang cocok dengan kriteria filter Anda."
            actionLabel="Reset Filter"
            onAction={() => {
              setStatusFilter('all');
              setPaymentFilter('all');
              setShippingFilter('all');
              setDatePreset('all');
              setSearch('');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Tanggal Transaksi</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Pengiriman</th>
                  <th className="py-3 px-4 text-center">Status Pembayaran</th>
                  <th className="py-3 px-4 text-center">Status Pesanan</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{order.customer_name}</div>
                      <div className="text-[11px] font-mono text-stone-500">{order.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      <div className="font-medium text-stone-900">
                        {order.shipping_method?.name || 'Reguler'}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {order.shipping_method?.code || 'REG'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getPaymentBadge(order.payment_status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                      {formatRupiah(order.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/admin/orders/${order.id}`)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Lihat Detail Pesanan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Menampilkan {orders.length} dari {total} total pesanan
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
