/**
 * Upload service — mengirim file ke backend yang kemudian
 * meneruskannya ke Cloudinary.
 *
 * Semua fungsi return URL Cloudinary yang bisa langsung disimpan ke DB.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_STORAGE_KEY = 'vena-authToken';

function getAuthHeaders(): Record<string, string> {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  publicId: string;
}

// ─── Upload avatar (klien / anggota tim / profil) ─────────────────────────────
export async function uploadAvatar(
  file: File,
  context: 'client' | 'team' | 'profile' | 'general' = 'general'
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload/avatar?context=${context}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload gagal (${response.status})`);
  }

  return response.json();
}

// ─── Upload gambar umum (cover paket, gambar project, dll) ───────────────────
export async function uploadImage(
  file: File,
  context: 'package' | 'project' | 'general' = 'general'
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload/image?context=${context}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload gagal (${response.status})`);
  }

  return response.json();
}

// ─── Upload logo perusahaan ───────────────────────────────────────────────────
export async function uploadLogo(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload/logo`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload gagal (${response.status})`);
  }

  return response.json();
}

// ─── Upload multiple gambar galeri ───────────────────────────────────────────
export async function uploadGalleryImages(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_URL}/upload/gallery`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload gagal (${response.status})`);
  }

  return response.json();
}

// ─── Upload multiple gambar portfolio ────────────────────────────────────────
export async function uploadPortfolioImages(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_URL}/upload/portfolio`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload gagal (${response.status})`);
  }

  return response.json();
}

// ─── Hapus gambar dari Cloudinary ─────────────────────────────────────────────
export async function deleteUploadedImage(publicId: string): Promise<void> {
  const encoded = encodeURIComponent(publicId);
  const response = await fetch(`${API_URL}/upload/${encoded}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gagal menghapus gambar (${response.status})`);
  }
}

// ─── Helper: konversi base64 lama ke File object ──────────────────────────────
// Berguna untuk migrasi data existing yang masih base64
export function base64ToFile(base64: string, filename = 'image.jpg'): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
