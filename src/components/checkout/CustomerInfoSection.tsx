import React from 'react';
import { User, MessageSquare, Mail, LogIn, CheckCircle2 } from 'lucide-react';

interface CustomerInfoSectionProps {
  fullName: string;
  phone: string;
  email: string;
  onChangeFullName: (value: string) => void;
  onChangePhone: (value: string) => void;
  onChangeEmail: (value: string) => void;
  isLoggedIn: boolean;
  userEmail?: string;
  onOpenLogin: () => void;
  errors?: Record<string, string>;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  fullName,
  phone,
  email,
  onChangeFullName,
  onChangePhone,
  onChangeEmail,
  isLoggedIn,
  userEmail,
  onOpenLogin,
  errors = {},
}) => {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            Informasi Pemesan
          </h2>
        </div>

        {isLoggedIn ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{userEmail}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-800 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Akun</span>
          </button>
        )}
      </div>

      {!isLoggedIn && (
        <div className="p-3 bg-stone-50 border border-stone-200/70 rounded-lg flex items-center justify-between gap-3 text-xs">
          <span className="text-stone-600">
            Checkout sebagai tamu atau login untuk kemudahan menyimpan alamat.
          </span>
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-stone-900 font-semibold underline shrink-0 hover:text-stone-700"
          >
            Masuk
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Nama Lengkap Pemesan <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => onChangeFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                errors.fullName ? 'border-rose-400 focus:ring-1 focus:ring-rose-200' : 'border-stone-200 focus:border-stone-400'
              }`}
            />
          </div>
          {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
        </div>

        {/* WhatsApp Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => onChangePhone(e.target.value)}
              placeholder="081234567890"
              className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                errors.phone ? 'border-rose-400 focus:ring-1 focus:ring-rose-200' : 'border-stone-200 focus:border-stone-400'
              }`}
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            Untuk konfirmasi pesanan dan update kurir ekspedisi.
          </p>
          {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Alamat Email (Opsional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            Salinan bukti pesanan akan dikirimkan ke email ini.
          </p>
        </div>
      </div>
    </div>
  );
};
