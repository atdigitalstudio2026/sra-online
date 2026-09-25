/**
 * Feature Flags Service
 * Controls runtime toggling of advanced system features
 * without redeploying code.
 */

import { FeatureFlag } from '../types';

const FEATURE_FLAGS_KEY = 'fmcg_feature_flags';

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'enable_cod_payment',
    name: 'Metode Pembayaran COD',
    description: 'Mengizinkan pembeli memilih metode pembayaran tunai saat barang tiba (Cash on Delivery).',
    category: 'payment',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    key: 'enable_b2b_wholesale',
    name: 'Tiering Harga Grosir (B2B)',
    description: 'Mengaktifkan tier harga diskon otomatis berdasarkan volume karton/bal untuk pedagang.',
    category: 'catalog',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    key: 'enable_guest_checkout',
    name: 'Checkout Tanpa Akun (Guest)',
    description: 'Memperbolehkan pelanggan checkout instan tanpa registrasi akun sebelumnya.',
    category: 'catalog',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    key: 'enable_marketing_banners',
    name: 'Banner Promosi Dinamis',
    description: 'Menampilkan carousel promo hero dan banner penawaran musiman di halaman katalog.',
    category: 'catalog',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    key: 'enable_rate_limiting',
    name: 'Proteksi Rate Limiting & Anti-Brute Force',
    description: 'Membatasi frekuensi request per alamat IP pada endpoint sensitif (checkout & pembayaran).',
    category: 'security',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    key: 'enable_cache_engine',
    name: 'Akselerasi Cache Memori',
    description: 'Menyimpan respons katalog & metadata di RAM untuk kecepatan akses halaman sub-100ms.',
    category: 'performance',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
  {
    key: 'enable_sensitive_masking',
    name: 'Sensor Data Pribadi (Data Masking)',
    description: 'Menyamarkan nomor WhatsApp dan alamat email pembeli untuk staf gudang & operator.',
    category: 'security',
    enabled: true,
    updated_at: new Date().toISOString(),
  },
];

export function getFeatureFlags(): FeatureFlag[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
      if (stored) {
        const parsed: FeatureFlag[] = JSON.parse(stored);
        // Merge with defaults in case new flags were introduced
        const map = new Map(DEFAULT_FLAGS.map((f) => [f.key, f]));
        for (const item of parsed) {
          if (map.has(item.key)) {
            map.set(item.key, { ...map.get(item.key)!, ...item });
          }
        }
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Failed reading feature flags', err);
  }
  return DEFAULT_FLAGS;
}

export function isFeatureEnabled(key: string): boolean {
  const flags = getFeatureFlags();
  const flag = flags.find((f) => f.key === key);
  return flag ? flag.enabled : true;
}

export function toggleFeatureFlag(key: string, enabled: boolean): FeatureFlag[] {
  const current = getFeatureFlags();
  const updated = current.map((f) =>
    f.key === key ? { ...f, enabled, updated_at: new Date().toISOString() } : f
  );

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('fmcg_feature_flags_changed', { detail: updated }));
    }
  } catch (err) {
    console.warn('Failed saving feature flags', err);
  }

  return updated;
}
