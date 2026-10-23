import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from '../i18n';

interface NotificationItem {
  id: string;
  userId?: string;
  phone?: string;
  applicationId?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationsBell: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // Ignore polling errors if unauthenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('notifications.title')}
        className="w-9 h-9 rounded-md bg-zinc-100 hover:bg-zinc-200 text-black flex items-center justify-center transition-colors relative"
      >
        <Bell className="w-4 h-4 text-zinc-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded-lg bg-white border border-zinc-200 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900 text-xs uppercase tracking-wider">
                {t('notifications.title')}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-xs bg-black text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-zinc-600 hover:text-black flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-3.5 hover:bg-zinc-50 transition-colors cursor-pointer ${
                    !n.isRead ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-zinc-900 leading-tight">
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="mt-1.5 text-[10px] text-zinc-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
