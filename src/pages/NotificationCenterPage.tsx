import React, { useState, useEffect } from 'react';
import { CustomerNotification } from '../types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { useToast } from '../components/common/Toast';
import { updateMetaTags } from '../utils/seo';
import {
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  Clock,
  Sparkles,
  ExternalLink,
  Tag,
  TrendingDown,
  Box,
} from 'lucide-react';

interface NotificationCenterPageProps {
  userId?: string | null;
  onNavigate: (path: string) => void;
}

export const NotificationCenterPage: React.FC<NotificationCenterPageProps> = ({
  userId,
  onNavigate,
}) => {
  const { success } = useToast();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Private account page -> noindex (Section 14)
  useEffect(() => {
    return updateMetaTags({
      title: 'Pemberitahuan & Notifikasi Akun',
      noindex: true,
    });
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const items = await getNotifications({
        limit: 100,
        unreadOnly: filter === 'unread',
        userId: userId || null,
      });
      let filtered = items as CustomerNotification[];
      if (filter === 'read') {
        filtered = filtered.filter((n) => n.is_read);
      }
      setNotifications(filtered);
    } catch (e) {
      console.warn('Failed loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter, userId]);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    success('Semua notifikasi berhasil ditandai telah dibaca.');
  };

  const handleItemClick = async (notif: CustomerNotification) => {
    if (!notif.is_read) {
      await handleMarkRead(notif.id);
    }

    if (notif.entity_type === 'order' && notif.entity_id) {
      onNavigate(`/orders/${notif.entity_id}`);
    } else if (notif.entity_type === 'product' && notif.entity_id) {
      onNavigate(`/products/${notif.entity_id}`);
    } else if (notif.type === 'promotion' || notif.type === 'voucher') {
      onNavigate('/products');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_shipped':
      case 'order_delivered':
        return <Package className="w-5 h-5 text-amber-800" />;
      case 'payment_success':
      case 'payment_failed':
        return <CreditCard className="w-5 h-5 text-emerald-800" />;
      case 'back_in_stock':
        return <Box className="w-5 h-5 text-blue-800" />;
      case 'wishlist_price_drop':
        return <TrendingDown className="w-5 h-5 text-emerald-800" />;
      case 'voucher':
      case 'promotion':
        return <Tag className="w-5 h-5 text-purple-800" />;
      default:
        return <Bell className="w-5 h-5 text-stone-700" />;
    }
  };

  const unreadTotal = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Akun Saya', path: '/orders' },
          { label: 'Pusat Pemberitahuan' },
        ]}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Pusat Pemberitahuan
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Informasi status pesanan, verifikasi pembayaran, restok barang, dan promosi khusus akun Anda.
          </p>
        </div>

        {unreadTotal > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-stone-600" />
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-amber-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-amber-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Belum Dibaca ({unreadTotal})
        </button>
        <button
          type="button"
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'read'
              ? 'bg-amber-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Sudah Dibaca
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-400">
            Memuat daftar pemberitahuan...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center bg-stone-50 rounded-2xl border border-stone-200 p-8 space-y-2">
            <Bell className="w-8 h-8 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">Tidak Ada Notifikasi</h3>
            <p className="text-xs text-stone-500">
              {filter === 'unread'
                ? 'Semua notifikasi telah Anda baca.'
                : 'Belum ada notifikasi atau pemberitahuan baru di akun Anda.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                !notif.is_read
                  ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 shrink-0 shadow-2xs">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm ${
                      !notif.is_read ? 'font-bold text-stone-900' : 'font-semibold text-stone-800'
                    }`}
                  >
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(notif.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">{notif.message}</p>

                {notif.entity_id && (
                  <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-amber-900">
                    <span>Lihat Detail</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              {!notif.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-800 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
