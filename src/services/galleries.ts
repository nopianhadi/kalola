import { apiFetch } from '@/lib/apiClient';
import { Gallery, GalleryImage } from '@/types';

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

// Helper for image compression and base64 conversion
const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
};

// Generate thumbnail
const generateThumbnail = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
    return compressImage(file, maxWidth, quality);
};



export const uploadGalleryImages = async (
    galleryId: number,
    files: File[],
    onProgress?: (progress: number) => void
): Promise<GalleryImage[]> => {
    const uploadedImages: GalleryImage[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // Compress main image (max 1920px width, 80% quality)
            const compressedBase64 = await compressImage(file, 1920, 0.8);
            
            // Generate thumbnail (max 400px width, 70% quality)
            const thumbnailBase64 = await generateThumbnail(file, 400, 0.7);
            
            const imagePayload = {
                url: compressedBase64,
                thumbnail_url: thumbnailBase64,
                uploaded_at: new Date().toISOString()
            };

            // POST one image at a time to avoid MySQL max_allowed_packet limits
            const saved = await apiFetch<any>(`/galleries/${galleryId}/images`, {
                method: 'POST',
                body: JSON.stringify(imagePayload)
            });

            uploadedImages.push({
                id: Number(saved.id),
                url: saved.url,
                thumbnailUrl: saved.thumbnail_url || undefined,
                caption: saved.caption || undefined,
                uploadedAt: saved.uploaded_at || new Date().toISOString()
            });
        } catch (err) {
            console.error(`Error uploading file ${file.name}:`, err);
            throw err;
        }

        if (onProgress) {
            onProgress(Math.round(((i + 1) / files.length) * 100));
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
