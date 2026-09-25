/**
 * Loyalty Program Service
 * Manages customer points, transaction ledger, atomic reward redemptions,
 * point earning upon payment, and admin adjustments with audit trail.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltySettings,
  Voucher,
} from '../types';
import { logAdminAction } from './auditLogService';

const LOCAL_LOYALTY_ACCOUNTS_KEY = 'fmcg_loyalty_accounts';
const LOCAL_LOYALTY_TRANSACTIONS_KEY = 'fmcg_loyalty_transactions';
const LOCAL_LOYALTY_REDEMPTIONS_KEY = 'fmcg_loyalty_redemptions';
const LOCAL_LOYALTY_SETTINGS_KEY = 'fmcg_loyalty_settings';

const DEFAULT_SETTINGS: LoyaltySettings = {
  id: 'loyalty-cfg-default',
  points_per_currency: 10000, // 1 Point per Rp10.000
  minimum_redeem_points: 10,
  expiration_enabled: false,
  expiration_months: 12,
  is_active: true,
  updated_at: new Date().toISOString(),
};

const DEFAULT_REWARDS: LoyaltyReward[] = [
  {
    id: 'reward-10k-discount',
    name: 'Diskon Belanja Rp10.000',
    description: 'Potongan langsung Rp10.000 tanpa batas minimum pembelian.',
    points_required: 15,
    reward_type: 'discount',
    reward_value: 10000,
    is_active: true,
    stock: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'reward-free-shipping',
    name: 'Gratis Ongkir Khusus',
    description: 'Subsidi ongkos kirim hingga Rp15.000 ke seluruh Indonesia.',
    points_required: 25,
    reward_type: 'free_shipping',
    reward_value: 15000,
    is_active: true,
    stock: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'reward-30k-voucher',
    name: 'Voucher Belanja Rp30.000',
    description: 'Voucher potongan Rp30.000 untuk transaksi minimal Rp150.000.',
    points_required: 40,
    reward_type: 'voucher',
    reward_value: 30000,
    is_active: true,
    stock: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'reward-50k-voucher',
    name: 'Voucher Belanja Rp50.000',
    description: 'Voucher eksklusif Rp50.000 untuk transaksi minimal Rp250.000.',
    points_required: 60,
    reward_type: 'voucher',
    reward_value: 50000,
    is_active: true,
    stock: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// In-memory mutex lock for atomic redemption (prevent double-redeem race condition)
const redemptionLocks = new Set<string>();

export function getLoyaltySettings(): LoyaltySettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_LOYALTY_SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function updateLoyaltySettings(settings: Partial<LoyaltySettings>): LoyaltySettings {
  const current = getLoyaltySettings();
  const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_LOYALTY_SETTINGS_KEY, JSON.stringify(updated));
    }
  } catch {}
  return updated;
}

function getLocalAccounts(): Record<string, LoyaltyAccount> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_LOYALTY_ACCOUNTS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {};
}

function saveLocalAccount(account: LoyaltyAccount) {
  try {
    if (typeof localStorage !== 'undefined') {
      const map = getLocalAccounts();
      map[account.user_id] = account;
      localStorage.setItem(LOCAL_LOYALTY_ACCOUNTS_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('fmcg_loyalty_updated'));
    }
  } catch {}
}

function getLocalTransactions(): LoyaltyTransaction[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_LOYALTY_TRANSACTIONS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveLocalTransaction(tx: LoyaltyTransaction) {
  try {
    if (typeof localStorage !== 'undefined') {
      const list = getLocalTransactions();
      list.unshift(tx);
      localStorage.setItem(LOCAL_LOYALTY_TRANSACTIONS_KEY, JSON.stringify(list));
    }
  } catch {}
}

function getLocalRedemptions(): LoyaltyRedemption[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_LOYALTY_REDEMPTIONS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveLocalRedemption(redemption: LoyaltyRedemption) {
  try {
    if (typeof localStorage !== 'undefined') {
      const list = getLocalRedemptions();
      list.unshift(redemption);
      localStorage.setItem(LOCAL_LOYALTY_REDEMPTIONS_KEY, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Get or initialize customer loyalty account (Rule 39)
 */
export async function getLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
  if (!userId) {
    return {
      id: 'anon',
      user_id: 'anon',
      current_points: 0,
      lifetime_points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as LoyaltyAccount;
      }
    } catch (e) {
      console.warn('Supabase getLoyaltyAccount error:', e);
    }
  }

  const map = getLocalAccounts();
  if (map[userId]) return map[userId];

  // Default initial account (with a welcome bonus 10 points)
  const newAccount: LoyaltyAccount = {
    id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    current_points: 10,
    lifetime_points: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalAccount(newAccount);

  // Record welcome bonus transaction
  const welcomeTx: LoyaltyTransaction = {
    id: `tx-${Date.now()}`,
    user_id: userId,
    type: 'earn',
    points: 10,
    reference_type: 'welcome_bonus',
    reference_id: null,
    description: 'Bonus Poin Selamat Datang Anggota Baru',
    created_at: new Date().toISOString(),
  };
  saveLocalTransaction(welcomeTx);

  return newAccount;
}

/**
 * Get Customer Points History (Rule 40 & 51)
 */
export async function getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
  if (!userId) return [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as LoyaltyTransaction[];
      }
    } catch (e) {
      console.warn('Supabase getLoyaltyTransactions error:', e);
    }
  }

  const all = getLocalTransactions();
  return all.filter((t) => t.user_id === userId);
}

/**
 * Get Available Loyalty Rewards Catalog (Rule 46)
 */
export async function getLoyaltyRewards(): Promise<LoyaltyReward[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as LoyaltyReward[];
      }
    } catch (e) {
      console.warn('Supabase getLoyaltyRewards error:', e);
    }
  }

  return DEFAULT_REWARDS;
}

/**
 * Calculate points from order total (Rule 44 & 45)
 * Formula: floor(valid_spending / points_per_currency)
 * Example: Rp250.000 / 10.000 = 25 points.
 */
export function calculateOrderPoints(amount: number): number {
  const settings = getLoyaltySettings();
  if (!settings.is_active || amount <= 0) return 0;
  return Math.floor(amount / settings.points_per_currency);
}

/**
 * Award Points upon verified payment settlement (Rule 42)
 */
export async function awardPointsForOrder(
  userId: string,
  orderNumber: string,
  totalPaid: number
): Promise<{ awarded: number; currentPoints: number }> {
  const points = calculateOrderPoints(totalPaid);
  if (points <= 0) return { awarded: 0, currentPoints: 0 };

  const account = await getLoyaltyAccount(userId);
  const updatedAccount: LoyaltyAccount = {
    ...account,
    current_points: account.current_points + points,
    lifetime_points: account.lifetime_points + points,
    updated_at: new Date().toISOString(),
  };

  saveLocalAccount(updatedAccount);

  const tx: LoyaltyTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    type: 'earn',
    points,
    reference_type: 'order',
    reference_id: orderNumber,
    description: `Perolehan poin dari transaksi #${orderNumber} (${totalPaid.toLocaleString('id-ID')})`,
    created_at: new Date().toISOString(),
  };
  saveLocalTransaction(tx);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('loyalty_accounts').upsert(updatedAccount);
      await supabase.from('loyalty_transactions').insert(tx);
    } catch (e) {
      console.warn('Supabase awardPoints error:', e);
    }
  }

  return { awarded: points, currentPoints: updatedAccount.current_points };
}

/**
 * Redeem Loyalty Reward (Rules 47, 48, 49, 50)
 * Atomic verification with lock to prevent race conditions on double requests.
 */
export async function redeemLoyaltyReward(
  userId: string,
  rewardId: string
): Promise<{ success: boolean; message: string; voucherCode?: string; remainingPoints?: number }> {
  const lockKey = `${userId}-${rewardId}`;
  if (redemptionLocks.has(lockKey)) {
    return { success: false, message: 'Permintaan penukaran sedang diproses, mohon tunggu.' };
  }

  redemptionLocks.add(lockKey);

  try {
    const rewards = await getLoyaltyRewards();
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || !reward.is_active) {
      return { success: false, message: 'Reward ini tidak ditemukan atau sudah tidak aktif.' };
    }

    if (reward.stock <= 0) {
      return { success: false, message: 'Stok voucher reward ini sedang habis.' };
    }

    const account = await getLoyaltyAccount(userId);
    if (account.current_points < reward.points_required) {
      return {
        success: false,
        message: `Poin Anda (${account.current_points}) tidak mencukupi untuk reward ini (membutuhkan ${reward.points_required} poin).`,
      };
    }

    // Deduct points atomically
    const nextPoints = account.current_points - reward.points_required;
    const updatedAccount: LoyaltyAccount = {
      ...account,
      current_points: nextPoints,
      updated_at: new Date().toISOString(),
    };
    saveLocalAccount(updatedAccount);

    // Generate unique reward voucher code
    const voucherCode = `RW-${reward.reward_type.toUpperCase().slice(0, 3)}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Record Loyalty Transaction
    const tx: LoyaltyTransaction = {
      id: `tx-${Date.now()}`,
      user_id: userId,
      type: 'redeem',
      points: -reward.points_required,
      reference_type: 'reward_redemption',
      reference_id: voucherCode,
      description: `Penukaran reward: ${reward.name} (${voucherCode})`,
      created_at: new Date().toISOString(),
    };
    saveLocalTransaction(tx);

    // Record Redemption
    const redemption: LoyaltyRedemption = {
      id: `red-${Date.now()}`,
      user_id: userId,
      reward_id: reward.id,
      points_used: reward.points_required,
      voucher_code: voucherCode,
      status: 'completed',
      created_at: new Date().toISOString(),
      reward,
    };
    saveLocalRedemption(redemption);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('loyalty_accounts').upsert(updatedAccount);
        await supabase.from('loyalty_transactions').insert(tx);
        await supabase.from('loyalty_redemptions').insert(redemption);
      } catch (e) {
        console.warn('Supabase redeemLoyaltyReward error:', e);
      }
    }

    return {
      success: true,
      message: `Selamat! Anda berhasil menukar ${reward.points_required} poin untuk "${reward.name}".`,
      voucherCode,
      remainingPoints: nextPoints,
    };
  } finally {
    redemptionLocks.delete(lockKey);
  }
}

/**
 * Get customer redemptions
 */
export async function getUserRedemptions(userId: string): Promise<LoyaltyRedemption[]> {
  const all = getLocalRedemptions();
  return all.filter((r) => r.user_id === userId);
}

/**
 * Admin: Manual Point Adjustment (Rule 53)
 * Requires explicit reason and writes to audit log.
 */
export async function adminAdjustPoints(
  userId: string,
  points: number,
  reason: string,
  actorName: string = 'Super Admin'
): Promise<{ success: boolean; newBalance: number; message: string }> {
  if (!reason || reason.trim().length < 5) {
    return { success: false, newBalance: 0, message: 'Alasan penyesuaian poin wajib diisi minimal 5 karakter.' };
  }

  const account = await getLoyaltyAccount(userId);
  const oldBalance = account.current_points;
  const newBalance = Math.max(0, oldBalance + points);

  const updatedAccount: LoyaltyAccount = {
    ...account,
    current_points: newBalance,
    lifetime_points: points > 0 ? account.lifetime_points + points : account.lifetime_points,
    updated_at: new Date().toISOString(),
  };

  saveLocalAccount(updatedAccount);

  const tx: LoyaltyTransaction = {
    id: `tx-${Date.now()}`,
    user_id: userId,
    type: 'adjustment',
    points,
    reference_type: 'admin_adjustment',
    reference_id: actorName,
    description: `Penyesuaian oleh ${actorName}: ${reason}`,
    created_at: new Date().toISOString(),
  };
  saveLocalTransaction(tx);

  // Write to Audit Log (Rule 53)
  await logAdminAction(
    'LOYALTY_POINT_ADJUSTMENT',
    'loyalty_account',
    userId,
    { points: oldBalance },
    { points: newBalance, adjustment: points, reason },
    actorName
  );

  return {
    success: true,
    newBalance,
    message: `Poin berhasil disesuaikan (${points > 0 ? `+${points}` : points}). Saldo baru: ${newBalance} poin.`,
  };
}

/**
 * Admin: Get Overview Stats for Loyalty Dashboard (Rule 52)
 */
export async function getAdminLoyaltyStats() {
  const accountsMap = getLocalAccounts();
  const accounts = Object.values(accountsMap);
  const transactions = getLocalTransactions();

  let totalPointsIssued = 0;
  let totalPointsRedeemed = 0;

  for (const t of transactions) {
    if (t.points > 0) totalPointsIssued += t.points;
    else if (t.points < 0) totalPointsRedeemed += Math.abs(t.points);
  }

  const outstandingPoints = accounts.reduce((sum, a) => sum + a.current_points, 0);

  return {
    total_members: accounts.length || 1,
    total_points_issued: totalPointsIssued,
    total_points_redeemed: totalPointsRedeemed,
    outstanding_points: outstandingPoints,
    recent_transactions: transactions.slice(0, 15),
  };
}
