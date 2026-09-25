import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CustomerAddress } from '../types';

const LOCAL_ADDRESSES_KEY = 'fmcg_customer_addresses';

function getLocalAddresses(userId: string): CustomerAddress[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_ADDRESSES_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading addresses from localStorage', e);
  }
  return [];
}

function saveLocalAddresses(userId: string, addresses: CustomerAddress[]) {
  try {
    localStorage.setItem(`${LOCAL_ADDRESSES_KEY}_${userId}`, JSON.stringify(addresses));
  } catch (e) {
    console.warn('Failed saving addresses to localStorage', e);
  }
}

export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  if (!userId) return [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as CustomerAddress[];
      }
    } catch (e) {
      console.warn('Supabase getCustomerAddresses failed, using local:', e);
    }
  }

  return getLocalAddresses(userId);
}

export async function createCustomerAddress(
  payload: Omit<CustomerAddress, 'id' | 'created_at' | 'updated_at'>
): Promise<CustomerAddress> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // If this address is set as default, reset others
  if (payload.is_default) {
    await resetDefaultAddress(payload.user_id);
  }

  const newAddress: CustomerAddress = {
    ...payload,
    id,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert(newAddress)
        .select()
        .single();

      if (!error && data) {
        return data as CustomerAddress;
      }
    } catch (e) {
      console.warn('Supabase createCustomerAddress failed, using local:', e);
    }
  }

  const list = getLocalAddresses(payload.user_id);
  list.unshift(newAddress);
  saveLocalAddresses(payload.user_id, list);
  return newAddress;
}

export async function updateCustomerAddress(
  id: string,
  userId: string,
  updates: Partial<CustomerAddress>
): Promise<CustomerAddress | null> {
  const now = new Date().toISOString();

  if (updates.is_default) {
    await resetDefaultAddress(userId, id);
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (!error && data) {
        return data as CustomerAddress;
      }
    } catch (e) {
      console.warn('Supabase updateCustomerAddress failed, using local:', e);
    }
  }

  const list = getLocalAddresses(userId);
  const idx = list.findIndex((a) => a.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    saveLocalAddresses(userId, list);
    return list[idx];
  }
  return null;
}

export async function deleteCustomerAddress(id: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('customer_addresses').delete().eq('id', id).eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase deleteCustomerAddress failed, using local:', e);
    }
  }

  const list = getLocalAddresses(userId);
  const filtered = list.filter((a) => a.id !== id);
  saveLocalAddresses(userId, filtered);
  return true;
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  await resetDefaultAddress(userId, addressId);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('customer_addresses')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', addressId)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase setDefaultAddress failed, using local:', e);
    }
  }

  const list = getLocalAddresses(userId);
  const updated = list.map((a) => ({
    ...a,
    is_default: a.id === addressId,
  }));
  saveLocalAddresses(userId, updated);
}

async function resetDefaultAddress(userId: string, exceptId?: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      if (exceptId) {
        query = query.neq('id', exceptId);
      }
      await query;
    } catch (e) {
      console.warn('Supabase resetDefaultAddress failed:', e);
    }
  }

  const list = getLocalAddresses(userId);
  const updated = list.map((a) => (a.id === exceptId ? a : { ...a, is_default: false }));
  saveLocalAddresses(userId, updated);
}
