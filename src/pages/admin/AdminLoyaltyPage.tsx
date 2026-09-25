import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Coins,
  Ticket,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
} from 'lucide-react';
import {
  getAdminLoyaltyStats,
  adminAdjustPoints,
  getLoyaltySettings,
  updateLoyaltySettings,
  getLoyaltyRewards,
} from '../../services/loyaltyService';
import { getCustomers } from '../../services/customerService';
import { LoyaltyReward, LoyaltySettings } from '../../types';
import { useToast } from '../../components/common/Toast';
import { formatRupiah } from '../../utils/formatters';

interface AdminLoyaltyPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoyaltyPage: React.FC<AdminLoyaltyPageProps> = () => {
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<LoyaltySettings>(getLoyaltySettings());
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, rew, cust] = await Promise.all([
        getAdminLoyaltyStats(),
        getLoyaltyRewards(),
        getCustomers(),
      ]);
      setStats(st);
      setRewards(rew);
      setCustomers(cust);
      setSettings(getLoyaltySettings());
    } catch {
      error('Gagal memuat data program loyalitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      error('Pilih pelanggan terlebih dahulu.');
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      error('Alasan penyesuaian poin wajib diisi minimal 5 karakter.');
      return;
    }

    setSubmittingAdjust(true);
    try {
      const res = await adminAdjustPoints(
        targetUserId,
        adjustPoints,
        adjustReason.trim(),
        'Admin Toko'
      );
      if (res.success) {
        success(res.message);
        setAdjustmentModalOpen(false);
        setAdjustReason('');
        loadData();
      } else {
        error(res.message);
      }
    } catch {
      error('Gagal memproses penyesuaian poin.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = updateLoyaltySettings({
        points_per_currency: Number(settings.points_per_currency) || 10000,
        minimum_redeem_points: Number(settings.minimum_redeem_points) || 10,
        expiration_enabled: settings.expiration_enabled,
      });
      setSettings(updated);
      success('Pengaturan poin loyalitas berhasil disimpan.');
    } catch {
      error('Gagal menyimpan pengaturan.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Adjust Action */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Manajemen Program Loyalitas & Reward Poin
          </h2>
          <p className="text-xs text-stone-500">
            Pantau perolehan poin pelanggan, konfigurasi aturan reward, dan penyesuaian poin (adjustment).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (customers.length > 0) setTargetUserId(customers[0].id);
            setAdjustmentModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Penyesuaian Poin Manual</span>
        </button>
      </div>

      {/* KPI Overview Grid (Rule 52) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Total Anggota
            </span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
            {stats?.total_members || customers.length || 0}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Pelanggan terdaftar</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Poin Diterbitkan
            </span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
            {stats?.total_points_issued || 0}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Dari transaksi lunas</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Poin Ditebus
            </span>
            <Ticket className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
            {stats?.total_points_redeemed || 0}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Ditukar ke voucher</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Saldo Beredar
            </span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-800 font-mono">
            {stats?.outstanding_points || 0}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Poin aktif di member</span>
        </div>
      </div>

      {/* Loyalty Settings & Rules Configuration (Rule 41 & 56) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-1">
          Konfigurasi Aturan Poin (Loyalty Rules)
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Atur rasio perolehan poin per nominal rupiah transaksi belanja yang terbayar.
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Rasio Nilai Belanja per 1 Poin (IDR)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={settings.points_per_currency}
                onChange={(e) =>
                  setSettings({ ...settings, points_per_currency: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono outline-hidden"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Default: Rp10.000 = 1 Poin Loyalitas
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Batas Minimum Poin untuk Redeem
              </label>
              <input
                type="number"
                min="1"
                value={settings.minimum_redeem_points}
                onChange={(e) =>
                  setSettings({ ...settings, minimum_redeem_points: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono outline-hidden"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Batas saldo poin sebelum penukaran
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Masa Berlaku Poin (Kadaluarsa)
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="expiration-toggle"
                  checked={settings.expiration_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, expiration_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-900 rounded-md border-stone-300"
                />
                <label htmlFor="expiration-toggle" className="text-xs text-stone-700 cursor-pointer">
                  Aktifkan masa kadaluarsa 12 bulan
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Aturan Poin</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rewards Catalog Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Katalog Reward Loyalitas</h3>
            <p className="text-xs text-stone-500">Reward yang dapat ditukar oleh pelanggan dengan poin.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Reward</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Poin Diperlukan</th>
                <th className="py-3 px-4">Nilai Reward</th>
                <th className="py-3 px-4">Sisa Stok</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rewards.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/60">
                  <td className="py-3.5 px-4 font-bold text-stone-800">{r.name}</td>
                  <td className="py-3.5 px-4 uppercase text-stone-500 text-[11px] font-mono">
                    {r.reward_type}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                    {r.points_required} Poin
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-700">
                    {formatRupiah(r.reward_value)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-600">{r.stock} voucher</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Points Adjustment Modal (Rule 53) */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Penyesuaian Poin Manual (Admin Adjustment)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Aksi ini akan dicatat ke dalam audit log keamanan dan buku besar mutasi pelanggan.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pilih Pelanggan *
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.email} ({c.phone || c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Jumlah Poin (Gunakan angka minus untuk pengurangan) *
                </label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(Number(e.target.value))}
                  placeholder="Misal: 50 atau -20"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alasan Penyesuaian (Wajib untuk Audit Log) *
                </label>
                <textarea
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Misal: Kompensasi keterlambatan kurir pesanan #ORD-001..."
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingAdjust ? 'Menyimpan...' : 'Terapkan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
