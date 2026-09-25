import React, { useState, useEffect } from 'react';
import {
  InventoryStockItem,
  InventoryMovement,
  InventoryMovementType,
} from '../../types';
import {
  getInventorySummary,
  adjustStock,
  getInventoryMovements,
} from '../../services/inventoryService';
import { getCurrentAdminUser } from '../../services/adminUserService';
import { formatDateTime } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../components/common/Toast';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ArrowUpDown,
  History,
  ShieldCheck,
  Package,
  Layers,
  X,
  Loader2,
} from 'lucide-react';

interface AdminInventoryPageProps {
  onNavigate: (path: string) => void;
}

export const AdminInventoryPage: React.FC<AdminInventoryPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [items, setItems] = useState<InventoryStockItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    reservedStockCount: 0,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Adjustment Modal State
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustType, setAdjustType] = useState<InventoryMovementType>('restock');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, movs] = await Promise.all([
        getInventorySummary(),
        getInventoryMovements({ limit: 100 }),
      ]);
      setItems(sum.items);
      setMovements(movs);
      setSummaryMetrics({
        totalProducts: sum.total_products,
        totalStock: sum.total_stock,
        lowStockCount: sum.low_stock_count,
        outOfStockCount: sum.out_of_stock_count,
        reservedStockCount: sum.reserved_stock_count,
      });
      if (sum.items.length > 0 && !selectedProductId) {
        setSelectedProductId(sum.items[0].product.id);
      }
    } catch (e) {
      console.error('Failed loading inventory data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjustModal = (productId?: string) => {
    if (productId) setSelectedProductId(productId);
    setAdjustType('restock');
    setAdjustQty(10);
    setAdjustReason('');
    setAdjustmentModalOpen(true);
  };

  const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      error('Silakan pilih produk yang akan disesuaikan.');
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 3) {
      error('Alasan penyesuaian stok wajib diisi (minimal 3 karakter).');
      return;
    }
    if (adjustQty === 0) {
      error('Jumlah perubahan stok tidak boleh 0.');
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const actor = getCurrentAdminUser();
      // If adjustment or return or sale, determine sign
      let delta = adjustQty;
      if (adjustType === 'adjustment' && adjustQty < 0) {
        delta = adjustQty;
      } else if (adjustType === 'sale' && adjustQty > 0) {
        delta = -adjustQty;
      }

      await adjustStock({
        product_id: selectedProductId,
        quantity_delta: delta,
        type: adjustType,
        reason: adjustReason.trim(),
        actor,
      });

      success('Mutasi stok berhasil dicatat ke sistem audit.');
      setAdjustmentModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal menyesuaikan stok.');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.product.name.toLowerCase().includes(search.toLowerCase()) ||
      it.product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || it.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Tersedia</span>
          </span>
        );
      case 'low_stock':
        return (
          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Stok Menipis</span>
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Habis (0)</span>
          </span>
        );
    }
  };

  const getMovementTypeBadge = (type: InventoryMovementType) => {
    switch (type) {
      case 'restock':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Restock (+)</span>;
      case 'sale':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">Penjualan (-)</span>;
      case 'adjustment':
        return <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">Penyesuaian Manual</span>;
      case 'return':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">Retur Pelanggan</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-bold">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Adjustment Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Manajemen Inventaris &amp; Kontrol Stok</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitoring stok gudang, batas minimum persediaan, dan audit mutasi barang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAdjustModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Penyesuaian Stok (Audit)</span>
        </button>
      </div>

      {/* Summary KPI Cards (Section 29, 30, 31) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Produk</span>
          <span className="text-2xl font-bold font-mono text-stone-900">{summaryMetrics.totalProducts}</span>
          <span className="text-[10px] text-stone-500 block">SKU Komoditas</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Stok Fisik</span>
          <span className="text-2xl font-bold font-mono text-stone-900">{summaryMetrics.totalStock}</span>
          <span className="text-[10px] text-stone-500 block">Unit Keseluruhan</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Stok Menipis</span>
          <span className="text-2xl font-bold font-mono text-amber-700">{summaryMetrics.lowStockCount}</span>
          <span className="text-[10px] text-stone-500 block">&le; Batas Minimum</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Habis (Out of Stock)</span>
          <span className="text-2xl font-bold font-mono text-rose-700">{summaryMetrics.outOfStockCount}</span>
          <span className="text-[10px] text-stone-500 block">Stok = 0</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-1 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Stok Reserved</span>
          <span className="text-2xl font-bold font-mono text-stone-900">{summaryMetrics.reservedStockCount}</span>
          <span className="text-[10px] text-stone-500 block">Pending Alokasi</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'stock'
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              Daftar Stok Produk ({filteredItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'movements'
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100'
              }`}
            >
              Riwayat Mutasi &amp; Audit ({movements.length})
            </button>
          </div>

          {activeTab === 'stock' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari komoditas atau SKU..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="in_stock">Tersedia</option>
                <option value="low_stock">Stok Menipis</option>
                <option value="out_of_stock">Stok Habis</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Current Stock Table (Section 32) */}
        {activeTab === 'stock' && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center">
                <LoadingState message="Memuat inventaris produk..." />
              </div>
            ) : filteredItems.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Produk Komoditas</th>
                    <th className="py-3 px-4">SKU &amp; Kategori</th>
                    <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-center">Reserved</th>
                    <th className="py-3 px-4 text-center">Stok Tersedia</th>
                    <th className="py-3 px-4 text-center">Batas Minimum</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.map((it) => (
                    <tr key={it.product.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{it.product.name}</div>
                        <div className="text-[10px] text-stone-400">Satuan: {it.product.unit || 'pcs'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        <div>{it.product.sku}</div>
                        <div className="text-[10px] font-sans text-stone-400">
                          {it.product.category?.name || 'Komoditas Pangan'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-stone-900 text-sm">
                        {it.current_stock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-stone-500">
                        {it.reserved_stock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800 text-sm">
                        {it.available_stock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-stone-500">
                        {it.low_stock_threshold}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(it.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjustModal(it.product.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:text-stone-900 border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                Tidak ada data stok yang cocok dengan pencarian.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inventory Movements & Audit History (Section 33 & 34) */}
        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            {movements.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Tipe Mutasi</th>
                    <th className="py-3 px-4 text-center">Perubahan</th>
                    <th className="py-3 px-4 text-center">Sebelum &rarr; Sesudah</th>
                    <th className="py-3 px-4">Catatan / Alasan</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                        {formatDateTime(m.created_at)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {m.product_name || m.product_id}
                        {m.product_sku && (
                          <span className="block text-[10px] font-mono text-stone-400">{m.product_sku}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getMovementTypeBadge(m.type)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={m.quantity >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-stone-700">
                        {m.previous_stock} &rarr; <span className="font-bold text-stone-900">{m.new_stock}</span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 max-w-xs truncate">
                        {m.note || '-'}
                        {m.reference_id && (
                          <span className="block text-[10px] font-mono text-stone-400">Ref: {m.reference_id}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-medium">
                        {m.created_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                Belum ada riwayat mutasi stok yang tercatat.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Stock Adjustment Modal (Section 35 & 36) */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => !isSubmittingAdjustment && setAdjustmentModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-800" />
                <h3 className="font-bold text-stone-900 text-sm">Penyesuaian Stok Manual (Audit Trail)</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Pilih Produk Komoditas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden"
                >
                  {items.map((it) => (
                    <option key={it.product.id} value={it.product.id}>
                      {it.product.name} ({it.product.sku}) — Stok Sekarang: {it.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Tipe Mutasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden"
                  >
                    <option value="restock">Restock Masuk (+)</option>
                    <option value="adjustment">Penyesuaian Fisik Opname (+/-)</option>
                    <option value="return">Retur dari Pelanggan (+)</option>
                    <option value="sale">Pengeluaran Penjualan (-)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Jumlah Perubahan (Delta) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                    placeholder="Contoh: 100 atau -5"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-900 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Gunakan tanda minus (-) untuk pengurangan stok fisik.
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Alasan Penyesuaian (Wajib Diisi) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Restock kiriman batch supplier, Rusak/bocor saat handling, Kadaluarsa, Hasil stock opname akhir bulan..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  Sesuai aturan keamanan bisnis, setiap perubahan stok akan dicatat dalam audit log admin dan tidak dapat diubah tanpa jejak riwayat.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingAdjustment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Simpan Mutasi Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
