import { apiFetch } from '@/lib/apiClient';
import { WeddingDayChecklist } from '@/types';

export function normalizeChecklist(row: any): WeddingDayChecklist {
  if (!row) {
    console.warn('[Checklist] Attempted to normalize an undefined row');
    return {} as WeddingDayChecklist;
  }
  return {
    id: Number(row.id),
    projectId: Number(row.project_id),
    category: row.category,
    itemName: row.item_name,
    isCompleted: row.is_completed,
    assignedTo: row.assigned_to || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listChecklistByProject(projectId: number): Promise<WeddingDayChecklist[]> {
  const data = await apiFetch<any[]>(`/wedding-day-checklists/${projectId}`);
  return data.map(normalizeChecklist);
}

export async function setChecklistItemCompleted(id: number, isCompleted: boolean): Promise<WeddingDayChecklist> {
  const data = await apiFetch<any>(`/wedding-day-checklists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_completed: isCompleted, updated_at: new Date().toISOString() })
  });
  return normalizeChecklist(data);
}

export async function updateChecklistItemText(
  id: number,
  fields: { itemName?: string; category?: string },
): Promise<WeddingDayChecklist> {
  const payload: Record<string, unknown> = {
    ...(fields.itemName !== undefined ? { item_name: fields.itemName } : {}),
    ...(fields.category !== undefined ? { category: fields.category } : {}),
    updated_at: new Date().toISOString(),
  };

  const data = await apiFetch<any>(`/wedding-day-checklists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalizeChecklist(data);
}

export async function updateChecklistItemFields(
  id: number,
  fields: { itemName?: string; notes?: string | null; assignedTo?: string | null },
): Promise<WeddingDayChecklist> {
  const payload: Record<string, unknown> = {
    ...(fields.itemName !== undefined ? { item_name: fields.itemName } : {}),
    ...(fields.notes !== undefined ? { notes: fields.notes } : {}),
    ...(fields.assignedTo !== undefined ? { assigned_to: fields.assignedTo } : {}),
    updated_at: new Date().toISOString(),
  };

  const data = await apiFetch<any>(`/wedding-day-checklists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalizeChecklist(data);
}

export async function upsertChecklistItems(items: Partial<WeddingDayChecklist>[]): Promise<WeddingDayChecklist[]> {
  const toUpsert = items.map(item => ({
    project_id: item.projectId,
    category: item.category,
    item_name: item.itemName,
    is_completed: item.isCompleted ?? false,
    assigned_to: item.assignedTo || null,
    notes: item.notes || null,
    updated_at: new Date().toISOString(),
  }));

  const data = await apiFetch<any[]>('/wedding-day-checklists/upsert', {
    method: 'POST',
    body: JSON.stringify(toUpsert)
  });
  return data.map(normalizeChecklist);
}

export async function deleteChecklistItem(id: number): Promise<void> {
  await apiFetch(`/wedding-day-checklists/${id}`, { method: 'DELETE' });
}

export async function deleteChecklistItemsByProjectAndCategory(projectId: number, category: string): Promise<void> {
  await apiFetch('/wedding-day-checklists/delete-by-category', {
    method: 'POST',
    body: JSON.stringify({ projectId, category })
  });
}

export async function renameChecklistCategory(projectId: number, oldCategory: string, newCategory: string): Promise<void> {
  await apiFetch('/wedding-day-checklists/rename-category', {
    method: 'POST',
    body: JSON.stringify({ projectId, oldCategory, newCategory })
  });
}

export const DEFAULT_CHECKLIST_TEMPLATES = [
  { category: 'Persiapan', items: ['Cek perlengkapan makeup', 'Cek gaun/jas pengantin', 'Cek bunga tangan', 'Cek cincin'] },
  { category: 'Mempelai Pria', items: ['Foto detail aksesoris', 'Prosesi pemakaian jas', 'Foto bersama orang tua', 'Keberangkatan'] },
  { category: 'Mempelai Wanita', items: ['Foto makeup', 'Prosesi pemakaian gaun', 'Foto bersama bridesmaids', 'First look'] },
  { category: 'Foto Keluarga', items: ['Keluarga inti pria', 'Keluarga inti wanita', 'Keluarga besar', 'Sesi salaman'] },
  { category: 'Catering', items: ['Cek menu utama', 'Cek pondokan', 'Cek kebersihan area makan', 'Cek ketersediaan piring/sendok'] },
];

export async function initializeDefaultChecklist(projectId: number, customTemplates?: { category: string; items: string[] }[]): Promise<WeddingDayChecklist[]> {
  // Cek apakah sudah ada checklist untuk project ini
  const existing = await listChecklistByProject(projectId);
  if (existing.length > 0) {
    console.warn('Checklist already exists for this project, skipping initialization');
    return existing;
  }

  const templates = customTemplates && customTemplates.length > 0 ? customTemplates : DEFAULT_CHECKLIST_TEMPLATES;

  const items: Partial<WeddingDayChecklist>[] = [];
  templates.forEach(template => {
    template.items.forEach(itemName => {
      items.push({
        projectId,
        category: template.category,
        itemName,
        isCompleted: false,
      });
    });
  });

  return upsertChecklistItems(items);
}
