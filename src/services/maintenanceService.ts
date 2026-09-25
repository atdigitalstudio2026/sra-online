/**
 * Production Maintenance Mode Service
 * Manages store maintenance status, custom downtime messages,
 * countdown timers, and developer/admin bypass tokens.
 */

import { MaintenanceModeConfig } from '../types';

const MAINTENANCE_STORAGE_KEY = 'fmcg_maintenance_config';
const MAINTENANCE_BYPASS_KEY_STORAGE = 'fmcg_maintenance_bypass';

const DEFAULT_MAINTENANCE_CONFIG: MaintenanceModeConfig = {
  enabled: false,
  title: 'Peningkatan Sistem & Pemeliharaan Berkala',
  message: 'Kami sedang melakukan optimasi performa dan sinkronisasi basis data komoditas pangan untuk memberikan pengalaman belanja yang lebih cepat dan aman. Toko online akan kembali normal dalam beberapa saat.',
  estimated_end_time: null,
  allowed_ips: [],
  bypass_key: 'FMCG-SECURE-BYPASS-2026',
  updated_at: new Date().toISOString(),
  updated_by: 'Super Admin',
};

export function getMaintenanceConfig(): MaintenanceModeConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_MAINTENANCE_CONFIG, ...JSON.parse(stored) };
      }
    }
  } catch (err) {
    console.warn('Failed reading maintenance config', err);
  }
  return DEFAULT_MAINTENANCE_CONFIG;
}

export function updateMaintenanceConfig(config: Partial<MaintenanceModeConfig>): MaintenanceModeConfig {
  const current = getMaintenanceConfig();
  const updated: MaintenanceModeConfig = {
    ...current,
    ...config,
    updated_at: new Date().toISOString(),
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('fmcg_maintenance_changed', { detail: updated }));
    }
  } catch (err) {
    console.warn('Failed saving maintenance config', err);
  }

  return updated;
}

export function isStorefrontInMaintenance(): boolean {
  const config = getMaintenanceConfig();
  if (!config.enabled) return false;

  // Check if current user has an active bypass token in session or local storage
  if (isMaintenanceBypassed(config.bypass_key)) {
    return false;
  }

  return true;
}

export function isMaintenanceBypassed(expectedKey?: string): boolean {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem(MAINTENANCE_BYPASS_KEY_STORAGE);
      const target = expectedKey || getMaintenanceConfig().bypass_key;
      return token === target;
    }
  } catch {}
  return false;
}

export function setMaintenanceBypass(key: string): boolean {
  const config = getMaintenanceConfig();
  if (key.trim() === config.bypass_key.trim()) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(MAINTENANCE_BYPASS_KEY_STORAGE, key.trim());
      }
      return true;
    } catch {}
  }
  return false;
}

export function clearMaintenanceBypass(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(MAINTENANCE_BYPASS_KEY_STORAGE);
    }
  } catch {}
}
