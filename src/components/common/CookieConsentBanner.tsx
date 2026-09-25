import React, { useState, useEffect } from 'react';
import { getCookieConsentStatus, setCookieConsentStatus } from '../../utils/marketing';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const status = getCookieConsentStatus();
    if (status === 'pending') {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setCookieConsentStatus('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    setCookieConsentStatus('declined');
    setVisible(false);
  };

  return (
    <aside
      aria-label="Persetujuan Privasi & Cookie"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 bg-stone-900/95 text-white backdrop-blur-md border-t border-stone-800 shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-300 space-y-1">
            <span className="font-semibold text-white block">
              Persetujuan Privasi & Pengalaman Belanja Pangan
            </span>
            <p className="leading-relaxed">
              Kami menggunakan cookie fungsional serta analitik performa anonim (tanpa pengumpulan data sensitif pribadi) untuk menghadirkan rekomendasi komoditas pangan terbaik, kelancaran keranjang belanja, serta transparansi pelacakan pesanan Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleDecline}
            className="px-3.5 py-1.5 text-xs text-stone-400 hover:text-white font-medium rounded-lg transition-colors border border-stone-700 hover:border-stone-600"
          >
            Hanya Esensial
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg shadow-sm transition-all"
          >
            Setujui Semua
          </button>
        </div>
      </div>
    </aside>
  );
};
