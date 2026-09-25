import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NotificationItem, NotificationType } from '../types';

const LOCAL_NOTIFICATIONS_KEY = 'fmcg_admin_notifications';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: null,
    type: 'new_order',
    title: 'Pesanan Baru Masuk',
    message: 'Pesanan ORD-20260925-8831 siap diproses ke logistik.',
    entity_type: 'order',
    entity_id: 'ORD-20260925-8831',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: null,
    type: 'low_stock',
    title: 'Peringatan Stok Menipis',
    message: 'Komoditas Kemiri 500g tersisa 8 pcs (di bawah batas minimum 10 pcs).',
    entity_type: 'product',
    entity_id: 'KMR-BLT-500',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif-3',
    user_id: null,
    type: 'payment_received',
    title: 'Pembayaran Dikonfirmasi',
    message: 'Pembayaran Rp135.000 via BCA Virtual Account telah berhasil diverifikasi.',
    entity_type: 'payment',
    entity_id: 'ORD-20260925-4122',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

function getLocalNotifications(): NotificationItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading notifications from localStorage', e);
  }
  return INITIAL_NOTIFICATIONS;
}

function saveLocalNotifications(list: NotificationItem[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed saving notifications to localStorage', e);
  }
}

export async function getNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
  userId?: string | null;
}): Promise<NotificationItem[]> {
  const limit = params?.limit || 50;

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (params?.userId) {
        query = query.or(`user_id.eq.${params.userId},user_id.is.null`);
      }
      if (params?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as NotificationItem[];
      }
    } catch (e) {
      console.warn('Supabase getNotifications failed, using local:', e);
    }
  }

  let local = getLocalNotifications();
  if (params?.userId) {
    local = local.filter((n) => !n.user_id || n.user_id === params.userId);
  }
  if (params?.unreadOnly) {
    local = local.filter((n) => !n.is_read);
  }
  return local.slice(0, limit);
}

/**
 * Get count of unread notifications for a customer
 */
export async function getCustomerUnreadCount(userId?: string | null): Promise<number> {
  const items = await getNotifications({ unreadOnly: true, userId: userId || null });
  return items.length;
}

/**
 * Send targeted customer notification (Section 29, 33)
 */
export async function sendCustomerNotification(
  userId: string | null,
  type: NotificationType,
  title: string,
  message: string,
  entityType?: 'order' | 'product' | 'promotion' | 'system',
  entityId?: string
): Promise<NotificationItem> {
  const record: NotificationItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    type,
    title,
    message,
    entity_type: entityType || null,
    entity_id: entityId || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').insert(record);
    } catch (e) {
      console.warn('Supabase sendCustomerNotification error:', e);
    }
  }

  const list = getLocalNotifications();
  list.unshift(record);
  saveLocalNotifications(list);

  return record;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (e) {
      console.warn('Supabase markNotificationAsRead error:', e);
    }
  }

  const list = getLocalNotifications();
  const idx = list.findIndex((n) => n.id === id);
  if (idx !== -1) {
    list[idx].is_read = true;
    saveLocalNotifications(list);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    } catch (e) {
      console.warn('Supabase markAllNotificationsAsRead error:', e);
    }
  }

  const list = getLocalNotifications();
  const updated = list.map((n) => ({ ...n, is_read: true }));
  saveLocalNotifications(updated);
}

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
): Promise<NotificationItem> {
  const record: NotificationItem = {
    id: crypto.randomUUID(),
    user_id: null,
    type,
    title,
    message,
    entity_type: entityType || null,
    entity_id: entityId || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').insert(record);
    } catch (e) {
      console.warn('Supabase createNotification error:', e);
    }
  }

  const list = getLocalNotifications();
  list.unshift(record);
  saveLocalNotifications(list);

  return record;
}
