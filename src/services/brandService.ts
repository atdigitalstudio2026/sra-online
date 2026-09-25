import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Brand } from '../types';
import { INITIAL_BRANDS } from './seedData';
import { autoSeedIfDatabaseEmpty } from './databaseSyncService';

const LOCAL_STORAGE_KEY = 'fmcg_brands';

function getLocalBrands(): Brand[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading brands from localStorage', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_BRANDS));
  return INITIAL_BRANDS;
}

function saveLocalBrands(brands: Brand[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(brands));
  } catch (e) {
    console.error('Failed saving brands to localStorage', e);
  }
}

export async function getBrands(includeInactive = false): Promise<Brand[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getBrands error, falling back to local:', error.message);
      const locals = getLocalBrands();
      return includeInactive ? locals : locals.filter((b) => b.is_active);
    }

    if (data && data.length > 0) {
      return data;
    }

    // If table is empty, trigger autoSeed in background and return local brands
    autoSeedIfDatabaseEmpty().catch(() => {});
    const locals = getLocalBrands();
    return includeInactive ? locals : locals.filter((b) => b.is_active);
  }

  const locals = getLocalBrands();
  return includeInactive ? locals : locals.filter((b) => b.is_active);
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      const locals = getLocalBrands();
      return locals.find((b) => b.slug === slug) || null;
    }
    return data;
  }

  const locals = getLocalBrands();
  return locals.find((b) => b.slug === slug) || null;
}

export async function createBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>): Promise<Brand> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const newBrand: Brand = {
    ...brand,
    id: newId,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('brands')
      .insert(newBrand)
      .select()
      .single();

    if (error) throw new Error(`Gagal membuat brand: ${error.message}`);
    return data;
  }

  const locals = getLocalBrands();
  const updated = [...locals, newBrand];
  saveLocalBrands(updated);
  return newBrand;
}

export async function updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('brands')
      .update({ ...updates, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Gagal memperbarui brand: ${error.message}`);
    return data;
  }

  const locals = getLocalBrands();
  const index = locals.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Brand tidak ditemukan');
  const updatedBrand: Brand = { ...locals[index], ...updates, updated_at: now };
  locals[index] = updatedBrand;
  saveLocalBrands(locals);
  return updatedBrand;
}

export async function deleteBrand(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw new Error(`Gagal menghapus brand: ${error.message}`);
    return true;
  }

  const locals = getLocalBrands();
  const filtered = locals.filter((b) => b.id !== id);
  saveLocalBrands(filtered);
  return true;
}
