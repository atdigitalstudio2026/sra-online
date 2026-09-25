import React, { useState, useEffect, useCallback } from 'react';
import { ShippingMethod } from '../../types';
import {
  getShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethodActive,
} from '../../services/shippingService';
import { formatRupiah } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../components/common/Toast';
import {
  Plus,
  Edit2,
  Trash2,
  Truck,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
} from 'lucide-react';

interface AdminShippingMethodsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminShippingMethodsPage: React.FC<AdminShippingMethodsPageProps> = ({
  onNavigate,
}) => {
  const { success, error } = useToast();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(15000);
  const [estimatedDays, setEstimatedDays] = useState('2-4 hari');
  const [sortOrder, setSortOrder] = useState<number | string>(1);
  const [isActive, setIsActive] = useState(true);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getShippingMethods(true);
      setMethods(data);
    } catch (e) {
      console.error('Failed fetching shipping methods', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setName('');
    setCode('');
    setDescription('');
    setPrice(15000);
    setEstimatedDays('2-4 hari');
    setSortOrder(methods.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: ShippingMethod) => {
    setEditingMethod(m);
    setName(m.name);
    setCode(m.code);
    setDescription(m.description || '');
    setPrice(m.price);
    setEstimatedDays(m.estimated_days);
    setSortOrder(m.sort_order);
    setIsActive(m.is_active);
    setModalOpen(true);
  };

  const handleToggle = async (m: ShippingMethod) => {
    try {
      const newStatus = await toggleShippingMethodActive(m.id, m.is_active);
      setMethods((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, is_active: newStatus } : item))
      );
      success(`Metode "${m.name}" ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (e) {
      error('Gagal mengubah status metode pengiriman.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus metode pengiriman "${name}"?`)) return;
    try {
      await deleteShippingMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
      success(`Metode pengiriman "${name}" berhasil dihapus.`);
    } catch (e) {
      error('Gagal menghapus metode pengiriman.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      error('Nama dan kode kurir wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMethod) {
        await updateShippingMethod(editingMethod.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          price: Number(price) || 0,
          estimated_days: estimatedDays.trim(),
          sort_order: Number(sortOrder) || 1,
          is_active: isActive,
        });
        success(`Metode pengiriman "${name}" berhasil diperbarui.`);
      } else {
        await createShippingMethod({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          price: Number(price) || 0,
          estimated_days: estimatedDays.trim(),
          sort_order: Number(sortOrder) || 1,
          is_active: isActive,
        });
        success(`Metode pengiriman "${name}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
      fetchMethods();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan metode pengiriman.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Metode & Opsi Pengiriman</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Konfigurasi jenis kurir pengiriman komoditas, tarif ongkos kirim, dan estimasi waktu sampai.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Metode Pengiriman</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <LoadingState message="Memuat metode pengiriman..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Urutan</th>
                  <th className="py-3 px-4">Nama Metode</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Ongkos Kirim</th>
                  <th className="py-3 px-4">Estimasi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {methods.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono">{m.sort_order}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-stone-600">{m.code}</td>
                    <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                      {m.description || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-950 tabular-nums">
                      {formatRupiah(m.price)}
                    </td>
                    <td className="py-3 px-4">{m.estimated_days}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(m)}
                        title={m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`p-1 rounded-md transition-colors ${
                          m.is_active
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 fill-current/20" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                {editingMethod ? 'Edit Metode Pengiriman' : 'Tambah Metode Pengiriman'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nama Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kargo Laut, Kurir Instan, Same Day..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Kode Kurir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="REG / EXP"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Tarif Ongkos Kirim (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Estimasi Waktu Sampai
                  </label>
                  <input
                    type="text"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    placeholder="2-4 hari"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Nomor Urut Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Deskripsi Layanan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan armada pengiriman atau ketentuan berat..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-stone-900 border-stone-300"
                />
                <span className="font-semibold text-stone-800">
                  Aktifkan metode pengiriman ini untuk checkout
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-white bg-stone-900 hover:bg-stone-800 rounded-lg font-semibold inline-flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
