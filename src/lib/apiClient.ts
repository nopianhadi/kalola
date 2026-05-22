const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.details || errorData.error || `HTTP Error ${response.status}`;
    throw new Error(message);
  }
  
  // Jika response tidak memiliki body (seperti DELETE 204), kembalikan kosong
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}
