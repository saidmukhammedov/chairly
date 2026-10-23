import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, ExternalLink } from 'lucide-react';
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
        className="p-2 rounded-xl border border-chairly-border bg-white hover:bg-chairly-panel text-chairly-dark relative transition-colors shadow-2xs"
      >
        <Bell className="w-4 h-4 text-chairly-muted" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-chairly-terracotta-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-chairly-border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-chairly-border bg-chairly-bg/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-chairly-dark text-xs">
                {t('notifications.title')}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-chairly-terracotta-50 text-chairly-terracotta-700 text-[10px] font-bold">
                  {unreadCount} {t('notifications.new')}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-chairly-terracotta-600 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-chairly-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-chairly-muted text-xs">
                <Bell className="w-8 h-8 text-chairly-subtle mx-auto mb-2 opacity-50" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-3.5 hover:bg-chairly-bg/50 transition-colors cursor-pointer ${
                    !n.isRead ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-chairly-dark">
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-chairly-terracotta-500 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-chairly-muted line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-chairly-muted">
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
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
