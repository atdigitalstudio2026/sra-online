import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setDismissed(false);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;
  if (dismissed && !showRestored) return null;

  return (
    <aside
      aria-label="Status koneksi internet"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90vw] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {!isOnline ? (
        <div className="bg-stone-900/95 text-stone-200 border border-stone-800 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Koneksi Internet Terputus</p>
              <p className="text-[11px] text-stone-400">
                Mode offline aktif. Anda tetap dapat melihat katalog produk tersimpan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-stone-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : showRestored ? (
        <div className="bg-emerald-900/95 text-emerald-100 border border-emerald-800 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Koneksi Kembali Online</p>
            <p className="text-[11px] text-emerald-200">
              Sinkronisasi data keranjang dan harga berhasil dipulihkan.
            </p>
          </div>
        </div>
      ) : null}
    </aside>
  );
};
