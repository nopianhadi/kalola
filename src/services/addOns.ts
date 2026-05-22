import { apiFetch } from '@/lib/apiClient';
import { AddOn } from '@/types';

function normalize(row: Record<string, unknown>): AddOn {
  return {
    id: Number(row.id || 0),
    name: String(row.name),
    price: Number(row.price || 0),
    region: row.region ? String(row.region) : undefined,
  } as AddOn;
}

function denormalize(obj: Partial<AddOn>): Record<string, unknown> {
  const result: any = {
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.price !== undefined ? { price: obj.price } : {}),
    ...(obj.region !== undefined ? { region: obj.region } : {}),
  };
  return result;
}

export async function listAddOns(): Promise<AddOn[]> {
  const data = await apiFetch<any[]>('/add-ons');
  return data.map(row => normalize(row));
}

export async function createAddOn(payload: Omit<AddOn, 'id' | 'createdAt'>): Promise<AddOn> {
  const data = await apiFetch<any>('/add-ons', {
    method: 'POST',
    body: JSON.stringify(denormalize(payload))
  });
  return normalize(data);
}

export async function updateAddOn(id: number, patch: Partial<AddOn>): Promise<AddOn> {
  const payload = denormalize(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/add-ons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalize(data);
}

export async function deleteAddOn(id: number): Promise<void> {
  await apiFetch(`/add-ons/${id}`, { method: 'DELETE' });
}
