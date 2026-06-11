import { apiFetch } from '@/lib/apiClient';
import { Gallery, GalleryImage } from '@/types';
import { uploadGalleryImages as cloudinaryUploadGalleryImages } from '@/services/upload';

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export const createGallery = async (galleryData: Omit<Gallery, 'id' | 'public_id' | 'created_at' | 'updated_at'>): Promise<Gallery> => {
    const slug = (galleryData.title || 'gallery')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const random = Math.random().toString(36).substring(2, 7);
    const publicId = slug ? `${slug}-${random}` : random;
    const userId = galleryData.user_id || 1;

    const payload = { 
        ...galleryData, 
        user_id: userId, 
        public_id: publicId,
        images: JSON.stringify(galleryData.images || [])
    };

    const data = await apiFetch<any>('/galleries', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return normalizeGallery(data);
};

export const listGalleries = async (): Promise<Gallery[]> => {
    const data = await apiFetch<any[]>('/galleries');
    return data.map(normalizeGallery);
};

export const getGallery = async (id: number): Promise<Gallery | null> => {
    try {
        const data = await apiFetch<any>(`/galleries/${id}`);
        return normalizeGallery(data);
    } catch (error: any) {
        if (error.message.includes('404')) return null;
        throw error;
    }
};

export const getPublicGallery = async (publicId: string): Promise<Gallery | null> => {
    try {
        const data = await apiFetch<any>(`/galleries/public/${publicId}`);
        return normalizeGallery(data);
    } catch (error: any) {
        if (error.message.includes('404')) return null;
        throw error;
    }
};

export const updateGallery = async (id: number, updates: Partial<Gallery>): Promise<Gallery> => {
    const payload = { ...updates };
    delete (payload as any).id;
    if (updates.images) {
        payload.images = JSON.stringify(updates.images) as any;
    }
    const data = await apiFetch<any>(`/galleries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return normalizeGallery(data);
};

function normalizeGallery(row: any): Gallery {
    const rawImages = Array.isArray(row.gallery_images) ? row.gallery_images : safeParse<any[]>(row.images, []);
    const images: GalleryImage[] = rawImages.map((img: any) => ({
        id: Number(img.id),
        url: img.url,
        thumbnailUrl: img.thumbnail_url || img.thumbnailUrl,
        caption: img.caption,
        uploadedAt: img.uploaded_at || img.uploadedAt || new Date().toISOString()
    }));

    return {
        ...row,
        id: Number(row.id),
        user_id: Number(row.user_id),
        images
    };
}

export const deleteGallery = async (id: number): Promise<void> => {
    // Note: Local storage deletion logic would go here
    await apiFetch(`/galleries/${id}`, { method: 'DELETE' });
};

// Helper functions removed — image processing sekarang dilakukan oleh Cloudinary di backend



export const uploadGalleryImages = async (
    galleryId: number,
    files: File[],
    onProgress?: (progress: number) => void
): Promise<GalleryImage[]> => {
    // Upload semua file ke Cloudinary sekaligus
    const cloudinaryResults = await cloudinaryUploadGalleryImages(files);

    const uploadedImages: GalleryImage[] = [];

    for (let i = 0; i < cloudinaryResults.length; i++) {
        const { url, thumbnailUrl } = cloudinaryResults[i];

        const imagePayload = {
            url,
            thumbnail_url: thumbnailUrl || null,
            uploaded_at: new Date().toISOString(),
        };

        // Simpan URL ke DB via backend
        const saved = await apiFetch<any>(`/galleries/${galleryId}/images`, {
            method: 'POST',
            body: JSON.stringify(imagePayload),
        });

        uploadedImages.push({
            id: Number(saved.id),
            url: saved.url,
            thumbnailUrl: saved.thumbnail_url || thumbnailUrl || undefined,
            caption: saved.caption || undefined,
            uploadedAt: saved.uploaded_at || new Date().toISOString(),
        });

        if (onProgress) {
            onProgress(Math.round(((i + 1) / cloudinaryResults.length) * 100));
        }
    }

    return uploadedImages;
};

export const deleteGalleryImage = async (galleryId: number, imageId: number): Promise<void> => {
    await apiFetch(`/galleries/${galleryId}/images/${imageId}`, { method: 'DELETE' });
};

export const updateGalleryImageCaption = async (galleryId: number, imageId: number, caption: string): Promise<void> => {
    // For now, we'll update via the main gallery update endpoint
    // This is a placeholder - you might want to add a specific endpoint later
    await apiFetch(`/galleries/${galleryId}/images/${imageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ caption })
    });
};

export const reorderGalleryImages = async (galleryId: number, images: GalleryImage[]): Promise<Gallery> => {
    return await updateGallery(galleryId, { images });
};

export const getGalleriesByRegion = async (region: string): Promise<Gallery[]> => {
    return await apiFetch<Gallery[]>(`/galleries/region/${region}`);
};
