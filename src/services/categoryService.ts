import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category } from '../types';
import { INITIAL_CATEGORIES } from './seedData';
import { autoSeedIfDatabaseEmpty } from './databaseSyncService';

const LOCAL_STORAGE_KEY = 'fmcg_categories';

function getLocalCategories(): Category[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading categories from localStorage', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return INITIAL_CATEGORIES;
}

function saveLocalCategories(categories: Category[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed saving categories to localStorage', e);
  }
}

export async function getCategories(includeInactive = false): Promise<Category[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getCategories error, falling back to local:', error.message);
      const locals = getLocalCategories();
      return includeInactive ? locals : locals.filter((c) => c.is_active);
    }

    if (data && data.length > 0) {
      return data;
    }

    // If table is empty, trigger autoSeed in background and return local categories
    autoSeedIfDatabaseEmpty().catch(() => {});
    const locals = getLocalCategories();
    return includeInactive ? locals : locals.filter((c) => c.is_active);
  }

  const locals = getLocalCategories();
  return includeInactive ? locals : locals.filter((c) => c.is_active);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.warn('Supabase getCategoryBySlug error:', error.message);
      const locals = getLocalCategories();
      return locals.find((c) => c.slug === slug) || null;
    }
    return data;
  }

  const locals = getLocalCategories();
  return locals.find((c) => c.slug === slug) || null;
}

export async function createCategory(cat: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const newCategory: Category = {
    ...cat,
    id: newId,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .insert(newCategory)
      .select()
      .single();

    if (error) throw new Error(`Gagal membuat kategori: ${error.message}`);
    return data;
  }

  const locals = getLocalCategories();
  const updated = [...locals, newCategory];
  saveLocalCategories(updated);
  return newCategory;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Gagal memperbarui kategori: ${error.message}`);
    return data;
  }

  const locals = getLocalCategories();
  const index = locals.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Kategori tidak ditemukan');
  const updatedCat: Category = { ...locals[index], ...updates, updated_at: now };
  locals[index] = updatedCat;
  saveLocalCategories(locals);
  return updatedCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(`Gagal menghapus kategori: ${error.message}`);
    return true;
  }

  const locals = getLocalCategories();
  const filtered = locals.filter((c) => c.id !== id);
  saveLocalCategories(filtered);
  return true;
}
