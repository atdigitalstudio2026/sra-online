import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser, AdminRole, Permission } from '../types';
import { logAdminAction } from './auditLogService';

const LOCAL_ADMIN_USERS_KEY = 'fmcg_admin_users';

const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'adm-1',
    user_id: null,
    email: 'atdigitalstudio2026@gmail.com',
    name: 'Super Administrator',
    role: 'super_admin',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'adm-2',
    user_id: null,
    email: 'admin.operasional@atdigitalstudio.com',
    name: 'Admin Operasional',
    role: 'admin',
    is_active: true,
    last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    created_at: '2026-09-10T00:00:00.000Z',
    updated_at: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'adm-3',
    user_id: null,
    email: 'staff.gudang@atdigitalstudio.com',
    name: 'Staff Gudang & Logistik',
    role: 'staff',
    is_active: true,
    last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: '2026-09-15T00:00:00.000Z',
    updated_at: '2026-09-15T00:00:00.000Z',
  },
];

// Role Permission Matrix (Section 38 & 39)
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'orders.view',
    'orders.update',
    'customers.view',
    'customers.export',
    'inventory.view',
    'inventory.adjust',
    'reports.view',
    'reports.export',
    'users.manage',
  ],
  admin: [
    'products.view',
    'products.create',
    'products.update',
    'orders.view',
    'orders.update',
    'customers.view',
    'customers.export',
    'inventory.view',
    'inventory.adjust',
    'reports.view',
    'reports.export',
  ],
  staff: [
    'products.view',
    'orders.view',
    'orders.update',
    'customers.view',
    'inventory.view',
  ],
};

function getLocalAdminUsers(): AdminUser[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading admin users from localStorage', e);
  }
  return INITIAL_ADMIN_USERS;
}

function saveLocalAdminUsers(list: AdminUser[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed saving admin users to localStorage', e);
  }
}

/**
 * Check if a role possesses a specific permission code
 */
export function hasPermission(role: AdminRole, permissionCode: string): boolean {
  if (role === 'super_admin') return true;
  const list = ROLE_PERMISSIONS[role] || [];
  return list.includes(permissionCode);
}

/**
 * Get current logged in admin profile (simulated or session)
 */
export function getCurrentAdminUser(): AdminUser {
  const users = getLocalAdminUsers();
  return users[0] || INITIAL_ADMIN_USERS[0];
}

/**
 * Fetch all admin users
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AdminUser[];
      }
    } catch (e) {
      console.warn('Supabase getAdminUsers failed, using local:', e);
    }
  }

  return getLocalAdminUsers();
}

/**
 * Create new admin user (Section 40)
 */
export async function createAdminUser(params: {
  name: string;
  email: string;
  role: AdminRole;
  actor: AdminUser;
}): Promise<AdminUser> {
  // Super Admin security rule: regular admin cannot create super_admin
  if (params.role === 'super_admin' && params.actor.role !== 'super_admin') {
    throw new Error('Hanya Super Administrator yang berhak menugaskan peran Super Admin.');
  }

  const now = new Date().toISOString();
  const newUser: AdminUser = {
    id: crypto.randomUUID(),
    email: params.email.trim().toLowerCase(),
    name: params.name.trim(),
    role: params.role,
    is_active: true,
    last_login_at: null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('admin_users').insert(newUser);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase insert admin user error:', e);
    }
  }

  const list = getLocalAdminUsers();
  list.push(newUser);
  saveLocalAdminUsers(list);

  await logAdminAction(
    'CREATE_ADMIN_USER',
    'admin_user',
    newUser.id,
    null,
    { name: newUser.name, email: newUser.email, role: newUser.role },
    params.actor.name
  );

  return newUser;
}

/**
 * Update admin role or active status
 */
export async function updateAdminUser(
  id: string,
  updates: Partial<Pick<AdminUser, 'name' | 'role' | 'is_active'>>,
  actor: AdminUser
): Promise<AdminUser> {
  const users = await getAdminUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    throw new Error('User admin tidak ditemukan.');
  }

  if (updates.role === 'super_admin' && actor.role !== 'super_admin') {
    throw new Error('Hanya Super Administrator yang berhak menugaskan peran Super Admin.');
  }

  const now = new Date().toISOString();
  const updatedUser: AdminUser = {
    ...target,
    ...updates,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('admin_users').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase update admin user error:', e);
    }
  }

  const list = getLocalAdminUsers();
  const idx = list.findIndex((u) => u.id === id);
  if (idx !== -1) {
    list[idx] = updatedUser;
    saveLocalAdminUsers(list);
  }

  await logAdminAction(
    'UPDATE_ADMIN_USER',
    'admin_user',
    id,
    { role: target.role, is_active: target.is_active },
    updates,
    actor.name
  );

  return updatedUser;
}
