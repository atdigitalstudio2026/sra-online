import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { X, User, LogIn, CheckCircle2, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, logout, isSyncing } = useCart();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }
    setErrorMsg('');
    await login(email.trim(), name.trim() || undefined);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-700 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          <div className="text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Akun Terhubung
              </h3>
              <p className="text-xs text-stone-500 mt-1">{user.email}</p>
              {user.name && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {user.name}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Keranjang belanja Anda tersimpan aman dan terikat dengan akun ini.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Keluar dari Akun (Mode Tamu)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Masuk / Hubungkan Akun</h3>
                <p className="text-[11px] text-stone-500">
                  Keranjang tamu akan otomatis digabungkan (*cart merge*).
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-md">{errorMsg}</p>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alamat Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Lengkap (Opsional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Santoso"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              {isSyncing ? 'Menghubungkan...' : 'Masuk & Sinkronkan Keranjang'}
            </button>

            <div className="pt-2 text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-stone-400" />
              <span>Dukungan Supabase Auth & Session Merging</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
