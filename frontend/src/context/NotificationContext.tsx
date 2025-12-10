import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { fetchNotifications, markNotificationRead } from '../api/notifications';
import type { NotificationItem } from '../types';
import { useAuth } from './AuthContext';
import { usePolling } from '../hooks/usePolling';

interface Toast {
  id: number;
  title: string;
  body: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unread: number;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  toasts: Toast[];
  addToast: (title: string, body: string) => void;
  removeToast: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications();
      setNotifications((prev) => {
        const prevIds = new Set(prev.map((n) => n.id));
        const newOnes = data.filter((n) => !prevIds.has(n.id) && !n.read_at);
        if (newOnes.length) {
          setToasts((existing) => [
            ...existing,
            ...newOnes.map((n) => ({ id: n.id, title: n.title, body: n.body }))
          ]);
        }
        return data;
      });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [token]);

  const markRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  }, []);

  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const addToast = useCallback(
    (title: string, body: string) =>
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          title,
          body,
        },
      ]),
    []
  );

  usePolling(refresh, 45000, !!token);

  const unread = notifications.filter((n) => !n.read_at).length;

  const value = useMemo(
    () => ({ notifications, unread, refresh, markRead, toasts, addToast, removeToast }),
    [notifications, unread, refresh, markRead, toasts, addToast, removeToast]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('NotificationContext missing');
  return ctx;
};
