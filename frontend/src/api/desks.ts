import { apiFetch } from './client';
import type {
  DeskErrorItem,
  DeskState,
  DeskUsageEntry,
  FilterParams,
  UsageSummary
} from '../types';

export const fetchActiveDesk = () => apiFetch<{ id: number; desk: DeskState }>('/users/me/active-desk');

export const fetchDesk = (id: number) => apiFetch<DeskState>(`/desks/${id}`);

export const fetchDeskUsage = (id: number) => apiFetch<DeskUsageEntry[]>(`/desks/${id}/usage`);

export const fetchDeskErrors = (id: number) => apiFetch<DeskErrorItem[]>(`/desks/${id}/errors`);

export const fetchTodayUsage = (from: string, to: string) =>
  apiFetch<UsageSummary>(`/users/me/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

export const sendPreset = (deskId: number, preset: string) =>
  apiFetch(`/desks/${deskId}/commands/preset`, {
    method: 'POST',
    body: JSON.stringify({ preset })
  });

export const sendHeight = (deskId: number, height: number) =>
  apiFetch(`/desks/${deskId}/commands/set-height`, {
    method: 'POST',
    body: JSON.stringify({ height })
  });

export const fetchDesks = (filters: FilterParams = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const query = params.toString();
  return apiFetch<DeskState[]>(`/desks${query ? `?${query}` : ''}`);
};

export const bulkSetHeight = (deskIds: number[], height: number) =>
  apiFetch('/desks/bulk/commands/set-height', {
    method: 'POST',
    body: JSON.stringify({ deskIds, height })
  });

export const bulkPreset = (deskIds: number[], preset: string) =>
  apiFetch('/desks/bulk/commands/preset', {
    method: 'POST',
    body: JSON.stringify({ deskIds, preset })
  });
