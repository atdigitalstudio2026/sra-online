import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { CustomerAddress } from '../../types';
import {
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
} from '../../services/addressService';
import { useToast } from '../../components/common/Toast';
import { MapPin, Plus, Edit2, Trash2, CheckCircle, Home, Briefcase, Warehouse } from 'lucide-react';

interface AccountAddressesPageProps {
  onNavigate: (path: string) => void;
}

export const AccountAddressesPage: React.FC<AccountAddressesPageProps> = () => {
  const { user } = useCart();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('Rumah');
  const [addressLine, setAddressLine] = useState('');
  const [province, setProvince] = useState('Jawa Timur');
  const [city, setCity] = useState('Surabaya');
  const [district, setDistrict] = useState('Gubeng');
  const [subdistrict, setSubdistrict] = useState('Airlangga');
  const [postalCode, setPostalCode] = useState('60286');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const { success, error } = useToast();

  const loadAddresses = async () => {
    if (user?.id) {
      setLoading(true);
      try {
        const list = await getCustomerAddresses(user.id);
        setAddresses(list);
      } catch (e) {
        console.warn('Failed loading addresses', e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const openCreateModal = () => {
    setEditingAddress(null);
    setRecipientName(user?.name || '');
    setPhone('');
    setLabel('Rumah');
    setAddressLine('');
    setProvince('Jawa Timur');
    setCity('Surabaya');
    setDistrict('Gubeng');
    setSubdistrict('Airlangga');
    setPostalCode('60286');
    setDeliveryNote('');
    setIsDefault(addresses.length === 0); // Default if first address
    setShowModal(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setLabel(addr.label);
    setAddressLine(addr.address_line);
    setProvince(addr.province);
    setCity(addr.city);
    setDistrict(addr.district);
    setSubdistrict(addr.subdistrict);
    setPostalCode(addr.postal_code);
    setDeliveryNote(addr.delivery_note || '');
    setIsDefault(addr.is_default);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!recipientName.trim() || !phone.trim() || !addressLine.trim()) {
      error('Mohon lengkapi nama penerima, nomor telepon, dan alamat.');
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        await updateCustomerAddress(editingAddress.id, user.id, {
          recipient_name: recipientName.trim(),
          phone: phone.trim(),
          label,
          address_line: addressLine.trim(),
          province,
          city,
          district,
          subdistrict,
          postal_code: postalCode.trim(),
          delivery_note: deliveryNote.trim() || null,
          is_default: isDefault,
        });
        success('Alamat berhasil diperbarui.');
      } else {
        await createCustomerAddress({
          user_id: user.id,
          recipient_name: recipientName.trim(),
          phone: phone.trim(),
          label,
          address_line: addressLine.trim(),
          province,
          city,
          district,
          subdistrict,
          postal_code: postalCode.trim(),
          delivery_note: deliveryNote.trim() || null,
          is_default: isDefault,
        });
        success('Alamat baru berhasil ditambahkan.');
      }

      setShowModal(false);
      loadAddresses();
    } catch {
      error('Gagal menyimpan alamat.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addrId: string) => {
    if (!user?.id) return;
    if (confirm('Hapus alamat pengiriman ini?')) {
      await deleteCustomerAddress(addrId, user.id);
      success('Alamat berhasil dihapus.');
      loadAddresses();
    }
  };

  const handleSetDefault = async (addrId: string) => {
    if (!user?.id) return;
    await setDefaultAddress(user.id, addrId);
    success('Alamat utama berhasil diperbarui.');
    loadAddresses();
  };

  const getLabelIcon = (lbl: string) => {
    const l = lbl.toLowerCase();
    if (l.includes('kantor')) return <Briefcase className="w-3.5 h-3.5 text-stone-500" />;
    if (l.includes('gudang')) return <Warehouse className="w-3.5 h-3.5 text-stone-500" />;
    return <Home className="w-3.5 h-3.5 text-stone-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">Buku Alamat Pengiriman</h2>
          <p className="text-xs text-stone-500">Kelola lokasi pengiriman pesanan komoditas pangan Anda.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Alamat</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-40 bg-stone-200 rounded-2xl" />
          <div className="h-40 bg-stone-200 rounded-2xl" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <MapPin className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <h4 className="text-xs font-bold text-stone-800">Belum Ada Alamat Tersimpan</h4>
          <p className="text-xs text-stone-400 mt-1 mb-4">
            Tambahkan alamat rumah, toko, atau gudang untuk mempermudah proses checkout.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold"
          >
            Tambah Alamat Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                addr.is_default
                  ? 'border-amber-900 ring-1 ring-amber-900/20 shadow-xs'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    {getLabelIcon(addr.label)}
                    <span>{addr.label}</span>
                  </div>

                  {addr.is_default && (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-sm">
                      Alamat Utama
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-stone-800">{addr.recipient_name}</p>
                <p className="text-xs text-stone-500 mb-2">{addr.phone}</p>
                <p className="text-xs text-stone-600 leading-relaxed mb-1">{addr.address_line}</p>
                <p className="text-[11px] text-stone-400">
                  {addr.subdistrict}, {addr.district}, {addr.city}, {addr.province} {addr.postal_code}
                </p>

                {addr.delivery_note && (
                  <p className="text-[11px] text-amber-800 mt-2 bg-amber-50/50 p-2 rounded-lg">
                    Catatan: {addr.delivery_note}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                {!addr.is_default ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-stone-500 hover:text-stone-900 font-medium"
                  >
                    Jadikan Utama
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Terpilih
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Edit Alamat"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Hapus Alamat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              {editingAddress ? 'Edit Alamat Pengiriman' : 'Tambah Alamat Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Label Alamat
                  </label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                  >
                    <option value="Rumah">Rumah</option>
                    <option value="Kantor">Kantor</option>
                    <option value="Gudang">Gudang / Usaha</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Penerima *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama Lengkap"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alamat Lengkap & Patokan *
                </label>
                <textarea
                  rows={2}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, gang, atau patokan"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kota</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan untuk Kurir (Opsional)
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Misal: Titip di satpam / pagar warna hitam"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is-default-checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-amber-900 rounded-md border-stone-300"
                />
                <label htmlFor="is-default-checkbox" className="text-xs text-stone-700 font-medium cursor-pointer">
                  Jadikan alamat utama pengiriman
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
