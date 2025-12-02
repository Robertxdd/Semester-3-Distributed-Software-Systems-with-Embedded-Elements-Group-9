let tokenCache: string | null = null;

const buildUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api')) return path;
  return `/api${path.startsWith('/') ? path : `/${path}`}`;
};

export const getStoredToken = () => {
  if (tokenCache) return tokenCache;
  const fromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  tokenCache = fromStorage;
  return tokenCache;
};

export const setStoredToken = (value: string | null) => {
  tokenCache = value;
  if (typeof localStorage === 'undefined') return;
  if (value) localStorage.setItem('token', value);
  else localStorage.removeItem('token');
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(buildUrl(path), { ...options, headers });
  if (res.status === 401) {
    throw new Error('unauthorized');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }

  const contentType = res.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
