import { apiFetch } from './client';
import type { User } from '../types';

export const fetchUsers = () => apiFetch<User[]>('/users');

export const createUser = (payload: { name: string; email: string; role: string; password?: string }) =>
  apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateUserRole = (id: number, role: string) =>
  apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });

export const deleteUser = (id: number) => apiFetch(`/users/${id}`, { method: 'DELETE' });

export const fetchSystemSettings = () => apiFetch<Record<string, unknown>>('/system-settings');

export const updateSystemSettings = (payload: Record<string, unknown>) =>
  apiFetch('/system-settings', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
