import React, { useState } from 'react';
import { Wrench, ShieldCheck, Key, ArrowRight, AlertTriangle } from 'lucide-react';
import { MaintenanceModeConfig } from '../../types';
import { setMaintenanceBypass } from '../../services/maintenanceService';

interface MaintenanceOverlayProps {
  config: MaintenanceModeConfig;
  onBypassed: () => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ config, onBypassed }) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setMaintenanceBypass(keyInput)) {
      onBypassed();
    } else {
      setErrorMsg('Kunci akses (bypass token) tidak valid.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900 text-stone-100 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
            Pemeliharaan Sistem
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyModal(true)}
          className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Akses Pengembang</span>
        </button>
      </div>

      {/* Main Announcement */}
      <div className="max-w-xl w-full mx-auto my-auto text-center py-12">
        <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
          <Wrench className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-4 tracking-tight">
          {config.title}
        </h1>

        <p className="text-sm sm:text-base text-stone-400 leading-relaxed mb-8">
          {config.message}
        </p>

        {config.estimated_end_time && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium mb-8">
            <span>Estimasi Selesai:</span>
            <span className="text-amber-400 font-semibold">{config.estimated_end_time}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-amber-950/20"
          >
            Cek Status Terbaru
          </button>
          <a
            href="mailto:support@fmcgstore.id"
            className="w-full sm:w-auto px-6 py-2.5 border border-stone-700 hover:bg-stone-800 text-stone-300 rounded-xl text-xs transition-colors"
          >
            Hubungi Customer Care
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-stone-500 max-w-4xl w-full mx-auto">
        &copy; {new Date().getFullYear()} Katalog Komoditas FMCG. Seluruh transaksi dan data pelanggan terproteksi enkripsi SSL/TLS.
      </div>

      {/* Bypass Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bypass Token Pengembang</h3>
                <p className="text-xs text-stone-400">Masukkan kunci rahasia untuk mengakses preview toko.</p>
              </div>
            </div>

            <form onSubmit={handleBypassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Bypass Secret Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ketik kunci bypass..."
                  autoFocus
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-lg text-xs text-stone-200 placeholder-stone-600 outline-hidden"
                />
                {errorMsg && (
                  <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <span>Buka Akses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
