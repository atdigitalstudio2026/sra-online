import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShippingMethod } from '../types';

const LOCAL_SHIPPING_KEY = 'fmcg_shipping_methods';

const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    name: 'Regular',
    code: 'REG',
    description: 'Layanan pengiriman standar reguler terpercaya ke seluruh wilayah.',
    price: 15000,
    estimated_days: '2-4 hari',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    name: 'Express',
    code: 'EXP',
    description: 'Pengiriman cepat prioritas untuk kebutuhan mendesak / bahan segar.',
    price: 25000,
    estimated_days: '1-2 hari',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    name: 'Cargo',
    code: 'CARGO',
    description: 'Ekspedisi kargo khusus muatan tonase besar, karungan, dan kartonan bisnis.',
    price: 50000,
    estimated_days: '3-7 hari',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocalShippingMethods(): ShippingMethod[] {
  try {
    const raw = localStorage.getItem(LOCAL_SHIPPING_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading shipping methods from localStorage', e);
  }
  return DEFAULT_SHIPPING_METHODS;
}

function saveLocalShippingMethods(methods: ShippingMethod[]) {
  try {
    localStorage.setItem(LOCAL_SHIPPING_KEY, JSON.stringify(methods));
  } catch (e) {
    console.warn('Failed saving shipping methods to localStorage', e);
  }
}

export async function getShippingMethods(includeInactive = false): Promise<ShippingMethod[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('shipping_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ShippingMethod[];
      }
    } catch (e) {
      console.warn('Supabase getShippingMethods failed, using local fallback:', e);
    }
  }

  const local = getLocalShippingMethods();
  return includeInactive ? local : local.filter((m) => m.is_active);
}

export async function getShippingMethodById(id: string): Promise<ShippingMethod | null> {
  const all = await getShippingMethods(true);
  return all.find((m) => m.id === id) || null;
}

export async function createShippingMethod(
  payload: Omit<ShippingMethod, 'id' | 'created_at' | 'updated_at'>
): Promise<ShippingMethod> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const newMethod: ShippingMethod = {
    ...payload,
    id,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .insert(newMethod)
        .select()
        .single();

      if (!error && data) {
        return data as ShippingMethod;
      }
    } catch (e) {
      console.warn('Supabase createShippingMethod failed, using local:', e);
    }
  }

  const list = getLocalShippingMethods();
  list.push(newMethod);
  saveLocalShippingMethods(list);
  return newMethod;
}

export async function updateShippingMethod(
  id: string,
  updates: Partial<ShippingMethod>
): Promise<ShippingMethod | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as ShippingMethod;
      }
    } catch (e) {
      console.warn('Supabase updateShippingMethod failed, using local:', e);
    }
  }

  const list = getLocalShippingMethods();
  const idx = list.findIndex((m) => m.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    saveLocalShippingMethods(list);
    return list[idx];
  }
  return null;
}

export async function deleteShippingMethod(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('shipping_methods').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteShippingMethod failed, using local:', e);
    }
  }

  const list = getLocalShippingMethods();
  const filtered = list.filter((m) => m.id !== id);
  saveLocalShippingMethods(filtered);
  return true;
}

export async function toggleShippingMethodActive(
  id: string,
  currentStatus: boolean
): Promise<boolean> {
  const newStatus = !currentStatus;
  await updateShippingMethod(id, { is_active: newStatus });
  return newStatus;
}
