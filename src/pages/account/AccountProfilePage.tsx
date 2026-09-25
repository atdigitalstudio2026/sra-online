import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { CustomerProfile } from '../../types';
import {
  getCustomerProfile,
  updateCustomerProfile,
  uploadAvatar,
} from '../../services/customerProfileService';
import { useToast } from '../../components/common/Toast';
import { User, Mail, Phone, Calendar, Upload, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AccountProfilePageProps {
  onNavigate: (path: string) => void;
}

export const AccountProfilePage: React.FC<AccountProfilePageProps> = () => {
  const { user } = useCart();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const { success, error } = useToast();

  useEffect(() => {
    async function load() {
      if (user?.id) {
        setLoading(true);
        try {
          const p = await getCustomerProfile(user.id);
          if (p) {
            setProfile(p);
            setFullName(p.full_name || user.name || '');
            setEmail(p.email || user.email || '');
            setPhone(p.phone || '');
            setDob(p.date_of_birth || '');
            setGender(p.gender || '');
            setAvatarUrl(p.avatar_url || '');
          }
        } catch (e) {
          console.warn('Failed loading customer profile', e);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      error('Ukuran foto profil maksimal 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
      success('Foto avatar berhasil diunggah.');
    } catch {
      error('Gagal mengunggah foto profil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!fullName.trim()) {
      error('Nama lengkap wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCustomerProfile(user.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date_of_birth: dob || null,
        gender: (gender as any) || null,
        avatar_url: avatarUrl || null,
      });

      setProfile(updated);
      success('Profil pelanggan berhasil diperbarui!');
    } catch {
      error('Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4 animate-pulse">
        <div className="w-20 h-20 bg-stone-200 rounded-2xl" />
        <div className="h-10 bg-stone-200 rounded-xl" />
        <div className="h-10 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Avatar Upload Slot (Rule 7) */}
        <div>
          <label className="block text-xs font-bold text-stone-900 mb-3">Foto Profil</label>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border border-stone-200 shadow-xs"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-amber-900 text-white font-bold text-2xl flex items-center justify-center">
                {fullName.charAt(0).toUpperCase() || 'P'}
              </div>
            )}

            <div>
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingAvatar ? 'Mengunggah...' : 'Pilih Foto Baru'}</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
              <p className="text-[11px] text-stone-400 mt-1.5">
                Format JPG, PNG, atau WebP. Maksimal 2MB. Disimpan di Supabase Storage.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>Nama Lengkap *</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-900 outline-hidden"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>Alamat Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-900 outline-hidden"
            />
          </div>

          {/* Phone (WhatsApp) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>Nomor WhatsApp / Kontak</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-900 outline-hidden"
            />
          </div>

          {/* Date of Birth (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Tanggal Lahir (Opsional)</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-900 outline-hidden"
            />
          </div>

          {/* Gender (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Jenis Kelamin (Opsional)
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-amber-900 outline-hidden"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="male">Laki-Laki</option>
              <option value="female">Perempuan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          {/* Account Security Info (Rule 6) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tingkat Harga Akun</span>
            </label>
            <div className="px-3.5 py-2.5 bg-stone-100 rounded-xl text-xs font-medium text-stone-600">
              {profile?.price_level_id ? 'Anggota B2B Terverifikasi' : 'Harga Eceran (Reguler)'}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Tingkat harga ditentukan otomatis oleh admin verifikator.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
