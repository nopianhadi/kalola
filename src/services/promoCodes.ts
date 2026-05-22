import { apiFetch } from '@/lib/apiClient';
import { PromoCode } from '@/types';

export async function listPromoCodes(): Promise<PromoCode[]> {
  const data = await apiFetch<any[]>('/promo-codes');
  return data.map(normalizePromo);
}

export async function createPromoCode(payload: Omit<PromoCode, 'id' | 'usageCount'> & { usageCount?: number }): Promise<PromoCode> {
  const data = await apiFetch<any>('/promo-codes', {
    method: 'POST',
    body: JSON.stringify(denormalizePromo(payload))
  });
  return normalizePromo(data);
}

export async function updatePromoCode(id: number, patch: Partial<PromoCode>): Promise<PromoCode> {
  const payload = denormalizePromo(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/promo-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalizePromo(data);
}

export async function deletePromoCode(id: number): Promise<void> {
  await apiFetch(`/promo-codes/${id}`, { method: 'DELETE' });
}
function normalizePromo(row: any): PromoCode {
  return {
    id: Number(row.id),
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    isActive: !!row.is_active,
    usageCount: Number(row.usage_count || 0),
    maxUsage: row.max_usage ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

function denormalizePromo(obj: Partial<PromoCode & { usageCount?: number }>): any {
  const result: any = {
    ...(obj.code !== undefined ? { code: obj.code } : {}),
    ...(obj.discountType !== undefined ? { discount_type: obj.discountType } : {}),
    ...(obj.discountValue !== undefined ? { discount_value: obj.discountValue } : {}),
    ...(obj.isActive !== undefined ? { is_active: obj.isActive } : {}),
    ...(obj.usageCount !== undefined ? { usage_count: obj.usageCount } : {}),
    ...(obj.maxUsage !== undefined ? { max_usage: obj.maxUsage } : {}),
    ...(obj.expiryDate !== undefined ? { expiry_date: obj.expiryDate } : {}),
  };
  return result;
}
