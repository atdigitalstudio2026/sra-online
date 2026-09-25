import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import {
  LoyaltyAccount,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyRedemption,
} from '../../types';
import {
  getLoyaltyAccount,
  getLoyaltyRewards,
  getLoyaltyTransactions,
  getUserRedemptions,
  redeemLoyaltyReward,
} from '../../services/loyaltyService';
import { useToast } from '../../components/common/Toast';
import {
  Award,
  Sparkles,
  Ticket,
  Clock,
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  HelpCircle,
  Coins,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface AccountLoyaltyPageProps {
  onNavigate: (path: string) => void;
}

export const AccountLoyaltyPage: React.FC<AccountLoyaltyPageProps> = () => {
  const { user } = useCart();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { success, error } = useToast();

  const loadData = async () => {
    if (user?.id) {
      setLoading(true);
      try {
        const [acc, rewList, txList, redList] = await Promise.all([
          getLoyaltyAccount(user.id),
          getLoyaltyRewards(),
          getLoyaltyTransactions(user.id),
          getUserRedemptions(user.id),
        ]);
        setAccount(acc);
        setRewards(rewList);
        setTransactions(txList);
        setRedemptions(redList);
      } catch (e) {
        console.warn('Failed loading loyalty data', e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('fmcg_loyalty_updated', handleUpdate);
    return () => window.removeEventListener('fmcg_loyalty_updated', handleUpdate);
  }, [user]);

  const handleRedeem = async (reward: LoyaltyReward) => {
    if (!user?.id) return;

    if ((account?.current_points || 0) < reward.points_required) {
      error(`Poin Anda belum cukup (membutuhkan ${reward.points_required} poin).`);
      return;
    }

    setRedeemingId(reward.id);
    try {
      const res = await redeemLoyaltyReward(user.id, reward.id);
      if (res.success) {
        success(res.message);
        loadData();
      } else {
        error(res.message);
      }
    } catch {
      error('Gagal memproses penukaran reward.');
    } finally {
      setRedeemingId(null);
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Kode voucher "${code}" berhasil disalin!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-stone-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-36 bg-stone-200 rounded-2xl" />
          <div className="h-36 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Points Balance Hero Card (Rule 38) */}
      <div className="bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Award className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Program Loyalitas FMCG Pangan</span>
            </div>
            <h2 className="text-sm uppercase tracking-wider text-stone-300 font-semibold">
              Saldo Poin Loyalitas Anda
            </h2>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-amber-400">
                {account?.current_points || 0}
              </span>
              <span className="text-xs text-stone-300">Poin Aktif</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Total Poin Terkumpul Seumur Hidup: <span className="text-white font-mono font-bold">{account?.lifetime_points || 0}</span> poin
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-xs max-w-sm border border-white/10">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
              <Coins className="w-4 h-4" />
              <span>Cara Mendapatkan Poin:</span>
            </div>
            <p className="text-stone-200 text-[11px] leading-relaxed">
              Dapatkan <span className="text-amber-300 font-bold">1 Poin</span> untuk setiap kelipatan belanja{' '}
              <span className="text-amber-300 font-bold">Rp10.000</span> pada pesanan yang telah dibayar.
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Catalog (Rule 46 & 47) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-700" />
              <span>Katalog Reward & Voucher Poin</span>
            </h3>
            <p className="text-xs text-stone-500">Tukarkan poin Anda dengan potongan diskon dan gratis ongkir.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((reward) => {
            const canAfford = (account?.current_points || 0) >= reward.points_required;
            const isRedeeming = redeemingId === reward.id;

            return (
              <div
                key={reward.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{reward.name}</h4>
                        <span className="text-[10px] text-stone-400 font-mono">
                          Nilai: {formatRupiah(reward.reward_value)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-amber-900 font-mono block">
                        {reward.points_required} Poin
                      </span>
                      <span className="text-[10px] text-stone-400">Sisa stok: {reward.stock}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 mt-2 mb-4 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {canAfford ? 'Poin mencukupi' : `Kurang ${reward.points_required - (account?.current_points || 0)} poin`}
                  </span>

                  {/* Redeem Button (Rule 47) */}
                  <button
                    type="button"
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || reward.stock <= 0 || isRedeeming}
                    className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isRedeeming ? 'Memproses...' : 'Tukar Reward'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Redeemed Vouchers (Rule 48) */}
      {redemptions.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-600" />
            <span>Voucher Hasil Penukaran Anda</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {redemptions.map((red) => (
              <div
                key={red.id}
                className="p-3.5 rounded-xl border border-dashed border-amber-800/40 bg-amber-50/40 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900 font-mono">
                    {red.voucher_code}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {red.reward?.name || 'Voucher Poin'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => red.voucher_code && copyVoucherCode(red.voucher_code)}
                  className="p-2 text-stone-600 hover:text-amber-900 hover:bg-white rounded-lg transition-colors shrink-0"
                  title="Salin Kode Voucher"
                >
                  {copiedCode === red.voucher_code ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History Ledger (Rule 51) */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Riwayat Mutasi Poin</h3>
            <p className="text-xs text-stone-500">Catatan perolehan dan penukaran poin Anda.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full font-mono">
            {transactions.length} mutasi
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p>Belum ada riwayat mutasi poin.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {transactions.map((tx) => {
              const isPositive = tx.points > 0;
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-stone-50/60">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 leading-snug">{tx.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mt-0.5">
                      <span>{new Date(tx.created_at).toLocaleString('id-ID')}</span>
                      <span>&bull;</span>
                      <span className="uppercase text-stone-500">{tx.type}</span>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-sm font-bold shrink-0 ${
                      isPositive ? 'text-emerald-600' : 'text-stone-700'
                    }`}
                  >
                    {isPositive ? `+${tx.points}` : tx.points} Poin
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
