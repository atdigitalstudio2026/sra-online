import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ToggleLeft,
  ToggleRight,
  Save,
  Key,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MaintenanceModeConfig, FeatureFlag } from '../../types';
import {
  getMaintenanceConfig,
  updateMaintenanceConfig,
} from '../../services/maintenanceService';
import {
  getFeatureFlags,
  toggleFeatureFlag,
} from '../../services/featureFlagService';
import { flushServerCache } from '../../services/systemHealthService';
import { useToast } from '../../components/common/Toast';

interface AdminSystemSettingsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminSystemSettingsPage: React.FC<AdminSystemSettingsPageProps> = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceModeConfig>(getMaintenanceConfig());
  const [flags, setFlags] = useState<FeatureFlag[]>(getFeatureFlags());
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMaintenance(getMaintenanceConfig());
    setFlags(getFeatureFlags());
  }, []);

  const handleMaintenanceToggle = () => {
    const updated = updateMaintenanceConfig({ enabled: !maintenance.enabled });
    setMaintenance(updated);
    showToast(
      updated.enabled
        ? 'Mode Pemeliharaan (Maintenance) DIAKTIFKAN. Pembeli akan melihat layar info.'
        : 'Mode Pemeliharaan DINONAKTIFKAN. Toko kembali melayani pelanggan umum.',
      updated.enabled ? 'info' : 'success'
    );
  };

  const handleSaveMaintenanceDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMaintenance(true);
    try {
      const updated = updateMaintenanceConfig({
        title: maintenance.title,
        message: maintenance.message,
        estimated_end_time: maintenance.estimated_end_time,
        bypass_key: maintenance.bypass_key,
      });
      setMaintenance(updated);
      showToast('Konfigurasi pesan pemeliharaan berhasil disimpan.', 'success');
    } catch {
      showToast('Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleToggleFlag = (key: string, current: boolean) => {
    const nextFlags = toggleFeatureFlag(key, !current);
    setFlags(nextFlags);
    showToast(`Fitur '${key}' berhasil ${!current ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
  };

  const handleRegenerateBypassKey = () => {
    const newKey = `FMCG-SECURE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    setMaintenance({ ...maintenance, bypass_key: newKey });
    updateMaintenanceConfig({ bypass_key: newKey });
    showToast('Kunci bypass pengembang berhasil diperbarui.', 'success');
  };

  const handleClearAllCaches = async () => {
    await flushServerCache();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fmcg_cached_categories');
      localStorage.removeItem('fmcg_cached_brands');
    }
    showToast('Seluruh cache RAM server & browser berhasil dibersihkan.', 'success');
  };

  return (
    <div className="space-y-8">
      {/* 1. Maintenance Mode Section */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                maintenance.enabled
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Mode Pemeliharaan Toko (Maintenance Mode)
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    maintenance.enabled
                      ? 'bg-amber-500 text-stone-950 font-extrabold animate-pulse'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {maintenance.enabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Saat aktif, pengunjung storefront melihat layar maintenance. Akses admin tetap normal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMaintenanceToggle}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              maintenance.enabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-800 hover:bg-amber-900 text-white'
            }`}
          >
            {maintenance.enabled ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Matikan Maintenance</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Nyalakan Maintenance</span>
              </>
            )}
          </button>
        </div>

        {/* Maintenance Config Form */}
        <form onSubmit={handleSaveMaintenanceDetails} className="pt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Judul Pengumuman
            </label>
            <input
              type="text"
              value={maintenance.title}
              onChange={(e) => setMaintenance({ ...maintenance, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Pesan Penjelasan kepada Pelanggan
            </label>
            <textarea
              rows={3}
              value={maintenance.message}
              onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Estimasi Selesai (Opsional)</span>
              </label>
              <input
                type="text"
                value={maintenance.estimated_end_time || ''}
                onChange={(e) =>
                  setMaintenance({ ...maintenance, estimated_end_time: e.target.value })
                }
                placeholder="Contoh: Hari ini, pukul 18:00 WIB (30 menit)"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-stone-400" />
                  <span>Kunci Akses Pengembang (Bypass Key)</span>
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateBypassKey}
                  className="text-[10px] text-amber-700 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Buat Baru
                </button>
              </label>
              <input
                type="text"
                value={maintenance.bypass_key}
                onChange={(e) =>
                  setMaintenance({ ...maintenance, bypass_key: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 font-mono rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-hidden"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingMaintenance}
              className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan Maintenance</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Feature Flags Matrix Section */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>Matriks Fitur Dinamis (Feature Flags)</span>
            </h2>
            <p className="text-xs text-stone-500">
              Kendali sakelar fitur runtime tanpa perlu rebuild atau redeploy server.
            </p>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-bold text-stone-900">{flag.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                    {flag.key}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {flag.category}
                  </span>
                </div>
                <p className="text-xs text-stone-500">{flag.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  flag.enabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {flag.enabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Aktif</span>
                  </>
                ) : (
                  <span>Nonaktif</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Cache & Storage Management */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Manajemen Cache & Purge Memori
            </h2>
            <p className="text-xs text-stone-500">
              Bersihkan seluruh entri cache memori server dan storage lokal browser secara instan jika ada mutasi data mendesak.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearAllCaches}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Semua Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};
