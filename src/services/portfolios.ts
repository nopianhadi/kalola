import { apiFetch } from '@/lib/apiClient';
import { Portfolio, PortfolioItem } from '@/types';
import { uploadPortfolioImages as cloudinaryUploadPortfolioImages } from '@/services/upload';

// ─── Normalizer ───────────────────────────────────────────────────────────────
function normalizePortfolio(row: any): Portfolio {
  const rawItems = Array.isArray(row.portfolio_items) ? row.portfolio_items : [];
  const items: PortfolioItem[] = rawItems.map((item: any) => ({
    id: Number(item.id),
    url: item.url,
    thumbnailUrl: item.thumbnail_url || item.thumbnailUrl,
    caption: item.caption,
    sort_order: item.sort_order ?? 0,
    uploadedAt: item.uploaded_at || item.uploadedAt || new Date().toISOString(),
  }));

  return {
    ...row,
    id: Number(row.id),
    vendor_id: row.vendor_id != null ? Number(row.vendor_id) : undefined,
    user_id: row.user_id != null ? Number(row.user_id) : undefined,
    items,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export const createPortfolio = async (
  data: Omit<Portfolio, 'id' | 'public_id' | 'created_at' | 'updated_at' | 'vendor_id'>
): Promise<Portfolio> => {
  const slug = (data.title || 'portfolio')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const random = Math.random().toString(36).substring(2, 7);
  const publicId = slug ? `${slug}-${random}` : random;

  // Backend will automatically set vendor_id from JWT token
  const payload = {
    ...data,
    public_id: publicId,
    items: JSON.stringify(data.items || []),
  };
  // Backend sets vendor_id from JWT; strip legacy/readonly fields
  delete (payload as any).user_id;
  delete (payload as any).vendor_id;

  const result = await apiFetch<any>('/portfolios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizePortfolio(result);
};

export const listPortfolios = async (): Promise<Portfolio[]> => {
  const data = await apiFetch<any[]>('/portfolios');
  return data.map(normalizePortfolio);
};

export const getPortfolio = async (id: number): Promise<Portfolio | null> => {
  try {
    const data = await apiFetch<any>(`/portfolios/${id}`);
    return normalizePortfolio(data);
  } catch (error: any) {
    if (error.message?.includes('404')) return null;
    throw error;
  }
};

export const getPublicPortfolio = async (publicId: string): Promise<Portfolio | null> => {
  try {
    const data = await apiFetch<any>(`/public/portfolio-detail/${publicId}`);
    return normalizePortfolio(data);
  } catch (error: any) {
    if (error.message?.includes('404')) return null;
    throw error;
  }
};

export interface PortfolioListingData {
  profile: {
    full_name: string;
    company_name: string;
    bio?: string;
    phone?: string;
    website?: string;
    logo_base64?: string;
    brand_color?: string;
    address?: string;
  } | null;
  portfolios: Portfolio[];
  feedbacks?: any[];
}

export const getPublicPortfolioListing = async (vendorId?: number): Promise<PortfolioListingData> => {
  const url = vendorId ? `/public/portfolio/${vendorId}` : '/public/portfolio';
  const data = await apiFetch<any>(url);
  return {
    profile: data.profile,
    portfolios: (data.portfolios || []).map((p: any) => normalizePortfolio(p)),
    feedbacks: data.feedbacks || [],
  };
};

export const updatePortfolio = async (
  id: number,
  updates: Partial<Portfolio>
): Promise<Portfolio> => {
  // Strip fields yang tidak boleh diupdate via PATCH
  const { id: _id, user_id: _uid, vendor_id: _vid, public_id, created_at, updated_at, items, ...rest } = updates as any;
  const payload: any = { ...rest };
  if (updates.items !== undefined) {
    payload.items = JSON.stringify(updates.items);
  }
  const data = await apiFetch<any>(`/portfolios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizePortfolio(data);
};

export const deletePortfolio = async (id: number): Promise<void> => {
  await apiFetch(`/portfolios/${id}`, { method: 'DELETE' });
};

// ─── Image Upload ─────────────────────────────────────────────────────────────
export const uploadPortfolioImages = async (
  portfolioId: number,
  files: File[],
  onProgress?: (progress: number) => void
): Promise<PortfolioItem[]> => {
  const cloudinaryResults = await cloudinaryUploadPortfolioImages(files);
  const uploaded: PortfolioItem[] = [];

  for (let i = 0; i < cloudinaryResults.length; i++) {
    const { url, thumbnailUrl } = cloudinaryResults[i];

    const saved = await apiFetch<any>(`/portfolios/${portfolioId}/items`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        thumbnail_url: thumbnailUrl || null,
        sort_order: i,
        uploaded_at: new Date().toISOString(),
      }),
    });

    uploaded.push({
      id: Number(saved.id),
      url: saved.url,
      thumbnailUrl: saved.thumbnail_url || thumbnailUrl || undefined,
      caption: saved.caption || undefined,
      sort_order: saved.sort_order ?? i,
      uploadedAt: saved.uploaded_at || new Date().toISOString(),
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / cloudinaryResults.length) * 100));
    }
  }

  return uploaded;
};

export const deletePortfolioItem = async (
  portfolioId: number,
  itemId: number
): Promise<void> => {
  await apiFetch(`/portfolios/${portfolioId}/items/${itemId}`, { method: 'DELETE' });
};

export const reorderPortfolioItems = async (
  portfolioId: number,
  items: PortfolioItem[]
): Promise<Portfolio> => {
  return updatePortfolio(portfolioId, { items });
};
