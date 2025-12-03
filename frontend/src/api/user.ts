import { apiFetch } from './client';
import type {
  HealthSummary,
  PreferencePayload,
  Preset,
  ReminderSettings
} from '../types';

export const fetchHealthSummary = (range: string) =>
  apiFetch<HealthSummary>(`/users/me/health-summary?range=${encodeURIComponent(range)}`);

export const fetchPresets = () => apiFetch<Preset[]>('/users/me/presets');

export const updatePresets = (presets: Preset[]) =>
  apiFetch('/users/me/presets', {
    method: 'PUT',
    body: JSON.stringify(presets)
  });

export const fetchReminders = () => apiFetch<ReminderSettings>('/users/me/reminders');

export const updateReminders = (payload: ReminderSettings) =>
  apiFetch('/users/me/reminders', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const updatePreferences = (payload: PreferencePayload) =>
  apiFetch('/users/me/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
