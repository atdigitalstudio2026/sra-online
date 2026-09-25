import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Banner, BannerPosition, BannerEvent, BannerMetrics } from '../types';
import { getAnonymousSessionId } from '../utils/marketing';
import { logAdminAction } from './auditLogService';

const LOCAL_BANNERS_KEY = 'fmcg_banners';
const LOCAL_BANNER_EVENTS_KEY = 'fmcg_banner_events';

// Default initial banners
export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'ban-1',
    title: 'Festival Komoditas Pangan Pilihan',
    subtitle: 'Pasokan Kurma Ajwa, Biji Wijen, & Rempah Nusantara Mutu Ekspor',
    image_url: 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=800&q=80',
    link_url: '/products',
    button_text: 'Jelajahi Katalog',
    position: 'homepage_hero',
    start_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),  // 30 days ahead
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ban-2',
    title: 'Diskon Spesial Grosir Wijen & Kacang Pangan',
    subtitle: 'Harga Bertingkat Otomatis untuk Kebutuhan Industri Bakery & Horeca',
    image_url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80',
    link_url: '/category/wijen',
    button_text: 'Lihat Penawaran',
    position: 'homepage_secondary',
    start_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ban-3',
    title: 'Promo Spesial Musim Pangan Berkah',
    subtitle: 'Dapatkan Voucher Potongan Ongkir & Diskon Tambahan untuk Pesanan Jumlah Besar',
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    link_url: '/promo/ramadan',
    button_text: 'Buka Halaman Promo',
    position: 'promotion',
    start_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocalBanners(): Banner[] {
  try {
    const raw = localStorage.getItem(LOCAL_BANNERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading banners from localStorage', e);
  }
  localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(INITIAL_BANNERS));
  return INITIAL_BANNERS;
}

function saveLocalBanners(list: Banner[]) {
  try {
    localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed saving banners to localStorage', e);
  }
}

function getLocalBannerEvents(): BannerEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalBannerEvents(list: BannerEvent[]) {
  try {
    localStorage.setItem(LOCAL_BANNER_EVENTS_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Fetch all banners for Admin with sorting
 */
export async function getAllBanners(): Promise<Banner[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Banner[];
      }
    } catch (e) {
      console.warn('Supabase getAllBanners failed, using local:', e);
    }
  }

  return getLocalBanners().sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Fetch active, schedule-valid banners for a specific position (Section 23, 24)
 * Banner is only visible if:
 * 1. is_active === true
 * 2. start_at <= now <= end_at
 */
export async function getActiveBannersForPosition(position: BannerPosition): Promise<Banner[]> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .lte('start_at', now)
        .gte('end_at', now)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        return data as Banner[];
      }
    } catch (e) {
      console.warn('Supabase getActiveBannersForPosition failed, using local:', e);
    }
  }

  const all = getLocalBanners();
  const nowTime = new Date().getTime();

  return all
    .filter((b) => {
      if (!b.is_active) return false;
      if (b.position !== position) return false;
      const start = new Date(b.start_at).getTime();
      const end = new Date(b.end_at).getTime();
      return nowTime >= start && nowTime <= end;
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Create new banner
 */
export async function createBanner(
  data: Omit<Banner, 'id' | 'created_at' | 'updated_at'>
): Promise<Banner> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const newBanner: Banner = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('banners').insert(newBanner);
    } catch (e) {
      console.warn('Supabase createBanner failed:', e);
    }
  }

  const list = getLocalBanners();
  list.push(newBanner);
  saveLocalBanners(list);

  await logAdminAction(
    'system_admin',
    'create_banner',
    'banners',
    id,
    `Banner baru dibuat: "${newBanner.title}" (Posisi: ${newBanner.position})`
  );

  return newBanner;
}

/**
 * Update banner
 */
export async function updateBanner(
  id: string,
  updates: Partial<Banner>
): Promise<Banner> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('banners').update({ ...updates, updated_at: now }).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateBanner failed:', e);
    }
  }

  const list = getLocalBanners();
  const idx = list.findIndex((b) => b.id === id);
  if (idx === -1) {
    throw new Error('Banner tidak ditemukan.');
  }

  const updated: Banner = {
    ...list[idx],
    ...updates,
    updated_at: now,
  };
  list[idx] = updated;
  saveLocalBanners(list);

  await logAdminAction(
    'system_admin',
    'update_banner',
    'banners',
    id,
    `Banner diperbarui: "${updated.title}" (Status: ${updated.is_active ? 'Aktif' : 'Non-aktif'})`
  );

  return updated;
}

/**
 * Delete banner
 */
export async function deleteBanner(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('banner_events').delete().eq('banner_id', id);
      await supabase.from('banners').delete().eq('id', id);
    } catch {}
  }

  const list = getLocalBanners().filter((b) => b.id !== id);
  saveLocalBanners(list);

  const events = getLocalBannerEvents().filter((e) => e.banner_id !== id);
  saveLocalBannerEvents(events);

  await logAdminAction('system_admin', 'delete_banner', 'banners', id, `Banner dihapus (ID: ${id})`);
  return true;
}

/**
 * Record Banner Event (View or Click - Section 46)
 * Debounced / lightweight event tracking
 */
const viewLoggedSet = new Set<string>();

export async function recordBannerEvent(
  bannerId: string,
  eventType: 'view' | 'click',
  userId?: string | null
): Promise<void> {
  const sessionId = getAnonymousSessionId();

  // Deduplicate view events within the same session
  if (eventType === 'view') {
    const key = `${sessionId}_${bannerId}_view`;
    if (viewLoggedSet.has(key)) return;
    viewLoggedSet.add(key);
  }

  const event: BannerEvent = {
    id: crypto.randomUUID(),
    banner_id: bannerId,
    event_type: eventType,
    session_id: sessionId,
    user_id: userId || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('banner_events').insert(event);
    } catch {}
  }

  const list = getLocalBannerEvents();
  list.push(event);
  if (list.length > 2000) {
    list.splice(0, list.length - 2000);
  }
  saveLocalBannerEvents(list);
}

/**
 * Calculate Banner Metrics & CTR (Section 47)
 * Formula: CTR = Clicks / Views * 100
 * If views = 0, CTR = 0
 */
export async function getBannerMetrics(): Promise<BannerMetrics[]> {
  const banners = await getAllBanners();
  let events = getLocalBannerEvents();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase.from('banner_events').select('*');
      if (data && data.length > 0) {
        events = data as BannerEvent[];
      }
    } catch {}
  }

  return banners.map((b) => {
    const bannerEvents = events.filter((e) => e.banner_id === b.id);
    const views = bannerEvents.filter((e) => e.event_type === 'view').length;
    const clicks = bannerEvents.filter((e) => e.event_type === 'click').length;
    const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0;

    return {
      banner_id: b.id,
      title: b.title,
      position: b.position,
      views,
      clicks,
      ctr,
    };
  });
}
