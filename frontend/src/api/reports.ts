import { apiFetch } from './client';
import type { DeskErrorItem, DeskReportRow } from '../types';

export const fetchErrorReport = (params: {
  from?: string;
  to?: string;
  severity?: string;
  deskId?: number;
}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value));
  });
  const query = search.toString();
  return apiFetch<DeskErrorItem[]>(`/reports/errors${query ? `?${query}` : ''}`);
};

export const fetchUsageSummary = (params: {
  groupBy?: string;
  from?: string;
  to?: string;
}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value));
  });
  const query = search.toString();
  return apiFetch<DeskReportRow[]>(`/reports/usage-summary${query ? `?${query}` : ''}`);
};

export const resolveError = (errorId: number) =>
  apiFetch(`/errors/${errorId}/resolve`, { method: 'PATCH' });
