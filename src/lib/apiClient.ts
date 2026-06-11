const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const AUTH_TOKEN_STORAGE_KEY = 'vena-authToken';
const REQUEST_TIMEOUT_MS = 15_000;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem('vena-isAuthenticated');
  window.localStorage.removeItem('vena-currentUser');
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Server tidak merespons. Pastikan backend berjalan dan coba lagi.');
    }
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:5000.');
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    clearAuthStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vena:auth-expired'));
    }
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || errorData.error || `HTTP Error ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Respons server tidak valid.');
  }
}
