import { apiFetch } from './client';
import type {
  DeskErrorItem,
  DeskState,
  DeskUsageEntry,
  DeskDailyStats,
  DeskUsageDelta,
  FilterParams,
  UsageSummary
} from '../types';

export const fetchActiveDesk = () => apiFetch<{ id: number; desk: DeskState }>('/users/me/active-desk');

export const fetchDesk = (id: number) => apiFetch<DeskState>(`/desks/${id}`);

export const fetchDeskUsage = (id: number) => apiFetch<DeskUsageEntry[]>(`/desks/${id}/usage`);

export const fetchDeskErrors = (id: number) => apiFetch<DeskErrorItem[]>(`/desks/${id}/errors`);

export const fetchTodayUsage = (from: string, to: string, deskId?: number) => {
  const params = new URLSearchParams();
  params.set('from', from);
  params.set('to', to);
  if (deskId) params.set('deskId', String(deskId));
  return apiFetch<UsageSummary>(`/users/me/usage?${params.toString()}`);
};

export const fetchDeskTodayStats = (deskId: number) =>
  apiFetch<DeskDailyStats>(`/desks/${deskId}/today-stats`);

export const fetchDeskUsageDeltas = (deskId: number, params: { from?: string; to?: string } = {}) => {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const query = search.toString();
  return apiFetch<DeskUsageDelta>(`/desks/${deskId}/usage-summary${query ? `?${query}` : ''}`);
};

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

export const createDesk = (payload: Partial<DeskState> & { name: string }) =>
  apiFetch<DeskState>('/desks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

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
