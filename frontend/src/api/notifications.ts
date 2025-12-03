import { apiFetch } from './client';
import type { NotificationItem } from '../types';

export const fetchNotifications = () => apiFetch<NotificationItem[]>('/users/me/notifications');

export const markNotificationRead = (id: number) =>
  apiFetch(`/users/me/notifications/${id}/read`, { method: 'PATCH' });
