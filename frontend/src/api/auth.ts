import { apiFetch, setStoredToken } from './client';
import type { Role, User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string, role: Role | 'ADMIN' | 'OCCUPANT' | 'MANAGER' | 'user' | 'admin') {
  const payloadRole = role === 'admin' || role === 'ADMIN' ? 'admin' : 'user';
  const data = await apiFetch<LoginResponse>(
    '/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, role: payloadRole })
    },
    true
  );
  setStoredToken(data.token);
  const resolvedRole: Role =
    data.user.role || (payloadRole === 'admin' ? 'ADMIN' : 'OCCUPANT');
  return { token: data.token, user: { ...data.user, role: resolvedRole } };
}

export async function fetchMe(): Promise<User> {
  const profile = await apiFetch<User>('/auth/me');
  const resolvedRole: Role =
    profile.role || (profile.is_admin ? 'ADMIN' : 'OCCUPANT');
  return { ...profile, role: resolvedRole };
}
