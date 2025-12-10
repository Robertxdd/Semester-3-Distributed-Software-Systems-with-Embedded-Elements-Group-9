export type Role = 'OCCUPANT' | 'MANAGER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_admin?: boolean;
}

export interface DeskLocation {
  building?: string;
  floor?: string;
  zone?: string;
}

export interface DeskState extends DeskLocation {
  id: number;
  name: string;
  current_height?: number;
  target_height?: number;
  posture?: 'SITTING' | 'STANDING' | 'MOVING' | 'UNKNOWN';
  motor_state?: string;
  last_error?: string | null;
  updated_at?: string;
  manufacturer?: string;
  external_id?: string;
}

export interface UsageSummary {
  sitting_minutes: number;
  standing_minutes: number;
  posture_changes: number;
  range?: string;
}

export interface HealthSummary {
  range: string;
  sitting_minutes: number;
  standing_minutes: number;
  posture_changes: number;
  health_message?: string;
  per_day?: { date: string; sitting: number; standing: number }[];
}

export interface Preset {
  key: 'SITTING' | 'STANDING' | string;
  height_mm: number;
}

export interface ReminderSettings {
  enabled: boolean;
  type: 'TIME' | 'USAGE';
  every_minutes?: number;
  max_sitting_minutes?: number;
}

export interface PreferencePayload {
  theme?: 'light' | 'dark' | 'system';
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  type?: string;
}

export interface DeskUsageEntry {
  posture: 'SITTING' | 'STANDING';
  duration_minutes: number;
  started_at: string;
}

export interface DeskErrorItem {
  id: number;
  code: string;
  message: string;
  severity: string;
  occurred_at: string;
  resolved_at?: string | null;
  desk_id?: number;
}

export interface DeskReportRow {
  desk_id: number;
  desk_name?: string;
  sitting_minutes: number;
  standing_minutes: number;
  posture_changes: number;
}

export interface FilterParams {
  building?: string;
  floor?: string;
  zone?: string;
  only_errors?: boolean;
  only_low_power?: boolean;
}

export interface DeskDailyStats {
  desk_id: number;
  standing_minutes: number;
  sitting_minutes: number;
  movements_today: number;
  errors_today: number;
  meets_recommendation?: boolean;
  health_message?: string;
}

export interface DeskUsageDelta {
  activations_delta: number;
  sit_stand_delta: number;
  from?: string;
  to?: string;
}
