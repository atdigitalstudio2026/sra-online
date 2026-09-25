import React, { useState } from 'react';
import { CustomerAddress } from '../../types';
import { MapPin, Home, Building2, Plus, Check } from 'lucide-react';

interface ShippingAddressSectionProps {
  addressLine: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  deliveryNote: string;
  onChangeAddressLine: (v: string) => void;
  onChangeProvince: (v: string) => void;
  onChangeCity: (v: string) => void;
  onChangeDistrict: (v: string) => void;
  onChangeSubdistrict: (v: string) => void;
  onChangePostalCode: (v: string) => void;
  onChangeDeliveryNote: (v: string) => void;
  saveAddress: boolean;
  onChangeSaveAddress: (v: boolean) => void;
  addressLabel: string;
  onChangeAddressLabel: (v: string) => void;
  savedAddresses?: CustomerAddress[];
  onSelectSavedAddress?: (addr: CustomerAddress) => void;
  isLoggedIn: boolean;
  errors?: Record<string, string>;
}

export const ShippingAddressSection: React.FC<ShippingAddressSectionProps> = ({
  addressLine,
  province,
  city,
  district,
  subdistrict,
  postalCode,
  deliveryNote,
  onChangeAddressLine,
  onChangeProvince,
  onChangeCity,
  onChangeDistrict,
  onChangeSubdistrict,
  onChangePostalCode,
  onChangeDeliveryNote,
  saveAddress,
  onChangeSaveAddress,
  addressLabel,
  onChangeAddressLabel,
  savedAddresses = [],
  onSelectSavedAddress,
  isLoggedIn,
  errors = {},
}) => {
  const [isManualInput, setIsManualInput] = useState(savedAddresses.length === 0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    savedAddresses.find((a) => a.is_default)?.id || (savedAddresses[0]?.id || null)
  );

  const handleChooseSaved = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setIsManualInput(false);
    if (onSelectSavedAddress) {
      onSelectSavedAddress(addr);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            Alamat Pengiriman
          </h2>
        </div>

        {isLoggedIn && savedAddresses.length > 0 && (
          <button
            type="button"
            onClick={() => setIsManualInput(!isManualInput)}
            className="text-xs font-semibold text-amber-900 hover:text-amber-800 transition-colors"
          >
            {isManualInput ? 'Gunakan Alamat Tersimpan' : '+ Alamat Baru'}
          </button>
        )}
      </div>

      {/* Saved Addresses list for Logged-In User (Section 8) */}
      {isLoggedIn && savedAddresses.length > 0 && !isManualInput && (
        <div className="space-y-3">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Pilih dari Alamat Tersimpan:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  onClick={() => handleChooseSaved(addr)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-stone-950 ring-2 ring-stone-950/5 bg-stone-50/60 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-800 bg-stone-200/70 px-2 py-0.5 rounded">
                      <Home className="w-3 h-3 text-stone-600" />
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Utama
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-stone-900">{addr.recipient_name}</div>
                  <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                    {addr.address_line}, {addr.city}, {addr.province} {addr.postal_code}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 font-mono">{addr.phone}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual / Fresh Address Input Form */}
      {(isManualInput || !isLoggedIn || savedAddresses.length === 0) && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Alamat Lengkap (Jalan, Nomor, RT/RW, Patokan) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={addressLine}
              onChange={(e) => onChangeAddressLine(e.target.value)}
              placeholder="Contoh: Jl. Ahmad Yani No. 45, RT 03/RW 02, Kompleks Pergudangan Blok B"
              className={`w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                errors.addressLine ? 'border-rose-400 focus:ring-1 focus:ring-rose-200' : 'border-stone-200 focus:border-stone-400'
              }`}
            />
            {errors.addressLine && <p className="text-[11px] text-rose-500 mt-1">{errors.addressLine}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Provinsi */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Provinsi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => onChangeProvince(e.target.value)}
                placeholder="Contoh: Jawa Timur, DKI Jakarta, Jawa Barat..."
                className={`w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                  errors.province ? 'border-rose-400' : 'border-stone-200 focus:border-stone-400'
                }`}
              />
              {errors.province && <p className="text-[11px] text-rose-500 mt-1">{errors.province}</p>}
            </div>

            {/* Kota / Kabupaten */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Kota / Kabupaten <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => onChangeCity(e.target.value)}
                placeholder="Contoh: Surabaya, Jakarta Selatan, Bandung..."
                className={`w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                  errors.city ? 'border-rose-400' : 'border-stone-200 focus:border-stone-400'
                }`}
              />
              {errors.city && <p className="text-[11px] text-rose-500 mt-1">{errors.city}</p>}
            </div>

            {/* Kecamatan */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Kecamatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => onChangeDistrict(e.target.value)}
                placeholder="Contoh: Wonokromo, Tebet, Coblong..."
                className={`w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                  errors.district ? 'border-rose-400' : 'border-stone-200 focus:border-stone-400'
                }`}
              />
              {errors.district && <p className="text-[11px] text-rose-500 mt-1">{errors.district}</p>}
            </div>

            {/* Kelurahan / Kode Pos */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Kelurahan
                </label>
                <input
                  type="text"
                  value={subdistrict}
                  onChange={(e) => onChangeSubdistrict(e.target.value)}
                  placeholder="Kelurahan"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Kode Pos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={postalCode}
                  onChange={(e) => onChangePostalCode(e.target.value)}
                  placeholder="60241"
                  className={`w-full px-3 py-2 text-xs sm:text-sm font-mono bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                    errors.postalCode ? 'border-rose-400' : 'border-stone-200 focus:border-stone-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Catatan untuk Kurir (Section 6) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Catatan Pengiriman untuk Kurir (Opsional)
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => onChangeDeliveryNote(e.target.value)}
              placeholder="Contoh: Titipkan di pos satpam gerbang depan, hubungi sebelum antar"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
          </div>

          {/* Save to account checkbox for logged-in user */}
          {isLoggedIn && (
            <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => onChangeSaveAddress(e.target.checked)}
                  className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-900"
                />
                <span>Simpan alamat ini ke buku alamat akun saya</span>
              </label>

              {saveAddress && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Label:</span>
                  <input
                    type="text"
                    value={addressLabel}
                    onChange={(e) => onChangeAddressLabel(e.target.value)}
                    placeholder="Rumah / Kantor"
                    className="w-28 px-2 py-1 text-xs bg-white border border-stone-200 rounded-md"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
