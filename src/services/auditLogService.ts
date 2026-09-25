import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminAuditLog } from '../types';

const LOCAL_AUDIT_LOGS_KEY = 'fmcg_admin_audit_logs';

function getLocalAuditLogs(): AdminAuditLog[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading audit logs from localStorage', e);
  }
  return [];
}

function saveLocalAuditLogs(list: AdminAuditLog[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(list.slice(0, 500)));
    }
  } catch (e) {
    console.warn('Failed saving audit logs to localStorage', e);
  }
}

/**
 * Log sensitive/important admin actions (Section 41 & 42)
 * Ensures no passwords, auth tokens, or secret keys are ever logged.
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: any,
  newValue?: any,
  actorName: string = 'Admin Toko'
): Promise<AdminAuditLog> {
  const sanitize = (data: any) => {
    if (!data || typeof data !== 'object') return data;
    const clean = { ...data };
    delete clean.password;
    delete clean.token;
    delete clean.secret;
    delete clean.server_key;
    delete clean.auth;
    return clean;
  };

  const record: AdminAuditLog = {
    id: crypto.randomUUID(),
    user_id: null,
    actor_name: actorName,
    action,
    entity_type: entityType,
    entity_id: String(entityId),
    old_value: sanitize(oldValue),
    new_value: sanitize(newValue),
    ip_address: null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('admin_audit_logs').insert(record);
    } catch (e) {
      console.warn('Supabase logAdminAction error:', e);
    }
  }

  const logs = getLocalAuditLogs();
  logs.unshift(record);
  saveLocalAuditLogs(logs);

  return record;
}

export async function getAdminAuditLogs(params?: {
  limit?: number;
  entityType?: string;
}): Promise<AdminAuditLog[]> {
  const limit = params?.limit || 50;

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (params?.entityType) {
        query = query.eq('entity_type', params.entityType);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as AdminAuditLog[];
      }
    } catch (e) {
      console.warn('Supabase getAdminAuditLogs failed:', e);
    }
  }

  let local = getLocalAuditLogs();
  if (params?.entityType) {
    local = local.filter((l) => l.entity_type === params.entityType);
  }
  return local.slice(0, limit);
}
