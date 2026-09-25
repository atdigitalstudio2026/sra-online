import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Clock } from 'lucide-react';
import { CustomerNotification } from '../../types';
import {
  getNotifications,
  getCustomerUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';

interface NotificationBellProps {
  userId?: string | null;
  onNavigate: (path: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userId,
  onNavigate,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load unread count on mount and interval (every 60s, gentle, non-aggressive - Section 32)
  const refreshUnreadCount = async () => {
    try {
      const count = await getCustomerUnreadCount(userId);
      setUnreadCount(count);
    } catch {}
  };

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleToggle = async () => {
    if (!isOpen) {
      setLoading(true);
      try {
        const items = await getNotifications({ limit: 6, userId: userId || null });
        setNotifications(items as any);
      } catch {}
      setLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = async (notif: CustomerNotification) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }

    setIsOpen(false);
    if (notif.entity_type === 'order' && notif.entity_id) {
      onNavigate(`/orders/${notif.entity_id}`);
    } else if (notif.entity_type === 'product' && notif.entity_id) {
      onNavigate(`/products/${notif.entity_id}`);
    } else {
      onNavigate('/account/notifications');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Pusat Pemberitahuan"
        className="relative p-2 text-stone-600 hover:text-stone-950 transition-colors rounded-full hover:bg-stone-100 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-amber-900 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] font-semibold rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-amber-900 hover:text-amber-950 font-semibold"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
            {loading ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 px-4">
                Belum ada notifikasi baru saat ini.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 hover:bg-stone-50 cursor-pointer transition-colors text-left ${
                    !n.is_read ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs ${
                        !n.is_read ? 'font-bold text-stone-900' : 'font-medium text-stone-700'
                      }`}
                    >
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-amber-900 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All */}
          <div className="px-4 pt-2.5 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('/account/notifications');
              }}
              className="text-xs text-amber-900 hover:text-amber-950 font-semibold inline-flex items-center gap-1"
            >
              <span>Lihat Semua Notifikasi</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
