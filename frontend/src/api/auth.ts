import { apiFetch, setStoredToken } from './client';
import type { User } from '../types';

interface LoginResponse {
  token: string;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }, true);
  setStoredToken(data.token);
  const user = await fetchMe();
  return { token: data.token, user };
}

export async function fetchMe(): Promise<User> {
  return apiFetch<User>('/auth/me');
}
