import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem } from '../../types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';
import { formatDateTime } from '../../utils/formatters';

interface AdminNotificationDropdownProps {
  onNavigate: (path: string) => void;
}

export const AdminNotificationDropdown: React.FC<AdminNotificationDropdownProps> = ({
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const list = await getNotifications({ limit: 15 });
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (e) {
      console.warn('Failed loading notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000); // 15s gentle polling
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    fetchNotifs();
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      fetchNotifs();
    }
    setIsOpen(false);

    if (notif.entity_type === 'order' && notif.entity_id) {
      onNavigate(`/admin/orders/${notif.entity_id}`);
    } else if (notif.entity_type === 'product' && notif.entity_id) {
      onNavigate('/admin/inventory');
    } else if (notif.entity_type === 'payment') {
      onNavigate('/admin/payments');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />;
      case 'payment_received':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'shipment_issue':
        return <Truck className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifikasi Admin"
        className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-stone-900">Pemberitahuan Bisnis</span>
                {unreadCount > 0 && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-stone-50 transition-colors cursor-pointer text-xs ${
                      !n.is_read ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-stone-900 truncate text-[11px]">{n.title}</h4>
                        <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                          {formatDateTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-stone-400">
                  Tidak ada notifikasi baru saat ini.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
