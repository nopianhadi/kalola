/**
 * Storage service — semua upload gambar diarahkan ke Cloudinary.
 */

import { uploadImage } from '@/services/upload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Upload bukti transfer DP ke Cloudinary.
 * Mendukung dua mode:
 * - Klien publik (tidak ada token) → endpoint /upload/dp-proof (public)
 * - Vendor yang login → endpoint /upload/image (protected)
 *
 * Return: URL Cloudinary.
 */
export async function uploadDpProof(file: File): Promise<string> {
  const token = window.localStorage.getItem('vena-authToken');

  if (token) {
    // Vendor login → gunakan endpoint protected biasa
    try {
      const result = await uploadImage(file, 'general');
      return result.url;
    } catch (err) {
      console.warn('[storage] Protected upload gagal, mencoba endpoint publik:', err);
    }
  }

  // Klien publik → endpoint /upload/dp-proof (tanpa auth)
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload/dp-proof`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload gagal (${response.status})`);
  }

  const result = await response.json();
  return result.url;
}

export async function uploadGalleryImage(file: File): Promise<string> {
  // Delegasikan ke uploadDpProof — keduanya upload satu gambar ke Cloudinary
  return await uploadDpProof(file);
}

export async function deleteGalleryImage(_imageUrl: string): Promise<void> {
  return Promise.resolve();
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
